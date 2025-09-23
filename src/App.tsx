import React, { useState, useEffect, useCallback } from 'react';
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

// Enhanced interfaces for sophisticated state management
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
  // Core application state
  const [selectedDate, setSelectedDate] = useState('2023-08-29'); // Default to hottest research date
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced layer management state
  const [layers, setLayers] = useState<LayerState>({
    lstVisible: true,
    muhiCanopy40: true,
    muhiTop2Percent: true,
    groundTruth: false,
    landCover: false
  });

  // Layout and UI state
  const [layout, setLayout] = useState<LayoutState>({
    showStatistics: true,
    showGroundTruth: false,
    showLandCover: false,
    showDashboard: false,
    queryMode: false
  });

  // Interactive query state
  const [queryData, setQueryData] = useState<QueryData | null>(null);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);

  // Research data state
  const [temperatureData, setTemperatureData] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Research-based available dates
  const availableDates = ['2023-07-12', '2023-08-29', '2023-09-14'];

  // Enhanced data loading with research-specific simulation
  useEffect(() => {
    const loadResearchData = async () => {
      setIsLoading(true);
      // Simulate realistic research data loading
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate research-realistic temperature distribution data
      const generateTemperatureDistribution = (date: string) => {
        const baseTemp = date === '2023-08-29' ? 37.1 : date === '2023-07-12' ? 35.2 : 31.8;
        return Array.from({ length: 1000 }, () => {
          // Generate realistic LST distribution
          const temp = baseTemp + (Math.random() - 0.5) * 20;
          return Math.max(16, Math.min(44, temp));
        });
      };

      const researchData = generateTemperatureDistribution(selectedDate);
      setTemperatureData(researchData as any);
      setLastRefresh(new Date());
      setIsLoading(false);
    };

    loadResearchData();
  }, [selectedDate]);

  // Enhanced handlers for complex interactions
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!layout.queryMode) return;

    // Simulate temperature query based on research data and location
    const simulateTemperatureQuery = () => {
      const baseTemp = selectedDate === '2023-08-29' ? 37.1 : selectedDate === '2023-07-12' ? 35.2 : 31.8;
      const locationVariation = (Math.random() - 0.5) * 8;
      const temperature = Math.round((baseTemp + locationVariation) * 10) / 10;

      // Determine land cover based on rough LA geography
      const landCoverTypes = ['Buildings', 'Concrete', 'Dense Vegetation', 'Sparse Vegetation',
                             'Unvegetated Asphalt', 'Vegetated Asphalt', 'Water Body'];
      const landCover = landCoverTypes[Math.floor(Math.random() * landCoverTypes.length)];

      // Determine MUHI status based on temperature
      const muhiStatus = [];
      if (temperature >= 40) {
        muhiStatus.push('MUHI Detected: ≥40°C (Canopy Threshold)');
        muhiStatus.push('MUHI Detected: ≥39°C (Top 2% Threshold)');
      } else if (temperature >= 39) {
        muhiStatus.push('MUHI Detected: ≥39°C (Top 2% Threshold)');
      } else {
        muhiStatus.push('No MUHI Detected');
      }

      return { lat, lng, temperature, landCover, muhiStatus };
    };

    setQueryData(simulateTemperatureQuery());
  }, [layout.queryMode, selectedDate]);

  const handleStationSelect = useCallback((station: WeatherStation) => {
    setSelectedStation(station);
  }, []);

  const handleDataExport = useCallback(() => {
    // Simulate comprehensive data export
    const exportData = {
      date: selectedDate,
      muhiPolygons: 'muhi_polygons.geojson',
      lstRaster: 'lst_raster.tiff',
      statistics: 'muhi_statistics.csv',
      groundTruth: 'ground_truth_validation.csv',
      landCover: 'land_cover_classification.geojson'
    };

    console.log('Exporting MUHI analysis data:', exportData);
    // In a real implementation, this would trigger actual file downloads
    alert(`Exporting complete MUHI dataset for ${selectedDate}\n\nIncluded files:\n• MUHI polygons (GeoJSON)\n• LST raster data (GeoTIFF)\n• Statistical summary (CSV)\n• Ground truth data (CSV)\n• Land cover classification (GeoJSON)`);
  }, [selectedDate]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    console.log(`Toggling land cover category: ${categoryId}`);
    // In a real implementation, this would update map layers
  }, []);

  const handleOpacityChange = useCallback((categoryId: string, opacity: number) => {
    console.log(`Updating opacity for ${categoryId}: ${opacity}`);
    // In a real implementation, this would update layer opacity
  }, []);

  // Layout toggle handlers
  const toggleStatistics = () => setLayout(prev => ({ ...prev, showStatistics: !prev.showStatistics }));
  const toggleGroundTruth = () => setLayout(prev => ({ ...prev, showGroundTruth: !prev.showGroundTruth }));
  const toggleLandCover = () => setLayout(prev => ({ ...prev, showLandCover: !prev.showLandCover }));
  const toggleDashboard = () => setLayout(prev => ({ ...prev, showDashboard: !prev.showDashboard }));
  const toggleQueryMode = () => setLayout(prev => ({ ...prev, queryMode: !prev.queryMode }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Map Section */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-4">
                <h2 className="text-xl font-bold text-white">
                  Micro-Urban Heat Islands Analysis - Los Angeles
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Landsat 8 Collection 2 Level 2 | NDVI → Emissivity → LST | {selectedDate}
                </p>
              </div>
              <MapContainer
                selectedDate={selectedDate}
                layers={layers}
                queryMode={layout.queryMode}
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          {/* Enhanced Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <ControlPanel
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              layers={layers}
              setLayers={setLayers}
              queryMode={layout.queryMode}
              setQueryMode={toggleQueryMode}
              showStatistics={layout.showStatistics}
              setShowStatistics={toggleStatistics}
              onExportData={handleDataExport}
            />

            {/* Conditional sidebar components */}
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
                onCategoryToggle={handleCategoryToggle}
                onOpacityChange={handleOpacityChange}
              />
            )}
          </div>
        </div>

        {/* Enhanced Data Visualization Section */}
        <div className="mt-8 space-y-6">
          {/* Primary Analytics Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <DataVisualization
                selectedDate={selectedDate}
                isLoading={isLoading}
              />
            </div>

            <div className="xl:col-span-1">
              <TemperatureMetrics
                selectedDate={selectedDate}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Secondary Analytics Row */}
          {layout.showDashboard && (
            <div className="grid grid-cols-1 gap-6">
              <StatisticalDashboard
                selectedDate={selectedDate}
                isVisible={layout.showDashboard}
                onToggleVisibility={toggleDashboard}
                onExportData={handleDataExport}
                autoRefresh={true}
              />
            </div>
          )}

          {/* Quick access panel toggles */}
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

      {/* Interactive Query Modal */}
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