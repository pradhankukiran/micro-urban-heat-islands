import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Thermometer,
  MapPin,
  Database,
  Clock,
  Download,
  Info,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  Building,
  TreePine,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StatisticalData {
  date: string;
  totalPixels: number;
  canopy40Count: number;
  top2percentCount: number;
  canopy40Area: number;
  top2percentArea: number;
  maxTemp: number;
  minTemp: number;
  meanTemp: number;
  percentile98: number;
}

interface GroundTruthData {
  stationCount: number;
  correlation: number;
  meanError: number;
  rmse: number;
}

interface MaterialAnalysis {
  material: string;
  canopy40: number;
  top2percent: number;
  area: number;
  riskLevel: 'High' | 'Medium' | 'Low';
}

interface StatisticalDashboardProps {
  selectedDate: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onExportData?: () => void;
  autoRefresh?: boolean;
}

const StatisticalDashboard: React.FC<StatisticalDashboardProps> = ({
  selectedDate,
  isVisible,
  onToggleVisibility,
  onExportData,
  autoRefresh = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'temporal' | 'validation' | 'materials' | 'export'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    realtime: true,
    trends: true,
    correlations: false,
    risks: false
  });

  const [refreshCount, setRefreshCount] = useState(0);

  // Research-based statistical data for all three dates
  const statisticalData: StatisticalData[] = [
    {
      date: '2023-07-12',
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
    {
      date: '2023-08-29',
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
    {
      date: '2023-09-14',
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
  ];

  const groundTruthData: GroundTruthData = {
    stationCount: 23,
    correlation: 0.94,
    meanError: 1.2,
    rmse: 1.8
  };

  const materialAnalysis: MaterialAnalysis[] = [
    { material: 'Buildings', canopy40: 3.91, top2percent: 16.46, area: 8704.29, riskLevel: 'Medium' },
    { material: 'Concrete', canopy40: 8.50, top2percent: 23.03, area: 7211.61, riskLevel: 'High' },
    { material: 'Dense Vegetation', canopy40: 0.00, top2percent: 0.01, area: 14003.01, riskLevel: 'Low' },
    { material: 'Sparse Vegetation', canopy40: 0.07, top2percent: 0.66, area: 8736.90, riskLevel: 'Low' },
    { material: 'Unvegetated Asphalt', canopy40: 9.07, top2percent: 11.01, area: 40821.17, riskLevel: 'High' },
    { material: 'Vegetated Asphalt', canopy40: 0.73, top2percent: 8.08, area: 42190.93, riskLevel: 'Medium' },
    { material: 'Water Body', canopy40: 0.00, top2percent: 0.00, area: 1340.83, riskLevel: 'Low' }
  ];

  const currentData = useMemo(() =>
    statisticalData.find(data => data.date === selectedDate) || statisticalData[1],
    [selectedDate]
  );

  const temporalTrends = useMemo(() => {
    const dates = statisticalData.map(d => d.date);
    const maxTemps = statisticalData.map(d => d.maxTemp);
    const meanTemps = statisticalData.map(d => d.meanTemp);
    const canopyAreas = statisticalData.map(d => d.canopy40Area);

    return {
      dates,
      maxTemps,
      meanTemps,
      canopyAreas,
      tempTrend: maxTemps[2] > maxTemps[0] ? 'increasing' : 'decreasing',
      muhiTrend: canopyAreas[2] > canopyAreas[0] ? 'increasing' : 'decreasing'
    };
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const simulateRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const getRiskBg = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'High': return 'bg-red-50 border-red-200';
      case 'Medium': return 'bg-orange-50 border-orange-200';
      case 'Low': return 'bg-green-50 border-green-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'temporal', label: 'Temporal', icon: TrendingUp },
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'materials', label: 'Materials', icon: Building },
    { id: 'export', label: 'Export', icon: Download }
  ];

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Statistical Dashboard</h3>
          </div>
          <div className="flex items-center gap-2">
            {autoRefresh && (
              <button
                onClick={simulateRefresh}
                className="text-white hover:text-purple-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleVisibility}
              className="text-white hover:text-purple-200 transition-colors"
            >
              {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="text-xs text-purple-100 mt-1">
          Real-time MUHI Analytics | {selectedDate} | Refresh #{refreshCount}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              {/* Real-time Statistics */}
              <div className="border border-slate-200">
                <button
                  onClick={() => toggleSection('realtime')}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Real-time MUHI Detection</span>
                  </div>
                  {expandedSections.realtime ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedSections.realtime && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 border border-red-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-700">{currentData.canopy40Count.toLocaleString()}</div>
                          <div className="text-xs text-red-600">Pixels ≥40°C</div>
                          <div className="text-xs text-slate-500">Canopy Threshold</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 border border-orange-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{currentData.top2percentCount.toLocaleString()}</div>
                          <div className="text-xs text-orange-600">Pixels ≥39°C</div>
                          <div className="text-xs text-slate-500">Top 2% Threshold</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 border border-blue-200">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-700">{currentData.canopy40Area.toFixed(1)} ha</div>
                          <div className="text-xs text-slate-600">Canopy Area</div>
                        </div>
                      </div>
                      <div className="bg-cyan-50 p-4 border border-cyan-200">
                        <div className="text-center">
                          <div className="text-xl font-bold text-cyan-700">{currentData.top2percentArea.toFixed(1)} ha</div>
                          <div className="text-xs text-slate-600">Top 2% Area</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-200">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-700">{currentData.maxTemp}°C</div>
                          <div className="text-xs text-slate-600">Max LST</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-700">{currentData.meanTemp}°C</div>
                          <div className="text-xs text-slate-600">Mean LST</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-700">{currentData.percentile98}°C</div>
                          <div className="text-xs text-slate-600">98th Percentile</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Assessment */}
              <div className="border border-slate-200">
                <button
                  onClick={() => toggleSection('risks')}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Risk Assessment</span>
                  </div>
                  {expandedSections.risks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedSections.risks && (
                  <div className="p-4 space-y-3">
                    {materialAnalysis
                      .filter(material => material.riskLevel === 'High')
                      .map((material, index) => (
                        <div key={index} className={`p-3 border ${getRiskBg(material.riskLevel)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{material.material}</span>
                            <span className={`text-xs font-medium ${getRiskColor(material.riskLevel)}`}>
                              {material.riskLevel} Risk
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Canopy: {material.canopy40}% | Top 2%: {material.top2percent}%
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Temporal Tab */}
          {activeTab === 'temporal' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Temporal Analysis</span>
                </div>
                <div className="space-y-3">
                  {statisticalData.map((data, index) => (
                    <div key={data.date} className={`p-3 border ${data.date === selectedDate ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{data.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">Max: {data.maxTemp}°C</span>
                          <span className="text-xs text-slate-600">Mean: {data.meanTemp}°C</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-xs">
                          <span className="text-slate-600">Canopy Area: </span>
                          <span className="font-medium">{data.canopy40Area.toFixed(0)} ha</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-600">Top 2% Area: </span>
                          <span className="font-medium">{data.top2percentArea.toFixed(0)} ha</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Trend Analysis</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Temperature Trend:</span>
                    <span className={`text-xs font-medium ${temporalTrends.tempTrend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                      {temporalTrends.tempTrend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">MUHI Area Trend:</span>
                    <span className={`text-xs font-medium ${temporalTrends.muhiTrend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                      {temporalTrends.muhiTrend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Ground Truth Validation</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{groundTruthData.correlation.toFixed(2)}</div>
                    <div className="text-xs text-slate-600">R² Correlation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">±{groundTruthData.meanError}°C</div>
                    <div className="text-xs text-slate-600">Mean Error</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600">{groundTruthData.stationCount}</div>
                    <div className="text-xs text-slate-600">Stations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{groundTruthData.rmse}°C</div>
                    <div className="text-xs text-slate-600">RMSE</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Validation Methodology</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>• 23 Personal Weather Stations (PWS) across LA area</div>
                  <div>• Landsat 8 LST vs ground temperature comparison</div>
                  <div>• 11:28 LA Time acquisition synchronization</div>
                  <div>• Statistical correlation analysis (R², RMSE, MAE)</div>
                  <div>• Spatial distribution validation</div>
                </div>
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Material MUHI Analysis</span>
              </div>
              {materialAnalysis.map((material, index) => (
                <div key={index} className={`p-3 border ${getRiskBg(material.riskLevel)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{material.material}</span>
                    <span className={`text-xs font-medium ${getRiskColor(material.riskLevel)}`}>
                      {material.riskLevel} Risk
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-slate-600">≥40°C</div>
                      <div className="text-sm font-bold text-red-600">{material.canopy40}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">≥39°C</div>
                      <div className="text-sm font-bold text-orange-600">{material.top2percent}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Area</div>
                      <div className="text-sm font-bold text-slate-700">{material.area.toFixed(0)} ha</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">Data Export Options</span>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={onExportData}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 font-semibold hover:shadow-lg transition-shadow duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Complete Dataset
                  </button>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>• MUHI polygon GeoJSON files</div>
                    <div>• LST raster data (GeoTIFF)</div>
                    <div>• Statistical summary (CSV)</div>
                    <div>• Ground truth validation data</div>
                    <div>• Material analysis results</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-2">Export Summary</div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>Current Date: {selectedDate}</div>
                  <div>Total Pixels: {currentData.totalPixels.toLocaleString()}</div>
                  <div>MUHI Pixels: {(currentData.canopy40Count + currentData.top2percentCount).toLocaleString()}</div>
                  <div>Ground Truth Stations: {groundTruthData.stationCount}</div>
                  <div>Land Cover Categories: {materialAnalysis.length}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StatisticalDashboard;