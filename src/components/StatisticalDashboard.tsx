import React, { useMemo, useState } from 'react';
import {
  Database,
  TrendingUp,
  TrendingDown,
  Target,
  Thermometer,
  Download,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { SceneDataset } from '../services/dataset';

interface StatisticalDashboardProps {
  dataset: SceneDataset | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onExportData?: () => void;
  autoRefresh?: boolean;
}

const StatisticalDashboard: React.FC<StatisticalDashboardProps> = ({
  dataset,
  isVisible,
  onToggleVisibility,
  onExportData
}) => {
  const [expanded, setExpanded] = useState({
    summary: true,
    thresholds: true,
    notes: false
  });

  const statistics = dataset?.manifest.raster.statistics;
  const thresholds = dataset?.manifest.thresholds;
  const totalPixels = dataset?.manifest.summary?.pixelCount ?? null;

  const derived = useMemo(() => {
    if (!thresholds || !totalPixels) {
      return null;
    }

    const hotPixelShare = thresholds.canopy40.pixelCount && totalPixels
      ? (thresholds.canopy40.pixelCount / totalPixels) * 100
      : null;

    return {
      hotPixelShare,
      coolingPotential: thresholds.top2percent.pixelCount && totalPixels
        ? (thresholds.top2percent.pixelCount / totalPixels) * 100
        : null
    };
  }, [thresholds, totalPixels]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="w-full bg-white border border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between text-sm text-slate-600"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>Show Statistical Dashboard</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-slate-700">
          <Database className="w-4 h-4" />
          <span className="font-semibold text-sm">Statistical Dashboard</span>
        </div>
        <button onClick={onToggleVisibility} className="text-xs text-slate-500 flex items-center gap-1">
          Hide
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {!dataset ? (
        <div className="p-4 text-sm text-slate-500">Select a scene to load dashboard analytics.</div>
      ) : (
        <div className="p-4 space-y-4 text-xs text-slate-600">
          <Section
            title="LST Summary"
            icon={<Thermometer className="w-4 h-4 text-red-600" />}
            expanded={expanded.summary}
            onToggle={() => setExpanded(prev => ({ ...prev, summary: !prev.summary }))}
          >
            {statistics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="Minimum" value={statistics.min} suffix="°C" trend="down" />
                <Metric label="Mean" value={statistics.mean} suffix="°C" trend="flat" />
                <Metric label="Maximum" value={statistics.max} suffix="°C" trend="up" />
                <Metric label="98th Percentile" value={statistics.percentile98} suffix="°C" trend="up" />
              </div>
            ) : (
              <p>Statistics unavailable.</p>
            )}
          </Section>

          <Section
            title="MUHI Threshold Coverage"
            icon={<Target className="w-4 h-4 text-orange-600" />}
            expanded={expanded.thresholds}
            onToggle={() => setExpanded(prev => ({ ...prev, thresholds: !prev.thresholds }))}
          >
            {thresholds ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Metric
                  label="Canopy ≥40°C"
                  value={thresholds.canopy40.areaHa}
                  suffix="ha"
                  trend="up"
                  description={`${thresholds.canopy40.pixelCount?.toLocaleString() ?? '—'} pixels`}
                />
                <Metric
                  label="Top 2%"
                  value={thresholds.top2percent.areaHa}
                  suffix="ha"
                  trend="up"
                  description={`${thresholds.top2percent.pixelCount?.toLocaleString() ?? '—'} pixels`}
                />
                <Metric
                  label="Hotspot Share"
                  value={derived?.hotPixelShare}
                  suffix="%"
                  trend="up"
                  description="Percentage of pixels ≥40°C"
                />
              </div>
            ) : (
              <p>Threshold data unavailable.</p>
            )}
          </Section>

          <Section
            title="Notes & Next Steps"
            icon={<Info className="w-4 h-4 text-slate-600" />}
            expanded={expanded.notes}
            onToggle={() => setExpanded(prev => ({ ...prev, notes: !prev.notes }))}
          >
            <ul className="list-disc pl-4 space-y-1">
              <li>Integrate ground-station CSV to replace placeholder validation metrics.</li>
              <li>Load land-cover classification to extend material analysis.</li>
              <li>Refresh manifests via the preprocessing scripts whenever rasters are updated.</li>
            </ul>
          </Section>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={onExportData}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 font-semibold hover:shadow-lg transition-shadow duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export dataset manifest & geodata
            </button>
            <div className="text-[11px] text-slate-500 text-center mt-2">
              Includes GeoTIFF raster, MUHI polygons, manifest metadata
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, expanded, onToggle, children }) => (
  <div className="border border-slate-200">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </div>
      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
    {expanded && <div className="p-3 space-y-3">{children}</div>}
  </div>
);

const Metric: React.FC<{ label: string; value: number | null | undefined; suffix?: string; trend: 'up' | 'down' | 'flat'; description?: string }> = ({ label, value, suffix, trend, description }) => {
  const icon = trend === 'up' ? <TrendingUp className="w-4 h-4 text-red-500" />
    : trend === 'down' ? <TrendingDown className="w-4 h-4 text-blue-500" />
      : <TrendingUp className="w-4 h-4 text-slate-400 rotate-90" />;

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-3">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-lg font-semibold text-slate-800 mt-1">
        {value !== null && value !== undefined ? `${value.toLocaleString(undefined, { maximumFractionDigits: suffix === '%' ? 1 : 2 })}${suffix ?? ''}` : '—'}
      </div>
      {description && <div className="text-[11px] text-slate-500 mt-1">{description}</div>}
    </div>
  );
};

export default StatisticalDashboard;
