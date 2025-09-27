import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import ControlPanel from './components/ControlPanel';
import DataVisualization from './components/DataVisualization';
import ResearchInfo from './components/ResearchInfo';
import TemperatureMetrics from './components/TemperatureMetrics';
import InteractiveQuery from './components/InteractiveQuery';
import GroundTruthStations from './components/GroundTruthStations';
import LandCoverOverlay from './components/LandCoverOverlay';
import StatisticalDashboard from './components/StatisticalDashboard';
import {
  fetchSceneIndex,
  loadSceneDataset,
  type SceneDataset,
  type SceneInfo
} from './services/dataset';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';

interface LayerState {
  lstVisible: boolean;
  muhiCanopy40: boolean;
  muhiTop2Percent: boolean;
  groundTruth: boolean;
  landCover: boolean;
}

interface QueryData {
  lat: number;
  lng: number;
  temperature: number;
  landCover: string;
  muhiStatus: string[];
}

interface WeatherStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  type: 'PWS' | 'NOAA';
  temperature: Record<string, number>;
  lstTemperature: Record<string, number>;
  accuracy: 'High' | 'Medium' | 'Low';
  dataQuality: number;
  lastUpdate: string;
}

interface LayoutState {
  showStatistics: boolean;
  showGroundTruth: boolean;
  showLandCover: boolean;
  showDashboard: boolean;
  queryMode: boolean;
}

