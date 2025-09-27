import React, { useEffect, useRef } from 'react';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import type { SceneDataset } from '../services/dataset';

interface MapContainerProps {
  selectedDate: string;
  layers: {
    lstVisible: boolean;
    muhiCanopy40: boolean;
    muhiTop2Percent: boolean;
  };
  queryMode: boolean;
  onMapClick?: (lat: number, lng: number) => void | Promise<void>;
  dataset: SceneDataset | null;
}

const MapContainer: React.FC<MapContainerProps> = ({
  selectedDate,
  layers,
  queryMode,
  onMapClick,
  dataset
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupsRef = useRef<{
    lst?: any;
    muhiCanopy40?: any;
    muhiTop2Percent?: any;
  }>({});

  // Map initialization
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;
    const map = L.map(mapRef.current, {
      center: [34.0522, -118.2437],
      zoom: 10,
      zoomControl: true,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | LST Data: Landsat 8 Collection 2',
      maxZoom: 18
    }).addTo(map);

    layerGroupsRef.current = {
      lst: L.layerGroup().addTo(map),
      muhiCanopy40: L.layerGroup().addTo(map),
      muhiTop2Percent: L.layerGroup().addTo(map)
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click events for query mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = async (event: any) => {
      if (!queryMode || !onMapClick) return;
      const { lat, lng } = event.latlng;
      await onMapClick(lat, lng);
    };

    map.off('click');
    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [queryMode, onMapClick]);

  // Update layers when dataset or toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroups = layerGroupsRef.current;
    const propertyKeys = dataset?.geojsonPropertyKeys ?? { threshold: 'threshold', count: 'count' };
    const scaleMeters = dataset?.manifest.raster.scaleMeters ?? 30;
    const pixelAreaHa = scaleMeters > 0 ? (scaleMeters * scaleMeters) / 10000 : null;

    const getFeatureMetrics = (feature: any): { label: string; pixels: number | null; areaHa: number | null } => {
      if (!feature) {
        return { label: 'Threshold', pixels: null, areaHa: null };
      }
      const props = (feature.properties ?? {}) as Record<string, unknown>;
      const thresholdValue = props[propertyKeys.threshold];
      const rawCount = props[propertyKeys.count];
      const parsedCount = typeof rawCount === 'number'
        ? rawCount
        : typeof rawCount === 'string'
          ? Number(rawCount)
          : NaN;
      const pixelCount = Number.isFinite(parsedCount) ? parsedCount : null;
      const areaHaValue = pixelCount !== null && pixelAreaHa ? pixelCount * pixelAreaHa : null;
      const label = typeof thresholdValue === 'string' || typeof thresholdValue === 'number'
        ? String(thresholdValue)
        : 'Threshold';
      return { label, pixels: pixelCount, areaHa: areaHaValue };
    };

    const L = (window as any).L;

    if (!map || !L) return;

    // Helper to clear and optionally remove a layer group
    const clearLayerGroup = (groupKey: keyof typeof layerGroups) => {
      const group = layerGroups[groupKey];
      if (!group) return;
      group.clearLayers();
      if (map.hasLayer(group)) {
        map.removeLayer(group);
      }
    };

    // LST Raster Layer
    clearLayerGroup('lst');
    if (layers.lstVisible && dataset?.raster && dataset.manifest) {
      const legend = dataset.manifest.raster.legend;
      const colorScale = (value: number | null) => {
        if (value === null || Number.isNaN(value)) return null;
        const { breaks, palette } = legend;
        for (let i = breaks.length - 1; i >= 0; i -= 1) {
          if (value >= breaks[i]) {
            return palette[Math.min(i + 1, palette.length - 1)] ?? palette[palette.length - 1];
          }
        }
        return palette[0];
      };

      // @ts-expect-error GeoRasterLayer lacks type definitions
      const rasterLayer = new GeoRasterLayer({
        georaster: dataset.raster.georaster,
        opacity: 0.7,
        resolution: 256,
        pixelValuesToColorFn: (values: number[]) => colorScale(values[0])
      });

      rasterLayer.addTo(layerGroups.lst);
      layerGroups.lst.addTo(map);
    }

    // MUHI Canopy 40°C Layer
    clearLayerGroup('muhiCanopy40');
    if (layers.muhiCanopy40 && dataset?.canopy) {
      const areaHa = dataset.manifest.thresholds.canopy40.areaHa ?? undefined;
      L.geoJSON(dataset.canopy, {
        style: {
          fillColor: '#8B0000',
          weight: 1,
          opacity: 1,
          color: '#8B0000',
          fillOpacity: 0.35
        },
        onEachFeature: (feature: any, layer: any) => {
          const metrics = getFeatureMetrics(feature);
          const details: string[] = [];
          if (metrics.pixels !== null) {
            details.push(`<div class="text-xs text-slate-500 mt-1">Pixels: ${metrics.pixels.toLocaleString()}</div>`);
          }
          if (metrics.areaHa !== null) {
            details.push(`<div class="text-xs text-slate-500${metrics.pixels !== null ? '' : ' mt-1'}">Feature area: ${metrics.areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</div>`);
          }
          if (areaHa) {
            details.push(`<div class="text-xs text-slate-500${details.length ? '' : ' mt-1'}">Scene total: ${areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</div>`);
          }

          layer.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold text-slate-800">MUHI Canopy Threshold</div>
              <div class="text-slate-600">Threshold: ${metrics.label}</div>
              ${details.join('')}
              <div class="text-xs text-slate-500">Date: ${selectedDate}</div>
            </div>
          `);
        }

      }).addTo(layerGroups.muhiCanopy40);

      layerGroups.muhiCanopy40.addTo(map);
    }

    // MUHI Top 2% Layer
    clearLayerGroup('muhiTop2Percent');
    if (layers.muhiTop2Percent && dataset?.top2) {
      const summary = dataset.manifest.thresholds.top2percent;
      L.geoJSON(dataset.top2, {
        style: {
          fillColor: '#FF8C00',
          weight: 1,
          opacity: 1,
          color: '#FF8C00',
          fillOpacity: 0.3
        },
        onEachFeature: (feature: any, layer: any) => {
          const metrics = getFeatureMetrics(feature);
          const cutoffText = summary.cutoffC !== undefined && summary.cutoffC !== null
            ? `Temperature ≥ ${summary.cutoffC}°C`
            : 'Top 2% hottest pixels';
          const details: string[] = [];
          if (metrics.pixels !== null) {
            details.push(`<div class="text-xs text-slate-500 mt-1">Pixels: ${metrics.pixels.toLocaleString()}</div>`);
          }
          if (metrics.areaHa !== null) {
            details.push(`<div class="text-xs text-slate-500${metrics.pixels !== null ? '' : ' mt-1'}">Feature area: ${metrics.areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</div>`);
          }
          if (summary.areaHa) {
            details.push(`<div class="text-xs text-slate-500${details.length ? '' : ' mt-1'}">Scene total: ${summary.areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha</div>`);
          }

          layer.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold text-slate-800">MUHI Top 2% Threshold</div>
              <div class="text-slate-600">${cutoffText}</div>
              <div class="text-xs text-slate-500 mt-1">Threshold label: ${metrics.label}</div>
              ${details.join('')}
              <div class="text-xs text-slate-500">Date: ${selectedDate}</div>
            </div>
          `);
        }

      }).addTo(layerGroups.muhiTop2Percent);

      layerGroups.muhiTop2Percent.addTo(map);
    }


  }, [layers, dataset, selectedDate]);

  const statistics = dataset?.manifest.raster.statistics;
  const legend = dataset?.manifest.raster.legend;

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="h-96 md:h-[500px] w-full z-0"
        style={{ minHeight: '400px' }}
      />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-30 bg-white bg-opacity-95 backdrop-blur-sm p-3 shadow-lg border border-slate-200 max-w-xs">
        <div className="text-xs font-semibold text-slate-700 mb-2">Landsat 8 LST & MUHI Analysis</div>
        <div className="space-y-1">
          {layers.lstVisible && legend && (
            <div className="border-b border-slate-200 pb-1 mb-2">
              <div className="text-xs font-medium text-slate-600 mb-1">Land Surface Temperature (°C)</div>
              <div className="flex items-center gap-1 text-xs">
                {legend.palette.map((color, index) => (
                  <div key={color} className="w-2 h-2" style={{ backgroundColor: color }} title={`${legend.breaks[index] ?? ''}`} />
                ))}
                {statistics && (
                  <span className="text-slate-500 ml-1">{statistics.min ?? '—'}–{statistics.max ?? '—'}</span>
                )}
              </div>
            </div>
          )}
          {layers.muhiCanopy40 && dataset?.manifest.thresholds.canopy40.areaHa && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-800" />
              <span className="text-xs text-slate-600">MUHI ≥40°C ({dataset.manifest.thresholds.canopy40.areaHa.toLocaleString(undefined, { maximumFractionDigits: 1 })} ha)</span>
            </div>
          )}
          {layers.muhiTop2Percent && dataset?.manifest.thresholds.top2percent.areaHa && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500" />
              <span className="text-xs text-slate-600">MUHI Top 2% ({dataset.manifest.thresholds.top2percent.areaHa.toLocaleString(undefined, { maximumFractionDigits: 1 })} ha)</span>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-2 pt-1 border-t border-slate-200">
          Acquisition: {selectedDate}
        </div>
      </div>

      {queryMode && (
        <div className="absolute top-4 left-4 z-30 bg-blue-600 text-white px-3 py-2 shadow-lg border border-blue-700">
          <div className="text-xs font-semibold">Temperature Query Mode</div>
          <div className="text-xs">Click anywhere to sample LST</div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-30 bg-white bg-opacity-95 backdrop-blur-sm px-3 py-2 shadow-lg border border-slate-200">
        <div className="text-xs font-semibold text-slate-700">Active Layers</div>
        <div className="text-sm text-slate-600 font-medium mt-1">
          {Object.entries(layers)
            .filter(([, active]) => active)
            .map(([layer]) => layer.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase()))
            .join(', ') || 'None'}
        </div>
      </div>
    </div>
  );
};

export default MapContainer;

