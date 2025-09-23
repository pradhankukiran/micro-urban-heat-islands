import React, { useEffect, useRef, useState } from 'react';

// Enhanced data interfaces for research integration
interface LSTRasterData {
  date: string;
  acquisitionTime: string;
  temperatureGrid: number[][];
  bounds: [[number, number], [number, number]];
  pixelStats: {
    min: number;
    max: number;
    mean: number;
    percentile98: number;
  };
}

interface MUHIPolygonData {
  date: string;
  canopy40: GeoJSON.FeatureCollection;
  top2percent: GeoJSON.FeatureCollection;
  statistics: {
    canopy40Count: number;
    top2percentCount: number;
    canopy40Area: number;
    top2percentArea: number;
  };
}

interface GroundTruthStation {
  stationId: string;
  name: string;
  coordinates: [number, number];
  temperatures: { [date: string]: number };
  metadata: {
    type: string;
    elevation: number;
  };
}

interface LandCoverData {
  sparseVegetation: GeoJSON.FeatureCollection;
  denseVegetation: GeoJSON.FeatureCollection;
  vegetatedAsphalt: GeoJSON.FeatureCollection;
  concrete: GeoJSON.FeatureCollection;
  waterBody: GeoJSON.FeatureCollection;
  unvegetatedAsphalt: GeoJSON.FeatureCollection;
  buildings: GeoJSON.FeatureCollection;
}

