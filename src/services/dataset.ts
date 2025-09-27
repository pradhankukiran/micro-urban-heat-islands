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

  const [canopy, top2, raster, detailedMuhi] = await Promise.all([
    fetchGeoJSON(canopyUrl),
    fetchGeoJSON(top2Url),
    loadRaster(info, manifest),
    fetchGeoJSONOptional(detailedMuhiPath)
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
    }
  };
};

export const clearSceneCaches = () => {
  manifestCache.clear();
  geojsonCache.clear();
  rasterCache.clear();
  sceneIndexCache.value = null;
};
