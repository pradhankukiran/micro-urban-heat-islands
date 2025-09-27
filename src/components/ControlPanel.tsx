import React, { useMemo, useState } from 'react';
import {
  Layers,
  Calendar,
  Settings,
  Eye,
  Target,
  Database,
  Thermometer,
  MapPin,
  TreePine,
  Building,
  BarChart3,
  Clock,
  Download,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { SceneInfo, SceneManifest } from '../services/dataset';

interface ControlPanelProps {
  selectedDate: string;
  scenes: SceneInfo[];
  manifest?: SceneManifest;
  setSelectedDate: (date: string) => void;
  layers: {
    lstVisible: boolean;
    muhiCanopy40: boolean;
    muhiTop2Percent: boolean;
    groundTruth: boolean;
    landCover: boolean;
  };
  setLayers: (layers: {
    lstVisible: boolean;
    muhiCanopy40: boolean;
    muhiTop2Percent: boolean;
    groundTruth: boolean;
    landCover: boolean;
  }) => void;
  queryMode: boolean;
  setQueryMode: (mode: boolean) => void;
  showStatistics: boolean;
  setShowStatistics: (show: boolean) => void;
  isDatasetLoading: boolean;
  onExportData?: () => void;
}

const SCENE_METADATA: Record<string, {
  acquisitionTime: string;
  landsatId: string;
  description: string;
}> = {
  '2023-07-12': {
    acquisitionTime: '11:28 LA Time',
    landsatId: 'LC08_041036_20230712',
    description: 'Summer baseline'
  },
  '2023-08-29': {
    acquisitionTime: '11:28 LA Time',
    landsatId: 'LC08_041036_20230829',
    description: 'Peak summer heat event'
  },
  '2023-09-14': {
    acquisitionTime: '11:28 LA Time',
    landsatId: 'LC08_041036_20230914',
    description: 'Late summer cooling'
  }
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedDate,
  scenes,
  manifest,
  setSelectedDate,
  layers,
  setLayers,
  queryMode,
  setQueryMode,
  showStatistics,
  setShowStatistics,
  isDatasetLoading,
  onExportData
}) => {
  const [expandedSections, setExpandedSections] = useState({
    temporal: true,
    layers: true,
    analysis: true,
    statistics: true
  });

  const sceneOptions = useMemo(() => {
    if (!scenes.length) {
      return [
        {
          date: selectedDate,
          label: selectedDate,
          acquisitionTime: '11:28 LA Time',
          landsatId: 'Unknown',
          description: 'Scene metadata unavailable'
        }
      ];
    }

    return scenes.map(scene => {
      const meta = SCENE_METADATA[scene.date] ?? {
        acquisitionTime: '11:28 LA Time',
        landsatId: scene.label,
        description: 'Landsat acquisition'
      };
      return {
        date: scene.date,
        label: scene.label,
        acquisitionTime: meta.acquisitionTime,
        landsatId: meta.landsatId,
        description: meta.description
      };
    });
  }, [scenes, selectedDate]);

  const currentStats = useMemo(() => {
    if (!manifest) {
      return null;
    }

    return {
      canopyPixels: manifest.thresholds.canopy40.pixelCount ?? null,
      top2Pixels: manifest.thresholds.top2percent.pixelCount ?? null,
      canopyArea: manifest.thresholds.canopy40.areaHa ?? null,
      top2Area: manifest.thresholds.top2percent.areaHa ?? null,
      min: manifest.raster.statistics.min,
      max: manifest.raster.statistics.max,
      mean: manifest.raster.statistics.mean,
      percentile98: manifest.raster.statistics.percentile98
    };
  }, [manifest]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers({ ...layers, [layerKey]: !layers[layerKey] });
  };

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden h-[468px] md:h-[584px] flex flex-col">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">MUHI Analysis Controls</h3>
        </div>
        <div className="text-xs text-slate-300 mt-1">
          Landsat 8 Collection 2 Level 2 | NDVI  LST Workflow
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Temporal Controls */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('temporal')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Acquisition Date</span>
              </div>
              {expandedSections.temporal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.temporal && (
              <div className="p-3 space-y-3">
                {sceneOptions.map(scene => (
                  <button
                    key={scene.date}
                    onClick={() => setSelectedDate(scene.date)}
                    className={`w-full text-left border p-3 transition-all ${
                      selectedDate === scene.date
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{scene.label}</div>
                        <div className="text-xs text-slate-500">{scene.acquisitionTime}</div>
                      </div>
                      <Calendar className={`w-4 h-4 ${selectedDate === scene.date ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-xs text-slate-500 mt-2">{scene.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Scene ID: {scene.landsatId}</div>
                  </button>
                ))}
                {isDatasetLoading && (
                  <div className="text-xs text-slate-500 italic">Loading scene data…</div>
                )}
              </div>
            )}
          </div>

          {/* Layer Controls */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('layers')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Map Layers</span>
              </div>
              {expandedSections.layers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.layers && (
              <div className="p-3 space-y-3">
                <button
                  onClick={() => toggleLayer('lstVisible')}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    layers.lstVisible ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Thermometer className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">Land Surface Temperature</div>
                    <div className="text-xs">GeoTIFF raster overlay</div>
                  </div>
                  {layers.lstVisible ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>

                <button
                  onClick={() => toggleLayer('muhiCanopy40')}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    layers.muhiCanopy40 ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">MUHI ≥ 40°C (Canopy)</div>
                    <div className="text-xs">Vector polygons of canopy exceedance</div>
                  </div>
                  {layers.muhiCanopy40 ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>

                <button
                  onClick={() => toggleLayer('muhiTop2Percent')}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    layers.muhiTop2Percent ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <TreePine className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">MUHI Top 2%</div>
                    <div className="text-xs">98th percentile hotspots</div>
                  </div>
                  {layers.muhiTop2Percent ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>

                <button
                  onClick={() => toggleLayer('groundTruth')}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    layers.groundTruth ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">Ground Truth Stations</div>
                    <div className="text-xs">23 validated weather stations</div>
                  </div>
                  {layers.groundTruth ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Analysis Tools */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('analysis')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Analysis Tools</span>
              </div>
              {expandedSections.analysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.analysis && (
              <div className="p-3 space-y-3">
                <button
                  onClick={() => setQueryMode(!queryMode)}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    queryMode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">Temperature Query Mode</div>
                    <div className="text-xs">Click map to sample LST</div>
                  </div>
                </button>

                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    showStatistics ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">Statistics Dashboard</div>
                    <div className="text-xs">Toggle analytics cards</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Live Statistics */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('statistics')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">MUHI Statistics</span>
              </div>
              {expandedSections.statistics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.statistics && (
              <div className="p-3 space-y-3">
                {isDatasetLoading && (
                  <div className="text-xs text-slate-500">Computing statistics…</div>
                )}

                {currentStats && !isDatasetLoading && (
                  <>
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">MUHI Detection Results</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-800">{currentStats.canopyPixels?.toLocaleString() ?? '—'}</div>
                          <div className="text-xs text-slate-600">Pixels ≥40°C</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{currentStats.top2Pixels?.toLocaleString() ?? '—'}</div>
                          <div className="text-xs text-slate-600">Pixels ≥98th percentile</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-green-50 p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Area Coverage</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Canopy Threshold:</span>
                          <span className="text-xs font-medium">{currentStats.canopyArea?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'} ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Top 2% Threshold:</span>
                          <span className="text-xs font-medium">{currentStats.top2Area?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'} ha</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Info className="w-3 h-3" />
                        LST Summary (°C)
                      </div>
                      <div className="flex justify-between">
                        <span>Min:</span>
                        <span>{currentStats.min ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mean:</span>
                        <span>{currentStats.mean ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span>{currentStats.max ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>98th percentile:</span>
                        <span>{currentStats.percentile98 ?? '—'}</span>
                      </div>
                    </div>
                  </>
                )}

                {!currentStats && !isDatasetLoading && (
                  <div className="text-xs text-slate-500">Select a scene to view statistics.</div>
                )}

                <div className="text-xs text-slate-500 p-2 bg-slate-50">
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="w-3 h-3" />
                    <span className="font-medium">Methodology</span>
                  </div>
                  <div>NDVI  emissivity  LST calculation using Landsat 8 Collection 2 Level 2. Polygon masks derived from ≥40°C threshold and 98th percentile.</div>
                </div>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={onExportData}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-600 text-white py-3 px-4 font-semibold hover:shadow-lg transition-shadow duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export MUHI Analysis
            </button>
            <div className="text-xs text-slate-500 text-center mt-2">
              GeoJSON polygons + LST rasters + manifest
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
