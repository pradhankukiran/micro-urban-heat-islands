import { promises as fs } from 'fs';
import path from 'path';

const dates = ['20230712', '20230829', '20230914'];
const thresholds = [
  { id: 'muhi-40c', label: '40C' },
  { id: 'muhi-top2', label: 'TOP2' }
];

const dataRoot = path.join('public', 'data');

const normalize = (value) => {
  if (typeof value === 'string') {
    return value.trim().toUpperCase();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return null;
};

const ensureFeatureCollection = (input) => {
  if (!input || input.type !== 'FeatureCollection') {
    throw new Error('Source GeoJSON is not a FeatureCollection.');
  }
  if (!Array.isArray(input.features)) {
    throw new Error('Source GeoJSON is missing the features array.');
  }
  return input.features;
};

const filterFeatures = (features, target) => {
  return features.filter((feature) => {
    const properties = feature?.properties ?? {};
    const raw = properties.threshold ?? properties.THRESHOLD ?? properties.thr;
    const value = normalize(raw);

    if (!value) {
      return false;
    }

    if (value === target) {
      return true;
    }

    // Handle numeric encodings if present (1 => 40C, 2 => TOP2, etc.)
    if (target === '40C' && (value === '1' || value === 'MUHI_40C')) {
      return true;
    }
    if (target === 'TOP2' && (value === '2' || value === 'MUHI_TOP2')) {
      return true;
    }

    return false;
  });
};

const writeCollection = async (dest, features) => {
  const collection = {
    type: 'FeatureCollection',
    features
  };
  await fs.writeFile(dest, JSON.stringify(collection), 'utf8');
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  for (const date of dates) {
    const folder = path.join(dataRoot, date);
    const source = path.join(folder, `muhi_vec_${date}.geojson`);

    const exists = await fileExists(source);
    if (!exists) {
      console.warn(`[skip] Missing source GeoJSON for ${date} at ${source}`);
      continue;
    }

    const raw = JSON.parse(await fs.readFile(source, 'utf8'));
    const features = ensureFeatureCollection(raw);

    for (const threshold of thresholds) {
      const filtered = filterFeatures(features, threshold.label);
      const destination = path.join(folder, `${threshold.id}.geojson`);
      await writeCollection(destination, filtered);
      console.log(`[ok] ${date} → ${threshold.id}.geojson (${filtered.length} features)`);
    }
  }
};

main().catch((error) => {
  console.error('[error] Failed to split MUHI GeoJSON files');
  console.error(error);
  process.exitCode = 1;
});
