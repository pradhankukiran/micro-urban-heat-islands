import React, { useState } from 'react';
import {
  Thermometer,
  AlertTriangle,
  TrendingUp,
  Database,
  MapPin,
  Building,
  TreePine,
  Target,
  BarChart3,
  CheckCircle,
  Info
} from 'lucide-react';

interface TemperatureMetricsProps {
  selectedDate: string;
  isLoading: boolean;
}

const TemperatureMetrics: React.FC<TemperatureMetricsProps> = ({ selectedDate, isLoading }) => {
  const [activeSection, setActiveSection] = useState<'muhi' | 'materials' | 'landcover' | 'validation'>('muhi');

  // Research statistics based on the PDFs
  const muhiStatistics = {
    '2023-07-12': {
      totalPixels: 1361392,
      canopy40Count: 2841,
      top2percentCount: 23362,
      canopy40Area: 4219.68,
      top2percentArea: 11144.40,
      maxTemp: 42,
      minTemp: 21,
      meanTemp: 35.2,
      percentile98: 39
    },
    '2023-08-29': {
      totalPixels: 1361392,
      canopy40Count: 2841,
      top2percentCount: 23362,
      canopy40Area: 4219.68,
      top2percentArea: 11144.40,
      maxTemp: 44,
      minTemp: 21,
      meanTemp: 37.1,
      percentile98: 39
    },
    '2023-09-14': {
      totalPixels: 1361392,
      canopy40Count: 1845,
      top2percentCount: 18924,
      canopy40Area: 3456.32,
      top2percentArea: 9234.12,
      maxTemp: 38,
      minTemp: 16,
      meanTemp: 31.8,
      percentile98: 37
    }
  };

  // Land cover areas from research (hectares)
  const landCoverAreas = [
    { type: 'Sparse Vegetation', area: 8736.90, color: '#9ACD32', code: 1 },
    { type: 'Dense Vegetation', area: 14003.01, color: '#228B22', code: 2 },
    { type: 'Vegetated Asphalt', area: 42190.93, color: '#696969', code: 3 },
    { type: 'Concrete', area: 7211.61, color: '#708090', code: 4 },
    { type: 'Water Body', area: 1340.83, color: '#4682B4', code: 5 },
    { type: 'Unvegetated Asphalt', area: 40821.17, color: '#2F4F4F', code: 6 },
    { type: 'Buildings', area: 8704.29, color: '#8B4513', code: 7 }
  ];

  // Material analysis from research
  const materialAnalysis = [
    { material: 'Buildings', canopy40: 3.91, top2percent: 16.46 },
    { material: 'Concrete', canopy40: 8.50, top2percent: 23.03 },
    { material: 'Dense Vegetation', canopy40: 0.00, top2percent: 0.01 },
    { material: 'Sparse Vegetation', canopy40: 0.07, top2percent: 0.66 },
    { material: 'Unvegetated Asphalt', canopy40: 9.07, top2percent: 11.01 },
    { material: 'Vegetated Asphalt', canopy40: 0.73, top2percent: 8.08 }
  ];

  const currentStats = muhiStatistics[selectedDate as keyof typeof muhiStatistics] || muhiStatistics['2023-08-29'];
  const totalLandCoverArea = landCoverAreas.reduce((sum, item) => sum + item.area, 0);

  if (isLoading) {
    return (
      <div className="bg-white shadow-xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200"></div>
          <div className="h-8 bg-slate-200"></div>
          <div className="h-4 bg-slate-200 w-3/4"></div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'muhi', label: 'MUHI Stats', icon: Target },
    { id: 'materials', label: 'Materials', icon: Building },
    { id: 'landcover', label: 'Land Cover', icon: TreePine },
    { id: 'validation', label: 'Validation', icon: CheckCircle }
  ];

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden h-[600px] flex flex-col">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Research Metrics</h3>
        </div>
        <div className="text-xs text-red-100 mt-1">
          Landsat 8 MUHI Analysis | {selectedDate}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex-shrink-0">
        <div className="flex">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">

        {/* MUHI Statistics */}
        {activeSection === 'muhi' && (
          <div className="space-y-4">
            {/* Primary MUHI Metrics */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">MUHI Detection Results</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-700">{currentStats.canopy40Count.toLocaleString()}</div>
                  <div className="text-xs text-red-600">Pixels ≥40°C</div>
                  <div className="text-xs text-slate-500">Canopy Threshold</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{currentStats.top2percentCount.toLocaleString()}</div>
                  <div className="text-xs text-orange-600">Pixels ≥39°C</div>
                  <div className="text-xs text-slate-500">Top 2% Threshold</div>
                </div>
              </div>
            </div>

            {/* Area Coverage */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Area Coverage</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Canopy Threshold:</span>
                  <span className="text-xs font-medium">{currentStats.canopy40Area.toFixed(1)} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Top 2% Threshold:</span>
                  <span className="text-xs font-medium">{currentStats.top2percentArea.toFixed(1)} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Study Area:</span>
                  <span className="text-xs font-medium">{totalLandCoverArea.toFixed(0)} ha</span>
                </div>
              </div>
            </div>

            {/* Temperature Range */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Temperature Range</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-700">{currentStats.maxTemp}°C</div>
                  <div className="text-xs text-slate-600">Maximum LST</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-700">{currentStats.meanTemp}°C</div>
                  <div className="text-xs text-slate-600">Mean LST</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Material Analysis */}
        {activeSection === 'materials' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Material MUHI Contribution</span>
            </div>
            {materialAnalysis.map((material, i) => (
              <div key={i} className="bg-slate-50 p-3 border border-slate-200">
                <div className="text-xs font-medium text-slate-800 mb-2">{material.material}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-600">≥40°C</div>
                    <div className="text-sm font-bold text-red-600">{material.canopy40}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">≥39°C</div>
                    <div className="text-sm font-bold text-orange-600">{material.top2percent}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Land Cover */}
        {activeSection === 'landcover' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <TreePine className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-slate-700">Land Cover Distribution</span>
            </div>
            {landCoverAreas.map((land, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: land.color }}
                  ></div>
                  <span className="text-xs font-medium text-slate-700">{land.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">{land.area.toFixed(0)} ha</div>
                  <div className="text-xs text-slate-500">{((land.area / totalLandCoverArea) * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Validation */}
        {activeSection === 'validation' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Ground Truth Validation</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Weather Stations:</span>
                  <span className="text-xs font-medium">23 PWS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Correlation (R²):</span>
                  <span className="text-xs font-medium text-green-700">0.94</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Mean Error:</span>
                  <span className="text-xs font-medium">±1.2°C</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Methodology</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>• NDVI → Emissivity → LST workflow</div>
                <div>• Landsat 8 Collection 2 Level 2</div>
                <div>• 30m spatial resolution</div>
                <div>• 11:28 LA Time acquisition</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Study Coverage</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Total Pixels:</span>
                  <span className="text-xs font-medium">{currentStats.totalPixels.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Los Angeles Area:</span>
                  <span className="text-xs font-medium">~1,215 km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Official LA Area:</span>
                  <span className="text-xs font-medium">1,215 km²</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TemperatureMetrics;