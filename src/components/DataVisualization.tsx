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

interface HotspotSummary {
  id?: string | number;
  label: string;
  pixels: number;
  areaHa: number | null;
}

interface DataVisualizationProps {
  dataset: SceneDataset | null;
  isLoading: boolean;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ dataset, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'histogram' | 'thresholds' | 'summary'>('histogram');

  const histogram = dataset?.manifest.histogram ?? null;
  const histogramBins = histogram?.bins ?? [];
  const statistics = dataset?.manifest.raster.statistics ?? null;
  const thresholds = dataset?.manifest.thresholds ?? null;

  const sections = [
    { id: 'histogram', label: 'Histogram', icon: BarChart3 },
    { id: 'thresholds', label: 'MUHI Thresholds', icon: Target },
    { id: 'summary', label: 'Summary', icon: Info }
  ] as const;

  const pixelAreaHa = useMemo(() => {
    if (!dataset) return 0;
    const resolution = dataset.manifest.raster.scaleMeters ?? 30;
    return resolution > 0 ? (resolution * resolution) / 10000 : 0;
  }, [dataset]);

  const canopyHotspots = useMemo<HotspotSummary[]>(() => {
    if (!dataset) return [];
    const { threshold, count } = dataset.geojsonPropertyKeys;
    const features = dataset.canopy.features ?? [];
    return features
      .map(feature => {
        const props = (feature.properties ?? {}) as Record<string, unknown>;
        const rawCount = props[count];
        const parsedCount = typeof rawCount === 'number'
          ? rawCount
          : typeof rawCount === 'string'
            ? Number(rawCount)
            : NaN;
        if (!Number.isFinite(parsedCount)) return null;
        const thresholdValue = props[threshold];
        const areaHaValue = pixelAreaHa > 0 ? parsedCount * pixelAreaHa : null;
        return {
          id: feature.id ?? undefined,
          label: typeof thresholdValue === 'string' || typeof thresholdValue === 'number'
            ? String(thresholdValue)
            : '&gt;= 40°C',
          pixels: parsedCount,
          areaHa: areaHaValue
        } as HotspotSummary;
      })
      .filter((value): value is HotspotSummary => Boolean(value))
      .sort((a, b) => b.pixels - a.pixels)
      .slice(0, 8);
  }, [dataset, pixelAreaHa]);

  const top2Hotspots = useMemo<HotspotSummary[]>(() => {
    if (!dataset) return [];
    const { threshold, count } = dataset.geojsonPropertyKeys;
    const features = dataset.top2.features ?? [];
    return features
      .map(feature => {
        const props = (feature.properties ?? {}) as Record<string, unknown>;
        const rawCount = props[count];
        const parsedCount = typeof rawCount === 'number'
          ? rawCount
          : typeof rawCount === 'string'
            ? Number(rawCount)
            : NaN;
        if (!Number.isFinite(parsedCount)) return null;
        const thresholdValue = props[threshold];
        const areaHaValue = pixelAreaHa > 0 ? parsedCount * pixelAreaHa : null;
        return {
          id: feature.id ?? undefined,
          label: typeof thresholdValue === 'string' || typeof thresholdValue === 'number'
            ? String(thresholdValue)
            : 'Top 2%',
          pixels: parsedCount,
          areaHa: areaHaValue
        } as HotspotSummary;
      })
      .filter((value): value is HotspotSummary => Boolean(value))
      .sort((a, b) => b.pixels - a.pixels)
      .slice(0, 8);
  }, [dataset, pixelAreaHa]);

  const totalHistogramPixels = histogramBins.reduce((sum, bin) => sum + bin.pixels, 0);
  const maxPixels = histogramBins.reduce((max, bin) => Math.max(max, bin.pixels), 0);

