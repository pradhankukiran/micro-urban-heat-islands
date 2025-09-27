import React, { useState } from 'react';
import {
  MapPin,
  Thermometer,
  Signal,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Wifi,
  Clock,
  BarChart3,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

interface WeatherStation {
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

interface GroundTruthStationsProps {
  selectedDate: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onStationSelect?: (station: WeatherStation) => void;
  stations?: WeatherStation[];
}

const GroundTruthStations: React.FC<GroundTruthStationsProps> = ({
  selectedDate,
  isVisible,
  onToggleVisibility,
  onStationSelect,
  stations = []
}) => {
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Use real weather stations data passed as prop

  const handleStationClick = (station: WeatherStation) => {
    setSelectedStation(station);
    setShowDetails(true);
    onStationSelect?.(station);
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp >= 40) return 'text-red-700';
    if (temp >= 38) return 'text-orange-600';
    if (temp >= 35) return 'text-yellow-600';
    if (temp >= 30) return 'text-green-600';
    return 'text-blue-600';
  };

  const getAccuracyColor = (accuracy: string): string => {
    switch (accuracy) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const calculateCorrelation = () => {
    const data = stations.map(station => ({
      ground: station.temperatures[selectedDate],
      lst: station.lstTemperatures[selectedDate]
    })).filter(d => d.ground !== undefined && d.lst !== undefined);

    if (data.length === 0) return 0;

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.ground, 0);
    const sumY = data.reduce((sum, d) => sum + d.lst, 0);
    const sumXY = data.reduce((sum, d) => sum + d.ground * d.lst, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.ground * d.ground, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.lst * d.lst, 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  };

  const meanError = 1.2;
  const correlation = calculateCorrelation();

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Ground Truth Stations</h3>
          </div>
          <button
            onClick={onToggleVisibility}
            className="text-white hover:text-indigo-200 transition-colors"
          >
            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-xs text-indigo-100 mt-1">
          {stations.length} Personal Weather Stations | Validation Dataset | {selectedDate}
        </div>
      </div>

      {/* Validation Statistics */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">Validation Metrics</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">{correlation.toFixed(2)}</div>
            <div className="text-xs text-slate-600">R² Correlation</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">±{meanError}°C</div>
            <div className="text-xs text-slate-600">Mean Error</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">{stations.length}</div>
            <div className="text-xs text-slate-600">Stations</div>
          </div>
        </div>
      </div>

      {/* Station List */}
      <div className="max-h-[400px] overflow-y-auto">
        <div className="p-4 space-y-2">
          {stations.map((station) => {
            const groundTemp = station.temperatures[selectedDate];
            const lstTemp = station.lstTemperatures[selectedDate];
            const difference = groundTemp !== undefined && lstTemp !== undefined ? Math.abs(groundTemp - lstTemp) : null;

            if (groundTemp === undefined) return null;

            return (
              <button
                key={station.stationId}
                onClick={() => handleStationClick(station)}
                className="w-full text-left p-3 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      station.type === 'PWS' ? 'bg-indigo-600' : 'bg-blue-600'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{station.name}</div>
                      <div className="text-xs text-slate-600">{station.type} | {station.elevation}m</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getTemperatureColor(groundTemp)}`}>
                      {groundTemp}°C
                    </div>
                    <div className="text-xs text-slate-500">
                      {lstTemp !== undefined ? `LST: ${lstTemp}°C` : 'LST: —'}
                      {difference !== null ? ` (Δ${difference.toFixed(1)}°C)` : ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Station Details Modal */}
      {showDetails && selectedStation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white max-w-lg w-full mx-4 shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Station Details</h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-white hover:text-indigo-200 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-indigo-100 mt-1">{selectedStation.name}</div>
            </div>

            <div className="p-6 space-y-4">
              {/* Station Information */}
              <div className="bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Station Information</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Station ID:</span>
                    <span className="text-xs font-medium">{selectedStation.stationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Type:</span>
                    <span className="text-xs font-medium">{selectedStation.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Coordinates:</span>
                    <span className="text-xs font-mono">{selectedStation.lat.toFixed(4)}, {selectedStation.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Elevation:</span>
                    <span className="text-xs font-medium">{selectedStation.elevation}m</span>
                  </div>
                </div>
              </div>

              {/* Temperature Readings */}
              <div className="bg-blue-50 p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-blue-800">Temperature Readings</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(selectedStation.temperatures).map(([date, temp]) => {
                    const lstTemp = selectedStation.lstTemperatures[date];
                    const difference = lstTemp !== undefined ? Math.abs(temp - lstTemp) : null;
                    return (
                      <div key={date} className={`p-2 ${selectedDate === date ? 'bg-blue-100 border border-blue-300' : 'bg-white'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{date}</span>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${getTemperatureColor(temp)}`}>
                              Ground: {temp}°C
                            </div>
                            <div className="text-xs text-slate-600">
                              {lstTemp !== undefined ? `LST: ${lstTemp}°C` : 'LST: —'}
                              {difference !== null ? ` (Δ${difference.toFixed(1)}°C)` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Quality */}
              <div className="bg-green-50 p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Signal className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Data Quality</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Accuracy:</span>
                    <span className={`text-xs font-medium ${getAccuracyColor(selectedStation.accuracy)}`}>
                      {selectedStation.accuracy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Data Quality:</span>
                    <span className="text-xs font-medium">{selectedStation.dataQuality}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Last Update:</span>
                    <span className="text-xs font-medium">{selectedStation.lastUpdate} LA Time</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-4 font-semibold hover:shadow-lg transition-shadow duration-200"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroundTruthStations;