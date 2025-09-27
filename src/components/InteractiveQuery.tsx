import React from 'react';
import {
  Target,
  Thermometer,
  MapPin,
  TreePine,
  X,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react';

interface QueryFeatureDetail {
  id?: string | number;
  thresholdLabel: string;
  pixelCount: number | null;
  areaHa: number | null;
}

interface QueryData {
  lat: number;
  lng: number;
  temperature: number;
  landCover: string;
  muhiStatus: string[];
  canopyHits: QueryFeatureDetail[];
  top2Hits: QueryFeatureDetail[];
}

interface InteractiveQueryProps {
  queryData: QueryData | null;
  onClose: () => void;
  selectedDate: string;
}

const ACQUISITION_TIMES: Record<string, string> = {
  '2023-07-12': '11:28 LA Time',
  '2023-08-29': '11:28 LA Time',
  '2023-09-14': '11:28 LA Time'
};

const InteractiveQuery: React.FC<InteractiveQueryProps> = ({
  queryData,
  onClose,
  selectedDate
}) => {
  if (!queryData) {
    return null;
  }

  const getLandCoverColor = (landCover: string): string => {
    switch (landCover) {
      case 'Buildings':
      case 'Hotspot':
        return '#8B4513';
      case 'Concrete':
        return '#708090';
      case 'Dense Vegetation':
        return '#228B22';
      case 'Sparse Vegetation':
        return '#9ACD32';
      case 'Unvegetated Asphalt':
        return '#2F4F4F';
      case 'Vegetated Asphalt':
        return '#696969';
      case 'Water Body':
        return '#4682B4';
      default:
        return '#94a3b8';
    }
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp >= 40) return 'text-red-700';
    if (temp >= 38) return 'text-orange-600';
    if (temp >= 34) return 'text-yellow-600';
    if (temp >= 30) return 'text-green-600';
    return 'text-blue-600';
  };

  const getTemperatureBackground = (temp: number): string => {
    if (temp >= 40) return 'bg-red-50 border-red-200';
    if (temp >= 38) return 'bg-orange-50 border-orange-200';
    if (temp >= 34) return 'bg-yellow-50 border-yellow-200';
    if (temp >= 30) return 'bg-green-50 border-green-200';
    return 'bg-blue-50 border-blue-200';
  };

  const formatCoordinate = (coord: number, isLat: boolean): string => {
    const abs = Math.abs(coord);
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${abs.toFixed(4)}° ${direction}`;
  };

  const acquisitionTime = ACQUISITION_TIMES[selectedDate] ?? '11:28 LA Time';

  const hasCanopy = queryData.muhiStatus.some(status => status.toLowerCase().includes('40'));
  const hasTop2 = queryData.muhiStatus.some(status => status.toLowerCase().includes('top 2'));
  const canopyDetails = queryData.canopyHits ?? [];
  const top2Details = queryData.top2Hits ?? [];
  const hasCanopyDetails = canopyDetails.length > 0;
  const hasTop2Details = top2Details.length > 0;
  const hasDetailedHits = hasCanopyDetails || hasTop2Details;
  const formatPixels = (value: number | null) => (value !== null ? value.toLocaleString() : '—');
  const formatArea = (value: number | null) => (value !== null ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha` : null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-md w-full mx-4 shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Temperature Query</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs text-blue-100 mt-1">
            LST Analysis | {selectedDate} {acquisitionTime}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Location</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Latitude:</span>
                <span className="text-xs font-medium">{formatCoordinate(queryData.lat, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Longitude:</span>
                <span className="text-xs font-medium">{formatCoordinate(queryData.lng, false)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Decimal:</span>
                <span className="text-xs font-mono">{queryData.lat.toFixed(4)}, {queryData.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 border ${getTemperatureBackground(queryData.temperature)}`}>
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-slate-700">Land Surface Temperature</span>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${getTemperatureColor(queryData.temperature)}`}>
                {Number.isFinite(queryData.temperature) ? `${queryData.temperature.toFixed(1)}°C` : 'No Data'}
              </div>
              <div className="text-xs text-slate-600">Landsat 8 LST (30 m)
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <TreePine className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-slate-700">Land Cover Classification</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getLandCoverColor(queryData.landCover) }}
              />
              <span className="text-sm font-medium text-slate-800">{queryData.landCover}</span>
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Real-time classification based on land cover polygons.
            </div>
          </div>

          <div className={`p-4 border ${
            hasCanopy ? 'bg-red-50 border-red-200' : hasTop2 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">MUHI Status</span>
            </div>
            <div className="space-y-2">
              {queryData.muhiStatus.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status.toLowerCase().includes('40') ? 'bg-red-600' :
                    status.toLowerCase().includes('top 2') ? 'bg-orange-500' :
                    'bg-green-600'
                  }`} />
                  <span className={`text-sm ${
                    status.toLowerCase().includes('40') ? 'text-red-700 font-medium' :
                    status.toLowerCase().includes('top 2') ? 'text-orange-700 font-medium' :
                    'text-green-700'
                  }`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
            {hasDetailedHits && (
              <div className="mt-4 bg-white border border-slate-200 rounded p-3 space-y-3">
                {hasCanopyDetails && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-red-700">≥ 40°C polygons</p>
                    {canopyDetails.slice(0, 3).map((detail, index) => {
                      const areaLabel = formatArea(detail.areaHa);
                      return (
                        <div
                          key={`canopy-${detail.id ?? index}`}
                          className="flex justify-between text-[11px] text-slate-600"
                        >
                          <span className="truncate pr-2">{detail.thresholdLabel}</span>
                          <span className="whitespace-nowrap">
                            {formatPixels(detail.pixelCount)}
                            {areaLabel ? <span className="text-slate-500"> · {areaLabel}</span> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {hasTop2Details && (
                  <div className={`space-y-1 ${hasCanopyDetails ? 'mt-3' : ''}`}>
                    <p className="text-[11px] font-semibold text-orange-700">Top 2% polygons</p>
                    {top2Details.slice(0, 3).map((detail, index) => {
                      const areaLabel = formatArea(detail.areaHa);
                      return (
                        <div
                          key={`top2-${detail.id ?? index}`}
                          className="flex justify-between text-[11px] text-slate-600"
                        >
                          <span className="truncate pr-2">{detail.thresholdLabel}</span>
                          <span className="whitespace-nowrap">
                            {formatPixels(detail.pixelCount)}
                            {areaLabel ? <span className="text-slate-500"> · {areaLabel}</span> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(canopyDetails.length > 3 || top2Details.length > 3) && (
                  <p className="text-[10px] text-slate-500">Showing top 3 polygons for this location.</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Data Information</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Landsat 8 Collection 2 Level 2</div>
              <div>• NDVI → Emissivity → LST workflow</div>
              <div>• Acquisition: {selectedDate} at {acquisitionTime}</div>
              <div>• Spatial resolution: 30 metres</div>
              <div>• CRS: WGS84 (EPSG:4326)</div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">MUHI Thresholds</div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <span>Canopy Threshold: ≥ 40°C</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Top 2% Threshold: ≥ 98th percentile</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-600 text-white py-3 px-4 font-semibold hover:shadow-lg transition-shadow duration-200 flex items-center justify-center gap-2"
            >
              Close Query
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuery;
