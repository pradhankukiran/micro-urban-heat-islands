import React, { useState } from 'react';
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

interface ControlPanelProps {
  selectedDate: string;
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
  onExportData?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedDate,
  setSelectedDate,
  layers,
  setLayers,
  queryMode,
  setQueryMode,
  showStatistics,
  setShowStatistics,
  onExportData
}) => {
  const [expandedSections, setExpandedSections] = useState({
    temporal: true,
    layers: true,
    analysis: true,
    statistics: true
  });

  // Research data - three specific Landsat 8 acquisition dates
  const availableDates = [
    {
      date: '2023-07-12',
      label: 'July 12, 2023',
      acquisitionTime: '11:28 LA Time',
      landsatId: 'LC08_041036_20230712',
      description: 'Summer baseline'
    },
    {
      date: '2023-08-29',
      label: 'August 29, 2023',
      acquisitionTime: '11:28 LA Time',
      landsatId: 'LC08_041036_20230829',
      description: 'Hottest month'
    },
    {
      date: '2023-09-14',
      label: 'September 14, 2023',
      acquisitionTime: '11:28 LA Time',
      landsatId: 'LC08_041036_20230914',
      description: 'Cooling period'
    }
  ];

  // Research statistics based on the PDFs
  const muhiStatistics = {
    '2023-07-12': { canopy40Count: 2841, top2percentCount: 23362, canopy40Area: 4219.68, top2percentArea: 11144.40 },
    '2023-08-29': { canopy40Count: 2841, top2percentCount: 23362, canopy40Area: 4219.68, top2percentArea: 11144.40 },
    '2023-09-14': { canopy40Count: 2841, top2percentCount: 23362, canopy40Area: 4219.68, top2percentArea: 11144.40 }
  };

  const currentStats = muhiStatistics[selectedDate as keyof typeof muhiStatistics];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers({ ...layers, [layerKey]: !layers[layerKey] });
  };

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">MUHI Analysis Controls</h3>
        </div>
        <div className="text-xs text-slate-300 mt-1">
          Landsat 8 Collection 2 Level 2 | NDVI → LST Workflow
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Temporal Controls */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('temporal')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Temporal Analysis</span>
              </div>
              {expandedSections.temporal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.temporal && (
              <div className="p-3 space-y-3">
                <div className="text-xs text-slate-600 mb-2">
                  Select Landsat 8 acquisition date for LST analysis
                </div>
                {availableDates.map(dateOption => (
                  <button
                    key={dateOption.date}
                    onClick={() => setSelectedDate(dateOption.date)}
                    className={`w-full text-left p-3 border-2 transition-all ${
                      selectedDate === dateOption.date
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{dateOption.label}</div>
                    <div className="text-xs text-slate-600">{dateOption.acquisitionTime}</div>
                    <div className="text-xs text-slate-500">{dateOption.description}</div>
                    <div className="text-xs text-slate-400 mt-1">{dateOption.landsatId}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer Management */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('layers')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Data Layers</span>
              </div>
              {expandedSections.layers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.layers && (
              <div className="p-3 space-y-3">
                {/* LST Layer */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.lstVisible}
                    onChange={() => toggleLayer('lstVisible')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Land Surface Temperature</div>
                    <div className="text-xs text-slate-600">NDVI → Emissivity → LST (°C)</div>
                  </div>
                </label>

                {/* MUHI Canopy 40°C */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.muhiCanopy40}
                    onChange={() => toggleLayer('muhiCanopy40')}
                    className="w-4 h-4 text-red-800"
                  />
                  <div className="w-4 h-4 bg-red-800"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">MUHI Canopy Threshold</div>
                    <div className="text-xs text-slate-600">≥40°C (Dense Vegetation Reference)</div>
                  </div>
                </label>

                {/* MUHI Top 2% */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.muhiTop2Percent}
                    onChange={() => toggleLayer('muhiTop2Percent')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div className="w-4 h-4 bg-orange-500"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">MUHI Top 2% Threshold</div>
                    <div className="text-xs text-slate-600">≥39°C (98th Percentile)</div>
                  </div>
                </label>

                {/* Ground Truth Stations */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.groundTruth}
                    onChange={() => toggleLayer('groundTruth')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Ground Truth Stations</div>
                    <div className="text-xs text-slate-600">23 Weather Stations (PWS)</div>
                  </div>
                </label>

                {/* Land Cover */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.landCover}
                    onChange={() => toggleLayer('landCover')}
                    className="w-4 h-4 text-green-600"
                  />
                  <TreePine className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Land Cover Classification</div>
                    <div className="text-xs text-slate-600">7 Categories (OSM-derived)</div>
                  </div>
                </label>
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
                {/* Temperature Query Mode */}
                <button
                  onClick={() => setQueryMode(!queryMode)}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    queryMode
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">Temperature Query Mode</div>
                    <div className="text-xs">Click map to get LST readings</div>
                  </div>
                </button>

                {/* Statistics Toggle */}
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className={`w-full flex items-center gap-3 p-3 border-2 transition-all ${
                    showStatistics
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">Statistics Dashboard</div>
                    <div className="text-xs">Show real-time analytics</div>
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

            {expandedSections.statistics && currentStats && (
              <div className="p-3 space-y-3">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">MUHI Detection Results</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-800">{currentStats.canopy40Count.toLocaleString()}</div>
                      <div className="text-xs text-slate-600">Pixels ≥40°C</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{currentStats.top2percentCount.toLocaleString()}</div>
                      <div className="text-xs text-slate-600">Pixels ≥39°C</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Area Coverage</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Canopy Threshold:</span>
                      <span className="text-xs font-medium">{currentStats.canopy40Area.toFixed(1)} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Top 2% Threshold:</span>
                      <span className="text-xs font-medium">{currentStats.top2percentArea.toFixed(1)} ha</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 p-2 bg-slate-50">
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="w-3 h-3" />
                    <span className="font-medium">Methodology</span>
                  </div>
                  <div>NDVI → Emissivity → LST calculation using Landsat 8 Collection 2 Level 2 data. Ground truth validation with 23 weather stations.</div>
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
              GeoJSON polygons + LST rasters + statistics
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ControlPanel;