interface MapContainerProps {
  selectedDate: string;
  layers: {
    lstVisible: boolean;
    muhiCanopy40: boolean;
    muhiTop2Percent: boolean;
    groundTruth: boolean;
    landCover: boolean;
  };
  onTemperatureQuery?: (data: {
    lat: number;
    lng: number;
    temperature: number;
    landCover: string;
    muhiStatus: string[];
  }) => void;
  queryMode: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({
  selectedDate,
  layers,
  onTemperatureQuery,
  queryMode
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupsRef = useRef<{
    lst?: any;
    muhiCanopy40?: any;
    muhiTop2Percent?: any;
    groundTruth?: any;
    landCover?: any;
  }>({});

  // Placeholder research data based on the PDFs
  const [muhiData] = useState<{ [date: string]: MUHIPolygonData }>({
    '2023-07-12': {
      date: '2023-07-12',
      canopy40: {
        type: 'FeatureCollection',
        features: generateMockMUHIPolygons(42, 'canopy40') // Based on research findings
      },
      top2percent: {
        type: 'FeatureCollection',
        features: generateMockMUHIPolygons(235, 'top2percent') // ~10x more areas
      },
      statistics: { canopy40Count: 2841, top2percentCount: 23362, canopy40Area: 4219.68, top2percentArea: 11144.40 }
    },
    '2023-08-29': {
      date: '2023-08-29',
      canopy40: {
        type: 'FeatureCollection',
        features: generateMockMUHIPolygons(48, 'canopy40') // August is hottest
      },
      top2percent: {
        type: 'FeatureCollection',
        features: generateMockMUHIPolygons(267, 'top2percent')
      },
      statistics: { canopy40Count: 2841, top2percentCount: 23362, canopy40Area: 4219.68, top2percentArea: 11144.40 }
    },
    '2023-09-14': {
      date: '2023-09-14',
      canopy40: {
        type: 'FeatureCollection',
        features: generateMockMUHIPolygons(38, 'canopy40') // Cooling in September
      },
      top2percent: {
        type: 'FeatureCollection',
        features: generateMockMUHIPolygons(198, 'top2percent')
      },
      statistics: { canopy40Count: 2841, top2percentCount: 23362, canopy40Area: 4219.68, top2percentArea: 11144.40 }
    }
  });

  // 23 Ground truth weather stations from the research
  const [groundTruthStations] = useState<GroundTruthStation[]>([
    { stationId: 'KCACULVE16', name: 'Culver City', coordinates: [34.0211, -118.3964], temperatures: { '2023-07-12': 0, '2023-08-29': 29.6, '2023-09-14': 23.5 }, metadata: { type: 'PWS', elevation: 45 }},
    { stationId: 'KCACULVE34', name: 'Culver City', coordinates: [34.0195, -118.3845], temperatures: { '2023-07-12': 22.7, '2023-08-29': 28.6, '2023-09-14': 22.9 }, metadata: { type: 'PWS', elevation: 38 }},
    { stationId: 'KCALOSAN1005', name: 'Los Angeles Downtown', coordinates: [34.0522, -118.2437], temperatures: { '2023-07-12': 25.9, '2023-08-29': 30.6, '2023-09-14': 25.1 }, metadata: { type: 'PWS', elevation: 87 }},
    { stationId: 'KCALOSAN1032', name: 'Los Angeles West', coordinates: [34.0448, -118.2912], temperatures: { '2023-07-12': 22.4, '2023-08-29': 28.2, '2023-09-14': 21.5 }, metadata: { type: 'PWS', elevation: 76 }},
    { stationId: 'KCALOSAN1044', name: 'Los Angeles Central', coordinates: [34.0669, -118.2575], temperatures: { '2023-07-12': 21.6, '2023-08-29': 26.3, '2023-09-14': 21.2 }, metadata: { type: 'PWS', elevation: 112 }},
    { stationId: 'KCALOSAN1131', name: 'Los Angeles Northeast', coordinates: [34.0928, -118.2089], temperatures: { '2023-07-12': 23.0, '2023-08-29': 29.4, '2023-09-14': 22.5 }, metadata: { type: 'PWS', elevation: 156 }},
    { stationId: 'KCALOSAN1135', name: 'Los Angeles Hills', coordinates: [34.1234, -118.3011], temperatures: { '2023-07-12': 30.6, '2023-08-29': 25.6, '2023-09-14': 22.1 }, metadata: { type: 'PWS', elevation: 425 }},
    { stationId: 'KCALOSAN364', name: 'Los Angeles Valley', coordinates: [34.1689, -118.4452], temperatures: { '2023-07-12': 23.1, '2023-08-29': 34.4, '2023-09-14': 24.6 }, metadata: { type: 'PWS', elevation: 234 }},
    { stationId: 'KCALOSAN564', name: 'Los Angeles South', coordinates: [33.9825, -118.2945], temperatures: { '2023-07-12': 25.6, '2023-08-29': 29.1, '2023-09-14': 22.5 }, metadata: { type: 'PWS', elevation: 67 }},
    { stationId: 'KCALOSAN697', name: 'Los Angeles East', coordinates: [34.0194, -118.1445], temperatures: { '2023-07-12': 21.7, '2023-08-29': 27.6, '2023-09-14': 21.7 }, metadata: { type: 'PWS', elevation: 89 }},
    { stationId: 'KCALOSAN698', name: 'Los Angeles East Central', coordinates: [34.0356, -118.1823], temperatures: { '2023-07-12': 23.3, '2023-08-29': 28.9, '2023-09-14': 0 }, metadata: { type: 'PWS', elevation: 103 }},
    { stationId: 'KCALOSAN793', name: 'Los Angeles North Valley', coordinates: [34.1478, -118.4563], temperatures: { '2023-07-12': 28.8, '2023-08-29': 34.0, '2023-09-14': 22.4 }, metadata: { type: 'PWS', elevation: 267 }},
    { stationId: 'KCALOSAN872', name: 'Los Angeles Westside', coordinates: [33.9806, -118.4234], temperatures: { '2023-07-12': 21.0, '2023-08-29': 26.1, '2023-09-14': 21.7 }, metadata: { type: 'PWS', elevation: 23 }},
    { stationId: 'KCALOSAN874', name: 'Los Angeles Highland Park', coordinates: [34.1167, -118.2089], temperatures: { '2023-07-12': 28.5, '2023-08-29': 33.1, '2023-09-14': 25.2 }, metadata: { type: 'PWS', elevation: 178 }},
    { stationId: 'KCALOSAN896', name: 'Los Angeles Glendale', coordinates: [34.1425, -118.2551], temperatures: { '2023-07-12': 28.4, '2023-08-29': 34.4, '2023-09-14': 24.9 }, metadata: { type: 'PWS', elevation: 198 }},
    { stationId: 'KCALOSAN951', name: 'Los Angeles Mid-Wilshire', coordinates: [34.0522, -118.3095], temperatures: { '2023-07-12': 24.0, '2023-08-29': 29.5, '2023-09-14': 21.8 }, metadata: { type: 'PWS', elevation: 89 }},
    { stationId: 'KCALOSAN962', name: 'Los Angeles San Fernando', coordinates: [34.2194, -118.4389], temperatures: { '2023-07-12': 28.1, '2023-08-29': 35.8, '2023-09-14': 25.1 }, metadata: { type: 'PWS', elevation: 256 }},
    { stationId: 'KCALOSAN977', name: 'Los Angeles Woodland Hills', coordinates: [34.1681, -118.6059], temperatures: { '2023-07-12': 31.2, '2023-08-29': 39.1, '2023-09-14': 24.9 }, metadata: { type: 'PWS', elevation: 289 }},
    { stationId: 'KCAPLAYA9', name: 'Playa del Rey', coordinates: [33.9584, -118.4389], temperatures: { '2023-07-12': 18.3, '2023-08-29': 23.9, '2023-09-14': 21.2 }, metadata: { type: 'PWS', elevation: 12 }},
    { stationId: 'KCAVANNU28', name: 'Van Nuys', coordinates: [34.1947, -118.4389], temperatures: { '2023-07-12': 32.6, '2023-08-29': 37.3, '2023-09-14': 24.4 }, metadata: { type: 'PWS', elevation: 234 }},
    { stationId: 'KCAVENIC20', name: 'Venice', coordinates: [33.9839, -118.4694], temperatures: { '2023-07-12': 22.4, '2023-08-29': 26.3, '2023-09-14': 22.5 }, metadata: { type: 'PWS', elevation: 8 }},
    { stationId: 'KCAWOODL169', name: 'Woodland Hills', coordinates: [34.1681, -118.6059], temperatures: { '2023-07-12': 32.2, '2023-08-29': 35.8, '2023-09-14': 23.4 }, metadata: { type: 'PWS', elevation: 267 }}
  ]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && (window as any).L) {
      const L = (window as any).L;

      // Initialize map centered on Los Angeles with better bounds
      const map = L.map(mapRef.current, {
        center: [34.0522, -118.2437],
        zoom: 10,
        zoomControl: true,
        preferCanvas: true // Better performance for large datasets
      });

      // Add enhanced base map layer
      const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | LST Data: Landsat 8 Collection 2',
        maxZoom: 18
      });

      baseLayer.addTo(map);

      // Set up click handler for temperature querying
      if (queryMode && onTemperatureQuery) {
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          // Simulate temperature and land cover lookup
          const mockTemp = simulateTemperatureAt(lat, lng, selectedDate);
          const landCover = simulateLandCoverAt(lat, lng);
          const muhiStatus = simulateMUHIStatusAt(lat, lng, selectedDate);

          onTemperatureQuery({
            lat,
            lng,
            temperature: mockTemp,
            landCover,
            muhiStatus
          });
        });
      }

      mapInstanceRef.current = map;

      // Initialize layer groups
      layerGroupsRef.current = {
        lst: L.layerGroup(),
        muhiCanopy40: L.layerGroup(),
        muhiTop2Percent: L.layerGroup(),
        groundTruth: L.layerGroup(),
        landCover: L.layerGroup()
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [queryMode, onTemperatureQuery]);

  // Layer management effects
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroups = layerGroupsRef.current;
    if (!map || !(window as any).L) return;

    const L = (window as any).L;

    // Clear all layers
    Object.values(layerGroups).forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add LST layer
    if (layers.lstVisible && layerGroups.lst) {
      layerGroups.lst.clearLayers();
      addLSTRasterLayer(layerGroups.lst, selectedDate);
      layerGroups.lst.addTo(map);
    }

    // Add MUHI Canopy 40°C layer
    if (layers.muhiCanopy40 && layerGroups.muhiCanopy40 && muhiData[selectedDate]) {
      layerGroups.muhiCanopy40.clearLayers();
      L.geoJSON(muhiData[selectedDate].canopy40, {
        style: {
          fillColor: '#8B0000',
          weight: 1,
          opacity: 1,
          color: '#8B0000',
          fillOpacity: 0.4
        },
        onEachFeature: (feature: any, layer: any) => {
          layer.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold text-slate-800">MUHI Canopy Threshold</div>
              <div class="text-slate-600">Temperature: ≥40°C</div>
              <div class="text-xs text-slate-500 mt-1">Date: ${selectedDate} 11:28 LA Time</div>
              <div class="text-xs text-slate-500">Total Area: 4,219.68 hectares</div>
            </div>
          `);
        }
      }).addTo(layerGroups.muhiCanopy40);
      layerGroups.muhiCanopy40.addTo(map);
    }

    // Add MUHI Top 2% layer
    if (layers.muhiTop2Percent && layerGroups.muhiTop2Percent && muhiData[selectedDate]) {
      layerGroups.muhiTop2Percent.clearLayers();
      L.geoJSON(muhiData[selectedDate].top2percent, {
        style: {
          fillColor: '#FF8C00',
          weight: 1,
          opacity: 1,
          color: '#FF8C00',
          fillOpacity: 0.35
        },
        onEachFeature: (feature: any, layer: any) => {
          layer.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold text-slate-800">MUHI Top 2% Threshold</div>
              <div class="text-slate-600">Temperature: ≥39°C (98th percentile)</div>
              <div class="text-xs text-slate-500 mt-1">Date: ${selectedDate} 11:28 LA Time</div>
              <div class="text-xs text-slate-500">Total Area: 11,144.40 hectares</div>
            </div>
          `);
        }
      }).addTo(layerGroups.muhiTop2Percent);
      layerGroups.muhiTop2Percent.addTo(map);
    }

    // Add Ground Truth Stations
    if (layers.groundTruth && layerGroups.groundTruth) {
      layerGroups.groundTruth.clearLayers();
      groundTruthStations.forEach(station => {
        const temp = station.temperatures[selectedDate];
        if (temp && temp > 0) { // Only show stations with valid data
          const marker = L.circleMarker(station.coordinates, {
            radius: 6,
            fillColor: '#4F46E5',
            color: '#312E81',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });

          marker.bindPopup(`
            <div class="text-sm">
              <div class="font-semibold text-slate-800">${station.name}</div>
              <div class="text-slate-600">Ground Truth: ${temp}°C</div>
              <div class="text-xs text-slate-500 mt-1">Station ID: ${station.stationId}</div>
              <div class="text-xs text-slate-500">Elevation: ${station.metadata.elevation}m</div>
              <div class="text-xs text-slate-500">Type: ${station.metadata.type}</div>
            </div>
          `);

          marker.addTo(layerGroups.groundTruth);
        }
      });
      layerGroups.groundTruth.addTo(map);
    }

  }, [layers, selectedDate, muhiData, groundTruthStations]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="h-96 md:h-[500px] w-full"
        style={{ minHeight: '400px' }}
      />

      {/* Enhanced Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm p-3 shadow-lg border border-slate-200 max-w-xs">
        <div className="text-xs font-semibold text-slate-700 mb-2">Landsat 8 LST & MUHI Analysis</div>
        <div className="space-y-1">
          {layers.lstVisible && (
            <div className="border-b border-slate-200 pb-1 mb-2">
              <div className="text-xs font-medium text-slate-600 mb-1">Land Surface Temperature</div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 bg-blue-500"></div>
                <div className="w-2 h-2 bg-cyan-400"></div>
                <div className="w-2 h-2 bg-green-400"></div>
                <div className="w-2 h-2 bg-yellow-400"></div>
                <div className="w-2 h-2 bg-orange-500"></div>
                <div className="w-2 h-2 bg-red-600"></div>
                <span className="text-slate-500 ml-1">16-44°C</span>
              </div>
            </div>
          )}
          {layers.muhiCanopy40 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-800"></div>
              <span className="text-xs text-slate-600">MUHI ≥40°C ({muhiData[selectedDate]?.statistics.canopy40Area.toFixed(1)} ha)</span>
            </div>
          )}
          {layers.muhiTop2Percent && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500"></div>
              <span className="text-xs text-slate-600">MUHI ≥39°C ({muhiData[selectedDate]?.statistics.top2percentArea.toFixed(1)} ha)</span>
            </div>
          )}
          {layers.groundTruth && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
              <span className="text-xs text-slate-600">Weather Stations (23)</span>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-2 pt-1 border-t border-slate-200">
          Acquisition: {selectedDate} 11:28 LA Time
        </div>
      </div>

      {/* Query Mode Indicator */}
      {queryMode && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 shadow-lg border border-blue-700">
          <div className="text-xs font-semibold">🎯 Temperature Query Mode</div>
          <div className="text-xs">Click anywhere to get LST reading</div>
        </div>
      )}

      {/* Active Layers Indicator */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm px-3 py-2 shadow-lg border border-slate-200">
        <div className="text-xs font-semibold text-slate-700">Active Layers</div>
        <div className="text-sm text-slate-600 font-medium mt-1">
          {Object.entries(layers).filter(([_, active]) => active).map(([layer, _]) =>
            layer.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase())
          ).join(', ') || 'None'}
        </div>
      </div>
    </div>
  );
};

