'use client';

import { useEffect, useRef } from 'react';
import { mapsAPI } from '@/app/lib/api';

interface MapPreviewProps {
  userId?: number;
  cityId?: number;
  className?: string;
}

export default function MapPreview({ userId, cityId, className = "h-48" }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Clean up any existing map instance first
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Clear the map container
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
          (mapRef.current as any)._leaflet_id = null;
        }

        // Dynamic import of Leaflet
        const L = (await import('leaflet')).default;
        
        // Leaflet CSS is loaded globally via _app.tsx or layout

        // Create map instance
        const map = L.map(mapRef.current!, {
          center: [53.3811, -1.4701], // Default to Sheffield
          zoom: 11,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          dragging: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
        });

        // Add tile layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        });
        tileLayer.addTo(map);

        mapInstanceRef.current = map;

        // Load data if available
        if (userId) {
          loadPreviewData(map, L, userId, cityId);
        }

      } catch (err) {
        console.error('Failed to initialize map preview:', err);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userId, cityId]);

  const loadPreviewData = async (map: any, L: any, userId: number, cityId?: number) => {
    try {
      // Load city boundary if specified
      if (cityId) {
        const cityResponse = await mapsAPI.getCity(cityId);
        const cityLayer = L.geoJSON(cityResponse.data, {
          style: {
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            color: '#3388ff',
            weight: 2,
            opacity: 0.8,
          },
        }).addTo(map);
        
        // Fit to city bounds
        const bounds = cityLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
      }

      // Load activities
      const activitiesResponse = await mapsAPI.getActivities(userId);
      const activitiesLayer = L.geoJSON(activitiesResponse.data, {
        style: {
          color: '#ff6b35',
          weight: 2,
          opacity: 0.7,
        },
      }).addTo(map);

      // If no city specified, fit to activities
      if (!cityId) {
        const bounds = activitiesLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [10, 10] });
        }
      }

    } catch (err) {
      console.error('Failed to load preview data:', err);
    }
  };

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative group cursor-pointer`}>
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 px-3 py-1 rounded-md">
          <span className="text-sm font-medium text-gray-900">Click to view full map</span>
        </div>
      </div>
    </div>
  );
}