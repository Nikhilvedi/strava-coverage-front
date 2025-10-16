'use client';

import { useEffect, useRef, useState } from 'react';
import { mapsAPI } from '@/app/lib/api';
import { getActivityColor } from '@/app/lib/activityColors';

interface MapConfig {
  default_center: [number, number];
  default_zoom: number;
  tile_servers: Array<{
    id: string;
    name: string;
    url: string;
    attribution: string;
    max_zoom: number;
    default: boolean;
  }>;
  layers: {
    cities: {
      endpoint: string;
      style: any;
    };
    activities: {
      endpoint: string;
      style: any;
    };
    coverage: {
      endpoint: string;
      style: any;
    };
  };
}

interface MapComponentProps {
  userId?: number;
  cityId?: number;
  showCities?: boolean;
  showActivities?: boolean;
  showCoverage?: boolean;
  className?: string;
}

export default function MapComponent({
  userId,
  cityId,
  showCities = true,
  showActivities = true,
  showCoverage = false,
  className = "h-96"
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const layersRef = useRef<{
    cities?: L.LayerGroup;
    activities?: L.LayerGroup;
    coverage?: L.LayerGroup;
  }>({});
  
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Load map configuration
  useEffect(() => {
    const loadMapConfig = async () => {
      try {
        const response = await mapsAPI.getConfig();
        setMapConfig(response.data);
      } catch (err) {
        console.error('Failed to load map config:', err);
        setError('Failed to load map configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadMapConfig();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !mapConfig) return;

    const initializeMap = async () => {
      try {
        // Clean up any existing map instance first
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        setIsMapReady(false);

        // Clear the map container
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
          (mapRef.current as any)._leaflet_id = null;
        }

        // Dynamic import of Leaflet
        const L = (await import('leaflet')).default;
        leafletRef.current = L;
        
        // Fix for default markers in Leaflet with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map instance
        const map = L.map(mapRef.current!, {
          center: mapConfig.default_center,
          zoom: mapConfig.default_zoom,
          zoomControl: true,
        });

        // Add tile layer (with fallback if no tile servers configured)
        const tileServer = mapConfig.tile_servers?.[0] || {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '© OpenStreetMap contributors'
        };
        
        const tileLayer = L.tileLayer(tileServer.url, {
          attribution: tileServer.attribution,
          maxZoom: 18,
        });
        tileLayer.addTo(map);      // Initialize layer groups
      layersRef.current = {
        cities: L.layerGroup().addTo(map),
        activities: L.layerGroup().addTo(map),
        coverage: L.layerGroup().addTo(map),
      };

      mapInstanceRef.current = map;

            // Add base layers for layer control
      const baseLayers: { [key: string]: L.TileLayer } = {};
      (mapConfig.tile_servers || []).forEach((server: any) => {
        baseLayers[server.name] = L.tileLayer(server.url, {
          attribution: server.attribution,
          maxZoom: 18,
        });
      });

      const overlayLayers: { [key: string]: L.LayerGroup } = {};
      if (layersRef.current.cities) overlayLayers['Cities'] = layersRef.current.cities;
      if (layersRef.current.activities) overlayLayers['Activities'] = layersRef.current.activities;
      if (layersRef.current.coverage) overlayLayers['Coverage'] = layersRef.current.coverage;

        L.control.layers(baseLayers, overlayLayers).addTo(map);

        // Mark map as ready for data loading
        setIsMapReady(true);

      } catch (err) {
        console.error('Failed to initialize map:', err);
        setError('Failed to initialize map');
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapConfig]);

  // Load cities
  useEffect(() => {
    console.log('Cities useEffect triggered:', {
      mapInstance: !!mapInstanceRef.current,
      citiesLayer: !!layersRef.current.cities,
      showCities,
      leafletRef: !!leafletRef.current
    });
    
    if (!isMapReady || !showCities || !leafletRef.current || !layersRef.current.cities) return;

    const loadCities = async () => {
      try {
        console.log('Loading cities data...');
        const response = cityId 
          ? await mapsAPI.getCity(cityId)
          : await mapsAPI.getCities();

        console.log('Cities response:', response.data);
        const geoJsonLayer = leafletRef.current.geoJSON(response.data, {
          style: {
            fillColor: '#3388ff',
            fillOpacity: 0.2,
            color: '#3388ff',
            weight: 2,
            opacity: 0.8,
          },
          onEachFeature: (feature: any, layer: any) => {
            if (feature.properties) {
              const popupContent = `
                <div class="p-2">
                  <h3 class="font-semibold text-lg">${feature.properties.name}</h3>
                  <p class="text-gray-600">${feature.properties.country_code}</p>
                  ${feature.properties.id ? `<p class="text-sm text-gray-500">City ID: ${feature.properties.id}</p>` : ''}
                </div>
              `;
              layer.bindPopup(popupContent);
            }
          }
        });

        layersRef.current.cities?.clearLayers();
        layersRef.current.cities?.addLayer(geoJsonLayer);

        // Fit map to cities bounds if showing specific city
        if (cityId) {
          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current?.fitBounds(bounds);
          }
        }

      } catch (err) {
        console.error('Failed to load cities:', err);
      }
    };

    loadCities();
  }, [showCities, cityId, isMapReady]);

  // Load activities
  useEffect(() => {
    console.log('Activities useEffect triggered:', {
      mapInstance: !!mapInstanceRef.current,
      activitiesLayer: !!layersRef.current.activities,
      showActivities,
      userId,
      leafletRef: !!leafletRef.current
    });
    
    if (!isMapReady || !showActivities || !userId || !leafletRef.current || !layersRef.current.activities) return;

    const loadActivities = async () => {
      try {
        console.log('Loading activities data for user:', userId);
        const response = await mapsAPI.getActivities(userId);

        console.log('Activities response:', response.data);
        const geoJsonLayer = leafletRef.current.geoJSON(response.data, {
          style: (feature: any) => {
            const activityType = feature?.properties?.activity_type;
            const sportType = feature?.properties?.sport_type;
            const color = getActivityColor(activityType, sportType);
            
            return {
              color: color,
              weight: 3,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            if (feature.properties) {
              const props = feature.properties;
              const popupContent = `
                <div class="p-2 min-w-48">
                  <h3 class="font-semibold text-lg">${props.activity_id ? `Activity ${props.activity_id}` : 'Activity'}</h3>
                  <div class="space-y-1 text-sm">
                    <p><span class="font-medium">Type:</span> ${props.activity_type || props.sport_type || 'Unknown'}</p>
                    <p><span class="font-medium">Distance:</span> ${props.distance_km ? props.distance_km.toFixed(2) + ' km' : 'N/A'}</p>
                    ${props.coverage_percentage ? `<p><span class="font-medium">Coverage:</span> ${props.coverage_percentage.toFixed(1)}%</p>` : ''}
                    ${props.city_name ? `<p><span class="font-medium">City:</span> ${props.city_name}</p>` : ''}
                  </div>
                </div>
              `;
              layer.bindPopup(popupContent);
            }
          }
        });

        layersRef.current.activities?.clearLayers();
        layersRef.current.activities?.addLayer(geoJsonLayer);

        // Fit map to activities bounds if no city specified
        if (!cityId && response.data.features && response.data.features.length > 0) {
          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current?.fitBounds(bounds, { padding: [20, 20] });
          }
        }

      } catch (err) {
        console.error('Failed to load activities:', err);
      }
    };

    loadActivities();
  }, [showActivities, userId, cityId, isMapReady]);

  // Load coverage
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current.coverage || !showCoverage || !userId || !cityId) return;

    const loadCoverage = async () => {
      try {
        const response = await mapsAPI.getCoverage(userId, cityId);

        const geoJsonLayer = leafletRef.current.geoJSON(response.data, {
          style: (feature: any) => {
            // Style based on coverage status
            const isCovered = feature?.properties?.covered || false;
            return {
              fillColor: isCovered ? '#10b981' : '#ef4444',
              fillOpacity: 0.6,
              color: isCovered ? '#059669' : '#dc2626',
              weight: 1,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            if (feature.properties) {
              const props = feature.properties;
              const popupContent = `
                <div class="p-2">
                  <h3 class="font-semibold text-lg">${props.covered ? 'Covered Area' : 'Uncovered Area'}</h3>
                  <p class="text-sm text-gray-600">
                    Status: <span class="font-medium ${props.covered ? 'text-green-600' : 'text-red-600'}">
                      ${props.covered ? 'Explored' : 'Unexplored'}
                    </span>
                  </p>
                </div>
              `;
              layer.bindPopup(popupContent);
            }
          }
        });

        layersRef.current.coverage?.clearLayers();
        layersRef.current.coverage?.addLayer(geoJsonLayer);

      } catch (err) {
        console.error('Failed to load coverage:', err);
      }
    };

    loadCoverage();
  }, [showCoverage, userId, cityId]);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-red-50 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-red-600">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}