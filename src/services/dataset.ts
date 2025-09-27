import { fromArrayBuffer } from 'geotiff';
import parseGeoraster from 'georaster';
import type { GeoTIFFImage } from 'geotiff';
import type { FeatureCollection } from 'geojson';

export interface SceneInfo {
  date: string;
  label: string;
  manifest: string;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  pixels: number;
}

export interface Histogram {
  binSize: number;
  bins: HistogramBin[];
}

export interface ThresholdSummary {
  path: string;
  pixelCount: number | null;
  areaHa: number | null;
  cutoffC?: number | null;
}

export interface SceneManifest {
  baseUrl?: string;
  date: string;
  raster: {
    path: string;
    band: string;
    nodata: number | null;
    scaleMeters: number;
    crs: string;
    statistics: {
      min: number | null;
      max: number | null;
      mean: number | null;
      percentile98: number | null;
    };
    legend: {
      palette: string[];
      breaks: number[];
    };
  };
  thresholds: {
    canopy40: ThresholdSummary;
    top2percent: ThresholdSummary;
  };
  notes?: Record<string, unknown>;
  histogram?: Histogram;
  summary?: {
    pixelCount: number;
    validPixels: number;
    mean: number | null;
    min: number | null;
    max: number | null;
  };
}

interface SceneIndex {
  scenes: SceneInfo[];
}

export interface RasterData {
  url: string;
  image: GeoTIFFImage;
  georaster: any;
  sample: (lat: number, lng: number) => Promise<number | null>;
}

export interface WeatherStation {
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  type: 'PWS' | 'NOAA';
  accuracy: 'High' | 'Medium' | 'Low';
  dataQuality: number;
  lastUpdate: string;
  temperatures: Record<string, number>;
  lstTemperatures: Record<string, number>;
}

export interface LandCoverCategory {
  id: string;
  name: string;
  code: number;
  area: number;
  color: string;
  muhiContribution: {
    canopy40: number;
    top2percent: number;
  };
  description: string;
}

export interface SceneDataset {
  info: SceneInfo;
  manifest: SceneManifest;
  canopy: FeatureCollection;
  top2: FeatureCollection;
  raster: RasterData;
  detailedMuhi?: FeatureCollection | null;
  geojsonPropertyKeys: {
    threshold: string;
    count: string;
  };
  groundTruthStations?: WeatherStation[];
  landCover?: FeatureCollection;
  landCoverCategories?: LandCoverCategory[];
}

const sceneIndexCache: { value: SceneInfo[] | null } = { value: null };
const manifestCache = new Map<string, SceneManifest>();
const geojsonCache = new Map<string, FeatureCollection>();
const rasterCache = new Map<string, RasterData>();

const basePath = '/data';