function App() {
  const [sceneOptions, setSceneOptions] = useState<SceneInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [dataset, setDataset] = useState<SceneDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerState>({
    lstVisible: true,
    muhiCanopy40: true,
    muhiTop2Percent: true,
    groundTruth: false,
    landCover: false
  });
  const [layout, setLayout] = useState<LayoutState>({
    showStatistics: true,
    showGroundTruth: false,
    showLandCover: false,
    showDashboard: false,
    queryMode: false
  });
  const [queryData, setQueryData] = useState<QueryData | null>(null);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load scene index on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const scenes = await fetchSceneIndex();
        if (!active) return;
        setSceneOptions(scenes);
        if (!selectedDate && scenes.length) {
          const preferred = scenes.find(scene => scene.date === '2023-08-29') ?? scenes[0];
          setSelectedDate(preferred.date);
        }
      } catch (error) {
        if (!active) return;
        setDataError((error as Error).message);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Load dataset when selected date changes
  useEffect(() => {
    if (!selectedDate) return;
    const scene = sceneOptions.find(item => item.date === selectedDate);
    if (!scene) return;

    let cancelled = false;
    setIsLoading(true);
    setDataError(null);
    setDataset(null);

    loadSceneDataset(scene)
      .then(data => {
        if (cancelled) return;
        setDataset(data);
        setLastRefresh(new Date());
      })
      .catch(error => {
        if (cancelled) return;
        setDataError((error as Error).message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, sceneOptions]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!layout.queryMode || !dataset) return;

    const temperature = await dataset.raster.sample(lat, lng);
    if (temperature === null) {
      setQueryData({
        lat,
        lng,
        temperature: NaN,
        landCover: 'Outside coverage',
        muhiStatus: ['No data available']
      });
      return;
    }

    const point = turfPoint([lng, lat]);
    const canopyHit = dataset.canopy.features?.some(feature => booleanPointInPolygon(point, feature as any)) ?? false;
    const top2Hit = dataset.top2.features?.some(feature => booleanPointInPolygon(point, feature as any)) ?? false;

    const roundedTemperature = Math.round(temperature * 10) / 10;
    const status: string[] = [];
    if (canopyHit) status.push('≥ 40°C Canopy Threshold');
    if (top2Hit) status.push('Top 2% Threshold');
    if (!status.length) status.push('Below MUHI thresholds');

    setQueryData({
      lat,
      lng,
      temperature: roundedTemperature,
      landCover: canopyHit || top2Hit ? 'Hotspot' : 'Background',
      muhiStatus: status
    });
  }, [layout.queryMode, dataset]);

  const handleStationSelect = useCallback((station: WeatherStation) => {
    setSelectedStation(station);
  }, []);

  const handleDataExport = useCallback(() => {
    if (!dataset) {
      window.alert('Load a scene before exporting data.');
      return;
    }

    const base = `/data/${dataset.info.date}`;
    const files = [
      { label: 'LST raster (GeoTIFF)', path: `${base}/${dataset.manifest.raster.path.replace(/^\.\//, '')}` },
      { label: 'MUHI ≥40°C polygons', path: `${base}/${dataset.manifest.thresholds.canopy40.path.replace(/^\.\//, '')}` },
      { label: 'MUHI Top 2% polygons', path: `${base}/${dataset.manifest.thresholds.top2percent.path.replace(/^\.\//, '')}` },
      { label: 'Scene manifest', path: `${base}/manifest.json` }
    ];

    const message = files
      .map(file => `${file.label}: ${file.path}`)
      .join('\n');

    window.alert(`Download the dataset files:\n\n${message}\n\nUse right-click → Save link as… if links do not open automatically.`);
  }, [dataset]);

  const toggleStatistics = () => setLayout(prev => ({ ...prev, showStatistics: !prev.showStatistics }));
  const toggleGroundTruth = () => setLayout(prev => ({ ...prev, showGroundTruth: !prev.showGroundTruth }));
  const toggleLandCover = () => setLayout(prev => ({ ...prev, showLandCover: !prev.showLandCover }));
  const toggleDashboard = () => setLayout(prev => ({ ...prev, showDashboard: !prev.showDashboard }));
  const toggleQueryMode = () => setLayout(prev => ({ ...prev, queryMode: !prev.queryMode }));

  const histogram = dataset?.manifest.histogram;
  const currentSceneLabel = useMemo(() => {
    const scene = sceneOptions.find(item => item.date === selectedDate);
    return scene?.label ?? selectedDate;
  }, [sceneOptions, selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-4">
                <h2 className="text-xl font-bold text-white">
                  Micro-Urban Heat Islands Analysis – {currentSceneLabel}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Landsat 8 Collection 2 Level 2 | NDVI → Emissivity → LST
                </p>
                {lastRefresh && (
                  <p className="text-[11px] text-blue-200 mt-1">Loaded {lastRefresh.toLocaleTimeString()}</p>
                )}
                {dataError && (
                  <p className="text-[11px] text-red-200 mt-1">{dataError}</p>
                )}
              </div>
              <MapContainer
                selectedDate={selectedDate}
                layers={layers}
                queryMode={layout.queryMode}
                onMapClick={handleMapClick}
                dataset={dataset}
              />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <ControlPanel
              selectedDate={selectedDate}
              scenes={sceneOptions}
              manifest={dataset?.manifest}
              setSelectedDate={setSelectedDate}
              layers={layers}
              setLayers={setLayers}
              queryMode={layout.queryMode}
              setQueryMode={toggleQueryMode}
              showStatistics={layout.showStatistics}
              setShowStatistics={toggleStatistics}
              isDatasetLoading={isLoading}
              onExportData={handleDataExport}
            />

            {layout.showGroundTruth && (
              <GroundTruthStations
                selectedDate={selectedDate}
                isVisible={layout.showGroundTruth}
                onToggleVisibility={toggleGroundTruth}
                onStationSelect={handleStationSelect}
              />
            )}

            {layout.showLandCover && (
              <LandCoverOverlay
                selectedDate={selectedDate}
                isVisible={layout.showLandCover}
                onToggleVisibility={toggleLandCover}
              />
            )}
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <DataVisualization
                dataset={dataset}
                isLoading={isLoading}
              />
            </div>

            <div className="xl:col-span-1">
              <TemperatureMetrics
                dataset={dataset}
                isLoading={isLoading}
              />
            </div>
          </div>

          {layout.showDashboard && (
            <div className="grid grid-cols-1 gap-6">
              <StatisticalDashboard
                dataset={dataset}
                isVisible={layout.showDashboard}
                onToggleVisibility={toggleDashboard}
                onExportData={handleDataExport}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={toggleGroundTruth}
              className={`px-4 py-2 text-sm font-medium border transition-colors ${
                layout.showGroundTruth
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Ground Truth Stations
            </button>
            <button
              onClick={toggleLandCover}
              className={`px-4 py-2 text-sm font-medium border transition-colors ${
                layout.showLandCover
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Land Cover Analysis
            </button>
            <button
              onClick={toggleDashboard}
              className={`px-4 py-2 text-sm font-medium border transition-colors ${
                layout.showDashboard
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Statistical Dashboard
            </button>
          </div>
        </div>

        
      </main>

      {queryData && (
        <InteractiveQuery
          queryData={queryData}
          onClose={() => setQueryData(null)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

export default App;
