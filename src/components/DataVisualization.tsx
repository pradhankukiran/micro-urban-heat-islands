import React, { useMemo, useState } from 'react';
import {
  Thermometer,
  BarChart3,
  TrendingUp,
  Activity,
  MapPin,
  Target,
  Database,
  Info
} from 'lucide-react';
import type { SceneDataset } from '../services/dataset';

interface DataVisualizationProps {
  dataset: SceneDataset | null;
  isLoading: boolean;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ dataset, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'histogram' | 'thresholds' | 'summary'>('histogram');

  const histogram = dataset?.manifest.histogram;
  const statistics = dataset?.manifest.raster.statistics;
  const thresholds = dataset?.manifest.thresholds;

  const sections = [
    { id: 'histogram', label: 'Histogram', icon: BarChart3 },
    { id: 'thresholds', label: 'MUHI Thresholds', icon: Target },
    { id: 'summary', label: 'Summary', icon: Info }
  ] as const;

  const maxPixels = useMemo(() => {
    if (!histogram) return 0;
    return histogram.bins.reduce((max, bin) => Math.max(max, bin.pixels), 0);
  }, [histogram]);

  if (isLoading) {
    return (
      <div className="bg-white shadow-xl border border-slate-200 p-6 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="text-slate-600 text-sm">Processing Landsat 8 scene…</p>
        </div>
      </div>
    );
  }

  if (!dataset || !histogram) {
    return (
      <div className="bg-white shadow-xl border border-slate-200 p-6 h-full flex items-center justify-center">
        <p className="text-slate-500 text-sm">Select a scene to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden h-[620px] flex flex-col">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">LST Analytics</h3>
        </div>
        <div className="text-xs text-red-100 mt-1">
          Landsat 8 MUHI Analysis | {dataset.info.label}
        </div>
      </div>

      <div className="border-b border-slate-200 flex-shrink-0">
        <div className="flex">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === section.id
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

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'histogram' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-600" />
              <h4 className="font-semibold text-slate-800 text-sm">LST Pixel Distribution</h4>
              <span className="text-xs text-slate-500">Total pixels: {histogram.bins.reduce((sum, bin) => sum + bin.pixels, 0).toLocaleString()}</span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-red-50 p-4 border border-slate-200">
              <div className="grid grid-cols-12 gap-1 mb-4">
                {histogram.bins.map((bin, index) => (
                  <div key={`${bin.binStart}-${index}`} className="text-center">
                    <div
                      className="bg-gradient-to-t from-blue-500 to-red-500 mb-1"
                      style={{
                        height: `${maxPixels ? Math.max(4, (bin.pixels / maxPixels) * 120) : 4}px`,
                        opacity: bin.binStart >= 40 ? 1 : bin.binStart >= 39 ? 0.8 : 0.6
                      }}
                    />
                    <div className="text-[10px] text-slate-500">{bin.binStart}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="bg-red-100 p-3">
                  <div className="text-sm font-semibold text-red-800">≥40°C Pixels</div>
                  <div className="text-base font-bold text-red-700">
                    {thresholds?.canopy40.pixelCount?.toLocaleString() ?? '—'}
                  </div>
                </div>
                <div className="bg-orange-100 p-3">
                  <div className="text-sm font-semibold text-orange-800">Top 2% Pixels</div>
                  <div className="text-base font-bold text-orange-700">
                    {thresholds?.top2percent.pixelCount?.toLocaleString() ?? '—'}
                  </div>
                </div>
                <div className="bg-blue-100 p-3">
                  <div className="text-sm font-semibold text-blue-800">98th Percentile</div>
                  <div className="text-base font-bold text-blue-700">
                    {thresholds?.top2percent.cutoffC ?? statistics?.percentile98 ?? '—'}°C
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'thresholds' && thresholds && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <h4 className="font-semibold text-slate-800 text-sm">MUHI Threshold Coverage</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 p-4">
                <div className="text-xs text-red-600 font-semibold">Canopy ≥40°C</div>
                <div className="text-2xl font-bold text-red-800 mt-2">{thresholds.canopy40.areaHa?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha</div>
                <div className="text-xs text-slate-600 mt-1">{thresholds.canopy40.pixelCount?.toLocaleString() ?? '—'} pixels</div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4">
                <div className="text-xs text-orange-600 font-semibold">Top 2% (≥98th percentile)</div>
                <div className="text-2xl font-bold text-orange-700 mt-2">{thresholds.top2percent.areaHa?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha</div>
                <div className="text-xs text-slate-600 mt-1">{thresholds.top2percent.pixelCount?.toLocaleString() ?? '—'} pixels</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">Interpretation</p>
              <p>Canopy hotspots denote surfaces that reached or exceeded 40°C. Top 2% hotspots highlight the warmest 98th percentile pixels for the selected acquisition.</p>
            </div>
          </div>
        )}

        {activeTab === 'summary' && statistics && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-slate-800 text-sm">Temperature Summary</h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Minimum" value={statistics.min} icon={<Activity className="w-4 h-4 text-slate-600" />} />
              <SummaryCard label="Mean" value={statistics.mean} icon={<TrendingUp className="w-4 h-4 text-indigo-600" />} />
              <SummaryCard label="Maximum" value={statistics.max} icon={<Thermometer className="w-4 h-4 text-red-600" />} />
              <SummaryCard label="98th Percentile" value={statistics.percentile98} icon={<Target className="w-4 h-4 text-orange-600" />} />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">Scene Context</span>
              </div>
              <p>Statistics calculated from the clipped Landsat 8 LST raster for the Los Angeles AOI. Pixel resolution: {dataset.manifest.raster.scaleMeters} m.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number | null | undefined;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon }) => (
  <div className="bg-white border border-slate-200 shadow-sm p-3">
    <div className="flex items-center gap-2 text-slate-500 text-xs">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-lg font-semibold text-slate-800 mt-1">
      {value !== null && value !== undefined ? `${value}°C` : '—'}
    </div>
  </div>
);

export default DataVisualization;
