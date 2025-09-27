import React, { useState } from 'react';
import {
  Database,
  Target,
  Building,
  TreePine,
  CheckCircle,
  Info,
  BarChart3,
  Activity
} from 'lucide-react';
import type { SceneDataset } from '../services/dataset';

interface TemperatureMetricsProps {
  dataset: SceneDataset | null;
  isLoading: boolean;
}

const sections = [
  { id: 'muhi', label: 'MUHI Stats', icon: Target },
  { id: 'coverage', label: 'Coverage', icon: Building },
  { id: 'stats', label: 'LST Stats', icon: BarChart3 }
] as const;

const TemperatureMetrics: React.FC<TemperatureMetricsProps> = ({ dataset, isLoading }) => {
  const [activeSection, setActiveSection] = useState<'muhi' | 'coverage' | 'stats'>('muhi');

  const thresholds = dataset?.manifest.thresholds ?? null;
  const statistics = dataset?.manifest.raster.statistics ?? null;
  const totalPixels = dataset?.manifest.summary?.pixelCount ?? null;
  const sceneLabel = dataset?.info.label ?? 'Awaiting scene selection';

  const statusMessage = isLoading
    ? 'Loading scene metrics…'
    : !dataset
      ? 'Select a scene to populate metrics.'
      : null;

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden h-[620px] flex flex-col">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Research Metrics</h3>
        </div>
        <div className="text-xs text-red-100 mt-1">
          {dataset ? `Landsat 8 MUHI Analysis | ${sceneLabel}` : 'Metrics will appear once a scene is loaded.'}
        </div>
      </div>

      {statusMessage && (
        <div className={`border-b border-slate-200 flex-shrink-0 px-4 py-2 text-xs ${
          isLoading
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-slate-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            {statusMessage}
          </div>
        </div>
      )}

      <div className="border-b border-slate-200 flex-shrink-0">
        <div className="flex">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
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

      <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs text-slate-600">
        {activeSection === 'muhi' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">MUHI Detection</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-red-700">{thresholds?.canopy40.pixelCount?.toLocaleString() ?? '—'}</div>
                  <div className="text-xs text-slate-600">Pixels &gt;= 40°C</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">{thresholds?.top2percent.pixelCount?.toLocaleString() ?? '—'}</div>
                  <div className="text-xs text-slate-600">Pixels &gt;= 98th percentile</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-slate-700">Validation Snapshot</span>
              </div>
              <p>Integrate actual station observations to convert this panel from guidance to live validation analytics.</p>
            </div>
          </div>
        )}

        {activeSection === 'coverage' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Area Coverage</span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 border border-blue-200 space-y-2">
              <div className="flex justify-between">
                <span>Canopy &gt;= 40°C</span>
                <span>{thresholds?.canopy40.areaHa?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha</span>
              </div>
              <div className="flex justify-between">
                <span>Top 2% Hotspots</span>
                <span>{thresholds?.top2percent.areaHa?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha</span>
              </div>
              <div className="flex justify-between">
                <span>Total Raster Pixels</span>
                <span>{totalPixels?.toLocaleString() ?? '—'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <TreePine className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Next Layer</span>
              </div>
              <p className="mt-2">Integrate land-cover polygons or raster classifications to reveal material-specific MUHI contributions.</p>
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">LST Statistics</span>
            </div>

            {!statistics && (
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {isLoading ? 'Loading statistics…' : 'Summary statistics unavailable for this scene.'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Minimum" value={statistics?.min} />
              <MetricCard label="Maximum" value={statistics?.max} />
              <MetricCard label="Mean" value={statistics?.mean} />
              <MetricCard label="98th percentile" value={statistics?.percentile98} />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Methodology</span>
              </div>
              <p className="mt-2">Statistics derive from the manifest generated via the Google Earth Engine workflow. Refresh manifests whenever preprocessing steps change to keep this panel accurate.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number | null | undefined }> = ({ label, value }) => (
  <div className="bg-white border border-slate-200 shadow-sm p-3 text-xs text-slate-600">
    <div className="font-semibold text-slate-700 mb-1">{label}</div>
    <div className="text-lg font-bold text-slate-800">{value !== null && value !== undefined ? `${value}°C` : '—'}</div>
  </div>
);

export default TemperatureMetrics;
