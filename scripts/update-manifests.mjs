import { promises as fs } from "fs";
import path from "path";
import { fromArrayBuffer } from "geotiff";

const DATA_ROOT = path.join("public", "data");
const DATES = ["20230712", "20230829", "20230914"];

const DEFAULT_BIN_START = 16;
const DEFAULT_BIN_END = 46; // exclusive
const BIN_SIZE = 1;
const PIXEL_AREA_M2 = 30 * 30;
const M2_PER_HA = 10000;

const loadJSON = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));
const saveJSON = async (filePath, json) => fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf8");

const calcStats = (values) => {
  if (!values.length) {
    return { min: null, max: null, mean: null, percentile98: null };
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  const mean = sum / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(0.98 * (sorted.length - 1)));
  const percentile98 = sorted[idx];

  return { min, max, mean, percentile98 };
};

const buildHistogram = (values) => {
  const binCount = Math.ceil((DEFAULT_BIN_END - DEFAULT_BIN_START) / BIN_SIZE);
  const bins = Array.from({ length: binCount }, (_, i) => ({
    binStart: DEFAULT_BIN_START + i * BIN_SIZE,
    binEnd: DEFAULT_BIN_START + (i + 1) * BIN_SIZE,
    pixels: 0
  }));

  for (const value of values) {
    const idx = Math.floor((value - DEFAULT_BIN_START) / BIN_SIZE);
    if (idx >= 0 && idx < bins.length) {
      bins[idx].pixels += 1;
    }
  }

  return { binSize: BIN_SIZE, bins };
};

const sumCounts = (features) => features.reduce((acc, feature) => {
  const count = Number(feature?.properties?.count ?? 0);
  return acc + (Number.isFinite(count) ? count : 0);
}, 0);

const toNumber = (value) => (value === null || value === undefined ? null : Number(value.toFixed(2)));

const processDate = async (date) => {
  const folder = path.join(DATA_ROOT, date);
  const manifestPath = path.join(folder, "manifest.json");
  const rasterPath = path.join(folder, `lst_${date}.tif`);
  const canopyPath = path.join(folder, "muhi-40c.geojson");
  const top2Path = path.join(folder, "muhi-top2.geojson");

  const manifest = await loadJSON(manifestPath);

  const rasterBuffer = await fs.readFile(rasterPath);
  const arrayBuffer = rasterBuffer.buffer.slice(
    rasterBuffer.byteOffset,
    rasterBuffer.byteOffset + rasterBuffer.byteLength
  );
  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const raster = await image.readRasters({ interleave: true });
  const nodata = image.getGDALNoData();

  const values = [];
  for (const value of raster) {
    if (value === null || Number.isNaN(value)) continue;
    if (nodata !== null && value === nodata) continue;
    values.push(value);
  }

  const stats = calcStats(values);
  const histogram = buildHistogram(values);

  const canopyGeo = await loadJSON(canopyPath);
  const top2Geo = await loadJSON(top2Path);

  const canopyPixels = sumCounts(canopyGeo.features ?? []);
  const top2Pixels = sumCounts(top2Geo.features ?? []);

  const canopyAreaHa = canopyPixels * PIXEL_AREA_M2 / M2_PER_HA;
  const top2AreaHa = top2Pixels * PIXEL_AREA_M2 / M2_PER_HA;

  manifest.raster = {
    ...manifest.raster,
    statistics: {
      min: toNumber(stats.min ?? null),
      max: toNumber(stats.max ?? null),
      mean: toNumber(stats.mean ?? null),
      percentile98: toNumber(stats.percentile98 ?? null)
    }
  };

  manifest.histogram = histogram;

  manifest.thresholds = {
    canopy40: {
      ...manifest.thresholds?.canopy40,
      path: "./muhi-40c.geojson",
      pixelCount: canopyPixels,
      areaHa: toNumber(canopyAreaHa)
    },
    top2percent: {
      ...manifest.thresholds?.top2percent,
      path: "./muhi-top2.geojson",
      pixelCount: top2Pixels,
      areaHa: toNumber(top2AreaHa),
      cutoffC: toNumber(stats.percentile98 ?? null)
    }
  };

  manifest.summary = {
    pixelCount: values.length,
    validPixels: values.length,
    mean: manifest.raster.statistics.mean,
    min: manifest.raster.statistics.min,
    max: manifest.raster.statistics.max
  };

  await saveJSON(manifestPath, manifest);
  console.log(`[ok] Updated manifest for ${date}`);
};

const main = async () => {
  for (const date of DATES) {
    await processDate(date);
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