  const sceneLabel = dataset?.info.label ?? 'Awaiting scene selection';
  const hotspotsPlaceholder = isLoading ? 'Loading hotspot summaries…' : 'Hotspot breakdown unavailable.';

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden h-[620px] flex flex-col">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">LST Analytics</h3>
        </div>
        <div className="text-xs text-red-100 mt-1">
          {dataset ? `Landsat 8 MUHI Analysis | ${sceneLabel}` : 'Select a scene to populate analytics.'}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Activity className="w-3 h-3" />
            Loading scene analytics…
          </div>
        )}
        {!isLoading && !dataset && (
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Select a scene to populate analytics.
          </div>
        )}

        {activeTab === 'histogram' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-600" />
              <h4 className="font-semibold text-slate-800 text-sm">LST Pixel Distribution</h4>
              <span className="text-xs text-slate-500">Total pixels: {totalHistogramPixels ? totalHistogramPixels.toLocaleString() : '—'}</span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-red-50 p-4 border border-slate-200">
              {histogramBins.length ? (
                <div className="grid grid-cols-12 gap-1 mb-4">
                  {histogramBins.map((bin, index) => (
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
              ) : (
                <PlaceholderPanel message={isLoading ? 'Loading histogram…' : 'Histogram will appear once a scene loads.'} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="bg-red-100 p-3">
                  <div className="text-sm font-semibold text-red-800">&gt;= 40°C Pixels</div>
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
                    {(thresholds?.top2percent.cutoffC ?? statistics?.percentile98)?.toString() ?? '—'}°C
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'thresholds' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <h4 className="font-semibold text-slate-800 text-sm">MUHI Threshold Coverage</h4>
            </div>

            {!thresholds && (
              <PlaceholderPanel message={isLoading ? 'Loading MUHI thresholds…' : 'Threshold data not available for this scene.'} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 p-4">
                <div className="text-xs text-red-600 font-semibold">Canopy &gt;= 40°C</div>
                <div className="text-2xl font-bold text-red-800 mt-2">{thresholds?.canopy40.areaHa?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha</div>
                <div className="text-xs text-slate-600 mt-1">{thresholds?.canopy40.pixelCount?.toLocaleString() ?? '—'} pixels</div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4">
                <div className="text-xs text-orange-600 font-semibold">Top 2% (&gt;= 98th percentile)</div>
                <div className="text-2xl font-bold text-orange-700 mt-2">{thresholds?.top2percent.areaHa?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha</div>
                <div className="text-xs text-slate-600 mt-1">{thresholds?.top2percent.pixelCount?.toLocaleString() ?? '—'} pixels</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HotspotList
                title="Canopy hotspots"
                icon={<MapPin className="w-4 h-4 text-red-600" />}
                accentClass="text-red-600"
                emptyLabel={hotspotsPlaceholder}
                items={canopyHotspots}
              />
              <HotspotList
                title="Top 2% hotspots"
                icon={<Target className="w-4 h-4 text-orange-600" />}
                accentClass="text-orange-600"
                emptyLabel={hotspotsPlaceholder}
                items={top2Hotspots}
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">Interpretation</p>
              <p>Canopy hotspots denote surfaces that reached or exceeded 40°C. Top 2% hotspots highlight the warmest 98th percentile pixels for the selected acquisition.</p>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-slate-800 text-sm">Temperature Summary</h4>
            </div>

            {!statistics && (
              <PlaceholderPanel message={isLoading ? 'Loading temperature statistics…' : 'Summary statistics unavailable.'} />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Minimum" value={statistics?.min} icon={<Activity className="w-4 h-4 text-slate-600" />} />
              <SummaryCard label="Mean" value={statistics?.mean} icon={<TrendingUp className="w-4 h-4 text-indigo-600" />} />
              <SummaryCard label="Maximum" value={statistics?.max} icon={<Thermometer className="w-4 h-4 text-red-600" />} />
              <SummaryCard label="98th Percentile" value={statistics?.percentile98} icon={<Target className="w-4 h-4 text-orange-600" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HotspotList
                title="Canopy hotspots"
                icon={<MapPin className="w-4 h-4 text-red-600" />}
                accentClass="text-red-600"
                emptyLabel={hotspotsPlaceholder}
                items={canopyHotspots}
              />
              <HotspotList
                title="Top 2% hotspots"
                icon={<Target className="w-4 h-4 text-orange-600" />}
                accentClass="text-orange-600"
                emptyLabel={hotspotsPlaceholder}
                items={top2Hotspots}
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">Scene Context</span>
              </div>
              <p>Statistics calculated from the clipped Landsat 8 LST raster for the Los Angeles AOI. Pixel resolution: {dataset?.manifest.raster.scaleMeters ?? 30} m.</p>
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

const PlaceholderPanel: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center border border-dashed border-slate-300 bg-slate-50/60 p-6 text-xs text-slate-500 text-center">
    {message}
  </div>
);

export default DataVisualization;

const HotspotList: React.FC<{ title: string; icon: React.ReactNode; items: HotspotSummary[]; accentClass: string; emptyLabel: string }> = ({ title, icon, items, accentClass, emptyLabel }) => (
  <div className="bg-white border border-slate-200 p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
    {items.length ? (
      <ul className="space-y-2 text-xs text-slate-600">
        {items.map((item, index) => (
          <li key={item.id ?? index} className="flex items-center justify-between gap-2">
            <span className="truncate">
              <span className={`${accentClass} font-semibold mr-1`}>{index + 1}.</span>
              {item.label}
            </span>
            <span className="text-right whitespace-nowrap text-xs text-slate-500">
              {item.pixels.toLocaleString()}
              {item.areaHa !== null ? (
                <span className="text-slate-400"> • {item.areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-slate-500">{emptyLabel}</p>
    )}
  </div>
);