// Helper functions for data simulation
function generateMockMUHIPolygons(count: number, type: 'canopy40' | 'top2percent'): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];
  const centerLat = 34.0522;
  const centerLng = -118.2437;

  for (let i = 0; i < count; i++) {
    // Generate polygons in clusters around LA, with higher density in urban areas
    const angle = (i / count) * 2 * Math.PI;
    const distance = Math.random() * 0.3 + 0.05; // 0.05 to 0.35 degrees from center
    const lat = centerLat + Math.cos(angle) * distance + (Math.random() - 0.5) * 0.1;
    const lng = centerLng + Math.sin(angle) * distance + (Math.random() - 0.5) * 0.1;

    // Create small polygon areas representing MUHI zones
    const size = type === 'canopy40' ? 0.003 : 0.002; // Canopy threshold areas are slightly larger
    const coordinates = [
      [lng - size, lat - size],
      [lng + size, lat - size],
      [lng + size, lat + size],
      [lng - size, lat + size],
      [lng - size, lat - size]
    ];

    features.push({
      type: 'Feature',
      properties: {
        type,
        threshold: type === 'canopy40' ? '≥40°C' : '≥39°C',
        area: (size * 2) * (size * 2) * 111 * 111 * 100 // Rough hectares calculation
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    });
  }

  return features;
}