const normaliseRelative = (relative: string) => relative.replace(/^\.\//, '').replace(/^\//, '');

const resolveUrl = (relative: string) => {
  if (relative.startsWith('http')) return relative;
  return `${basePath}/${normaliseRelative(relative)}`;
};

const resolveManifestPath = (manifest: SceneManifest, relative: string) => {
  const cleaned = normaliseRelative(relative);
  if (manifest.baseUrl) {
    return `${manifest.baseUrl}${cleaned}`;
  }
  return resolveUrl(relative);
};

export const fetchSceneIndex = async (): Promise<SceneInfo[]> => {
  if (sceneIndexCache.value) return sceneIndexCache.value;
  const response = await fetch(`${basePath}/index.json`);
  if (!response.ok) throw new Error('Failed to load scene index');
  const data = (await response.json()) as SceneIndex;
  sceneIndexCache.value = data.scenes;
  return data.scenes;
};

export const fetchManifest = async (info: SceneInfo): Promise<SceneManifest> => {
  if (manifestCache.has(info.date)) return manifestCache.get(info.date)!;
  const manifestUrl = resolveUrl(info.manifest);
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error(`Failed to load manifest for ${info.date}`);
  const manifest = (await response.json()) as SceneManifest;
  const baseUrl = manifestUrl.replace(/\/[^/]*$/, '/');
  manifest.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  manifestCache.set(info.date, manifest);
  return manifest;
};

const fetchGeoJSON = async (url: string): Promise<FeatureCollection> => {
  if (geojsonCache.has(url)) return geojsonCache.get(url)!;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load GeoJSON: ${url}`);
  const data = (await response.json()) as FeatureCollection;
  geojsonCache.set(url, data);
  return data;
};

const fetchGeoJSONOptional = async (url: string): Promise<FeatureCollection | null> => {
  try {
    return await fetchGeoJSON(url);
  } catch {
    return null;
  }
};

const createSampler = (image: GeoTIFFImage, nodata: number | null) => {
  const [minX, minY, maxX, maxY] = image.getBoundingBox();
  const width = image.getWidth();
  const height = image.getHeight();
  const pixelWidth = (maxX - minX) / width;
  const pixelHeight = (maxY - minY) / height;

  return async (lat: number, lng: number): Promise<number | null> => {
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) return null;

    const column = Math.floor((lng - minX) / pixelWidth);
    const row = Math.floor((maxY - lat) / Math.abs(pixelHeight));

    if (column < 0 || column >= width || row < 0 || row >= height) return null;

    const window = [column, row, column + 1, row + 1] as [number, number, number, number];
    const result = await image.readRasters({ window, interleave: true });
    const value = result[0];
    if (value === null || Number.isNaN(value)) return null;
    if (nodata !== null && value === nodata) return null;
    return value;
  };
};

const loadRaster = async (info: SceneInfo, manifest: SceneManifest): Promise<RasterData> => {
  if (rasterCache.has(info.date)) {
    return rasterCache.get(info.date)!;
  }

  const rasterUrl = resolveManifestPath(manifest, manifest.raster.path);
  const response = await fetch(rasterUrl);
  if (!response.ok) throw new Error(`Failed to load raster for ${info.date}`);
  const arrayBuffer = await response.arrayBuffer();

  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const georaster = await parseGeoraster(arrayBuffer);

  const sampler = createSampler(image, manifest.raster.nodata ?? null);

  const rasterData: RasterData = {
    url: rasterUrl,
    image,
    georaster,
    sample: sampler
  };

  rasterCache.set(info.date, rasterData);
  return rasterData;
};

export const loadSceneDataset = async (info: SceneInfo): Promise<SceneDataset> => {
  const manifest = await fetchManifest(info);

  const canopyUrl = resolveManifestPath(manifest, manifest.thresholds.canopy40.path);
  const top2Url = resolveManifestPath(manifest, manifest.thresholds.top2percent.path);

  const notes = manifest.notes as Record<string, unknown> | undefined;
  const thresholdProperty = typeof notes?.['geojsonThresholdProperty'] === 'string'
    ? (notes!['geojsonThresholdProperty'] as string)
    : 'threshold';
  const countProperty = typeof notes?.['geojsonCountProperty'] === 'string'
    ? (notes!['geojsonCountProperty'] as string)
    : 'count';

  const detailedMuhiPath = (() => {
    const notesValue = notes?.['detailedMuhiPath'];
    if (typeof notesValue === 'string' && notesValue.trim().length) {
      return resolveManifestPath(manifest, notesValue);
    }
    const compactDate = info.date.replace(/-/g, '');
    const candidate = `./muhi_vec_${compactDate}.geojson`;
    return resolveManifestPath(manifest, candidate);
  })();

  const [canopy, top2, raster, detailedMuhi, groundTruthStations, landCoverData] = await Promise.all([
    fetchGeoJSON(canopyUrl),
    fetchGeoJSON(top2Url),
    loadRaster(info, manifest),
    fetchGeoJSONOptional(detailedMuhiPath),
    fetchGroundTruthStations(),
    fetchLandCoverData()
  ]);

  return {
    info,
    manifest,
    canopy,
    top2,
    raster,
    detailedMuhi,
    geojsonPropertyKeys: {
      threshold: thresholdProperty,
      count: countProperty
    },
    groundTruthStations,
    landCover: landCoverData.features,
    landCoverCategories: landCoverData.categories
  };
};

const groundTruthCache: { value: WeatherStation[] | null } = { value: null };
const landCoverCache: { value: { features: FeatureCollection; categories: LandCoverCategory[] } | null } = { value: null };

const parseCSVToStations = (csvText: string): WeatherStation[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const station: any = {};

    headers.forEach((header, index) => {
      station[header] = values[index];
    });

    return {
      stationId: station.station_id,
      name: station.name,
      lat: parseFloat(station.lat),
      lng: parseFloat(station.lng),
      elevation: parseInt(station.elevation),
      type: station.type as 'PWS' | 'NOAA',
      accuracy: station.accuracy as 'High' | 'Medium' | 'Low',
      dataQuality: parseInt(station.data_quality),
      lastUpdate: station.last_update,
      temperatures: {
        '2023-07-12': parseFloat(station.temp_2023_07_12),
        '2023-08-29': parseFloat(station.temp_2023_08_29),
        '2023-09-14': parseFloat(station.temp_2023_09_14)
      },
      lstTemperatures: {
        '2023-07-12': parseFloat(station.lst_temp_2023_07_12),
        '2023-08-29': parseFloat(station.lst_temp_2023_08_29),
        '2023-09-14': parseFloat(station.lst_temp_2023_09_14)
      }
    };
  });
};

export const fetchGroundTruthStations = async (): Promise<WeatherStation[]> => {
  if (groundTruthCache.value) return groundTruthCache.value;

  const response = await fetch(`${basePath}/ground_truth_stations.csv`);
  if (!response.ok) throw new Error('Failed to load ground truth stations');

  const csvText = await response.text();
  const stations = parseCSVToStations(csvText);
  groundTruthCache.value = stations;
  return stations;
};

export const fetchLandCoverData = async (): Promise<{ features: FeatureCollection; categories: LandCoverCategory[] }> => {
  if (landCoverCache.value) return landCoverCache.value;

  const response = await fetch(`${basePath}/land_cover_classification.geojson`);
  if (!response.ok) throw new Error('Failed to load land cover classification');

  const featureCollection = (await response.json()) as FeatureCollection;

  const categories: LandCoverCategory[] = featureCollection.features.map(feature => ({
    id: feature.properties?.id || '',
    name: feature.properties?.name || '',
    code: feature.properties?.code || 0,
    area: feature.properties?.area_ha || 0,
    color: feature.properties?.color || '#cccccc',
    muhiContribution: {
      canopy40: feature.properties?.muhi_contribution_canopy40 || 0,
      top2percent: feature.properties?.muhi_contribution_top2 || 0
    },
    description: feature.properties?.description || ''
  }));

  const result = { features: featureCollection, categories };
  landCoverCache.value = result;
  return result;
};

export const clearSceneCaches = () => {
  manifestCache.clear();
  geojsonCache.clear();
  rasterCache.clear();
  sceneIndexCache.value = null;
  groundTruthCache.value = null;
  landCoverCache.value = null;
};
