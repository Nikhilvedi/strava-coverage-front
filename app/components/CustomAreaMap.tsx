'use client';

import { useEffect, useRef, useState } from 'react';

interface DrawnArea {
  id: string;
  name: string;
  coordinates: [number, number][];
  coverage?: number;
}

interface CustomAreaMapProps {
  onAreaDrawn: (area: DrawnArea) => void;
  drawnAreas: DrawnArea[];
}

export default function CustomAreaMap({ onAreaDrawn, drawnAreas }: CustomAreaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [leafletElements, setLeafletElements] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!mapRef.current || isMapReady || leafletElements) return;

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = await import('leaflet');
        
        // Import Leaflet.draw and ensure it's attached to L
        const leafletDraw = await import('leaflet-draw');
        
        // Ensure draw is properly attached
        console.log('Leaflet loaded:', !!L);
        console.log('Leaflet.draw loaded:', !!leafletDraw);
        console.log('L.Control.Draw available:', !!(L as any).Control?.Draw);

        // Fix for default markers
        delete (L as any).Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Double-check if mapRef.current exists
        if (!mapRef.current) return;
        
        // Clear any existing map instance
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          } catch (e) {
            console.warn('Error removing existing map:', e);
          }
        }
        
        // Clear the container
        mapRef.current.innerHTML = '';

        // Initialize map
        const map = L.map(mapRef.current).setView([53.3811, -1.4701], 13);
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Initialize feature group for drawn areas
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialize draw control with proper type checking
        const LeafletDraw = (L as any).Control?.Draw;
        if (LeafletDraw) {
          console.log('Initializing draw control...');
          const drawControl = new LeafletDraw({
            position: 'topright',
            draw: {
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Error:</strong> shape edges cannot cross!'
                },
                shapeOptions: {
                  color: '#97009c',
                  fillOpacity: 0.3,
                  weight: 2
                }
              },
              polyline: false,
              rectangle: {
                shapeOptions: {
                  color: '#97009c',
                  fillOpacity: 0.3,
                  weight: 2
                }
              },
              circle: false,
              marker: false,
              circlemarker: false
            },
            edit: {
              featureGroup: drawnItems,
              remove: true
            }
          });
          map.addControl(drawControl);
          console.log('Draw control added successfully');
        } else {
          console.error('Leaflet.draw not available. Available controls:', Object.keys((L as any).Control || {}));
        }

        // Event handlers - use string constants instead of L.Draw.Event
        map.on('draw:drawstart', () => {
          setIsDrawing(true);
        });

        map.on('draw:drawstop', () => {
          setIsDrawing(false);
        });

        map.on('draw:created', (event: any) => {
          const layer = event.layer;
          const coordinates = layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
          
          console.log('Draw event created:', coordinates);
          drawnItems.addLayer(layer);
          
          // Generate a unique ID and name
          const id = Date.now().toString();
          const name = `Custom Area ${drawnItems.getLayers().length}`;
          
          const drawnArea: DrawnArea = {
            id,
            name,
            coordinates
          };
          
          console.log('Calling onAreaDrawn with:', drawnArea);
          onAreaDrawn(drawnArea);
        });

        map.on('draw:edited', () => {
          // Handle editing existing areas if needed
          console.log('Areas edited');
        });

        map.on('draw:deleted', () => {
          // Handle deletion if needed
          console.log('Areas deleted');
        });

        setLeafletElements({ map, drawnItems, L });
        setIsMapReady(true);

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
      setIsMapReady(false);
      setLeafletElements(null);
    };
  }, []);

  // Add existing drawn areas to map
  useEffect(() => {
    if (!leafletElements || !isMapReady || !drawnAreas) return;

    console.log('Updating drawn areas on map. Total areas:', drawnAreas.length);
    console.log('drawnAreas data:', JSON.stringify(drawnAreas, null, 2));
    const { drawnItems, L } = leafletElements;
    
    // Clear existing layers
    drawnItems.clearLayers();
    
    // Add drawn areas back to map
    drawnAreas.forEach((area, index) => {
      if (!area || !area.coordinates || !Array.isArray(area.coordinates)) {
        console.warn(`Skipping invalid area at index ${index}:`, area);
        return;
      }
      
      console.log(`Adding area ${index + 1}:`, area.name, area.coordinates);
      
      // Safely map coordinates with validation
      const latLngs = area.coordinates
        .filter(coord => Array.isArray(coord) && coord.length >= 2 && 
                        typeof coord[0] === 'number' && typeof coord[1] === 'number')
        .map(coord => [coord[0], coord[1]]);
      
      if (latLngs.length === 0) {
        console.warn(`Skipping area ${area.name} - no valid coordinates`);
        return;
      }
      
      const polygon = L.polygon(latLngs, {
        color: '#97009c',
        fillOpacity: 0.3,
        weight: 2
      });
      
      // Add tooltip with area name and coverage if available
      const tooltipContent = area.coverage !== undefined && area.coverage !== null && typeof area.coverage === 'number' && !isNaN(area.coverage)
        ? `${area.name}<br/>Coverage: ${area.coverage.toFixed(1)}%`
        : area.name;
      
      polygon.bindTooltip(tooltipContent, { permanent: false, direction: 'center' });
      drawnItems.addLayer(polygon);
    });
  }, [drawnAreas, leafletElements, isMapReady]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="h-96 w-full rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />
      
      {isDrawing && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-md px-3 py-2 text-sm text-blue-800">
          <div className="flex items-center">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Drawing mode active - click to add points
          </div>
        </div>
      )}
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}