function addLSTRasterLayer(layerGroup: any, date: string) {
  // Simulate LST raster overlay with temperature-based coloring
  // In real implementation, this would load actual GeoTIFF data
  const L = (window as any).L;

  // Create a grid overlay to simulate LST data
  const bounds = [[33.7, -118.7], [34.4, -117.8]]; // LA County bounds
  const overlay = L.rectangle(bounds, {
    fillColor: getDateTemperatureColor(date),
    fillOpacity: 0.3,
    weight: 0
  });

  overlay.bindPopup(`
    <div class="text-sm">
      <div class="font-semibold text-slate-800">Land Surface Temperature</div>
      <div class="text-slate-600">Date: ${date}</div>
      <div class="text-xs text-slate-500 mt-1">Range: ${getDateTemperatureRange(date)}°C</div>
      <div class="text-xs text-slate-500">Landsat 8 Collection 2 Level 2</div>
    </div>
  `);

  layerGroup.addLayer(overlay);
}

function getDateTemperatureColor(date: string): string {
  switch (date) {
    case '2023-07-12': return '#FF6B35'; // July - warm orange
    case '2023-08-29': return '#FF3333'; // August - hottest, red
    case '2023-09-14': return '#FF8C42'; // September - cooling, lighter orange
    default: return '#FF6B35';
  }
}

function getDateTemperatureRange(date: string): string {
  switch (date) {
    case '2023-07-12': return '18-42';
    case '2023-08-29': return '21-44'; // Hottest month
    case '2023-09-14': return '16-38';
    default: return '16-44';
  }
}

function simulateTemperatureAt(lat: number, lng: number, date: string): number {
  // Simulate temperature based on distance from city center and date
  const centerLat = 34.0522;
  const centerLng = -118.2437;
  const distance = Math.sqrt((lat - centerLat) ** 2 + (lng - centerLng) ** 2);

  // Base temperature varies by date
  const baseTemp = date === '2023-08-29' ? 35 : date === '2023-07-12' ? 32 : 28;

  // Urban heat island effect - higher temps closer to center
  const urbanEffect = Math.max(0, 10 - distance * 25);

  // Add some randomness
  const randomVariation = (Math.random() - 0.5) * 4;

  return Math.round((baseTemp + urbanEffect + randomVariation) * 10) / 10;
}

function simulateLandCoverAt(lat: number, lng: number): string {
  // Simulate land cover based on location
  const centerLat = 34.0522;
  const centerLng = -118.2437;
  const distance = Math.sqrt((lat - centerLat) ** 2 + (lng - centerLng) ** 2);

  if (distance < 0.05) return 'Buildings';
  if (distance < 0.1) return 'Unvegetated Asphalt';
  if (distance < 0.15) return 'Concrete';
  if (distance < 0.2) return 'Vegetated Asphalt';
  if (distance < 0.25) return 'Sparse Vegetation';
  return 'Dense Vegetation';
}

function simulateMUHIStatusAt(lat: number, lng: number, date: string): string[] {
  const temp = simulateTemperatureAt(lat, lng, date);
  const status: string[] = [];

  if (temp >= 40) status.push('Canopy Threshold (≥40°C)');
  if (temp >= 39) status.push('Top 2% Threshold (≥39°C)');

  return status.length > 0 ? status : ['Below MUHI thresholds'];
}

export default MapContainer;