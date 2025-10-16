'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { citiesAPI, coverageAPI } from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import dynamic from 'next/dynamic';
import { ACTIVITY_COLORS, getActivityColor } from '@/app/lib/activityColors';

const MapComponent = dynamic(() => import('@/app/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded flex items-center justify-center">Loading map...</div>
});

interface City {
  id: number;
  name: string;
  country_code: string;
}

interface CityWithCoverage {
  id: number;
  name: string;
  country_code: string;
  area_km2: number;
  activity_count: number;
  average_coverage_percent: number;
  max_coverage_percent: number;
  total_distance_km: number;
  last_activity_date: string;
}

interface CoverageSummary {
  user_id: string;
  total_cities: number;
  city_coverage: Array<{
    city_id: number;
    city_name: string;
    country_code: string;
    coverage_percent: number;
    distance_covered_km: number;
    total_distance_km: number;
    activity_count: number;
    last_activity_date: string;
  }>;
  global_stats: {
    total_distance_covered_km: number;
    average_coverage_percent: number;
    best_city_name: string;
    best_city_coverage_percent: number;
  };
}

function MapsPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<CityWithCoverage[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
  const [showLayers, setShowLayers] = useState({
    cities: true,
    activities: true,
    coverage: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      // Check for city parameter in URL
      const cityParam = searchParams.get('city');
      if (cityParam) {
        const cityId = parseInt(cityParam);
        if (!isNaN(cityId)) {
          setSelectedCityId(cityId);
          setShowLayers(prev => ({ ...prev, coverage: true }));
        }
      }
    }
  }, [user, searchParams]);

  const loadCities = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await citiesAPI.getUserCitiesWithCoverage(user.id);
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Failed to load user cities:', error);
    }
  }, [user?.id]);

  const loadCoverageSummary = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await coverageAPI.getSummary(user.id);
      setCoverageSummary(response.data);
    } catch (error) {
      console.error('Failed to load coverage summary:', error);
    }
  }, [user?.id]);

  // Load data when user changes
  useEffect(() => {
    if (user?.id) {
      loadCities();
      loadCoverageSummary();
    }
  }, [user?.id, loadCities, loadCoverageSummary]);

  // Set default city to user's most active city when data loads
  useEffect(() => {
    if (cities && cities.length > 0 && !selectedCityId && !searchParams.get('city')) {
      // Cities are already sorted by coverage (highest first)
      const bestCity = cities[0];
      
      if (bestCity) {
        setSelectedCityId(bestCity.id);
        setShowLayers(prev => ({ ...prev, coverage: true }));
      }
    }
  }, [cities, selectedCityId, searchParams]);





  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Layer Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Layers</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLayers.cities}
                    onChange={(e) => setShowLayers(prev => ({ ...prev, cities: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-gray-700">City Boundaries</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLayers.activities}
                    onChange={(e) => setShowLayers(prev => ({ ...prev, activities: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-gray-700">Your Activities</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLayers.coverage}
                    onChange={(e) => setShowLayers(prev => ({ ...prev, coverage: e.target.checked }))}
                    disabled={!selectedCityId}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-gray-700">
                    Coverage Analysis
                    {!selectedCityId && <span className="text-xs text-gray-500 block">(select a city first)</span>}
                  </span>
                </label>
              </div>
            </div>

            {/* City Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">City Focus</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCityId(null);
                    setShowLayers(prev => ({ ...prev, coverage: false }));
                    
                    // Clear city parameter from URL
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('city');
                    window.history.pushState({}, '', newUrl.toString());
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCityId === null 
                      ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">All Cities</div>
                  <div className="text-sm text-gray-600">View all available cities</div>
                </button>

                {cities.map((city) => {
                  return (
                    <button
                      key={city.id}
                      onClick={() => {
                        setSelectedCityId(city.id);
                        setShowLayers(prev => ({ ...prev, coverage: true }));
                        
                        // Update URL to reflect city selection
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set('city', city.id.toString());
                        window.history.pushState({}, '', newUrl.toString());
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCityId === city.id 
                          ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-sm text-gray-600">{city.country_code}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-orange-600">
                            {city.average_coverage_percent.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {city.activity_count} activities
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity Type Legend */}
            {showLayers.activities && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ACTIVITY_COLORS.Run }}></div>
                    <span className="text-sm text-gray-700">Running</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ACTIVITY_COLORS.Ride }}></div>
                    <span className="text-sm text-gray-700">Cycling</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ACTIVITY_COLORS.Walk }}></div>
                    <span className="text-sm text-gray-700">Walking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ACTIVITY_COLORS.Hike }}></div>
                    <span className="text-sm text-gray-700">Hiking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ACTIVITY_COLORS.default }}></div>
                    <span className="text-sm text-gray-700">Other Activities</span>
                  </div>
                </div>
              </div>
            )}

            {/* Coverage Legend */}
            {showLayers.coverage && selectedCityId && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Legend</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">Covered Areas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700">Uncovered Areas</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCityId 
                    ? `${cities.find(c => c.id === selectedCityId)?.name} Coverage Map`
                    : 'All Cities Overview'
                  }
                </h2>
                
                {selectedCityId && cities && (
                  <div className="text-right">
                    {(() => {
                      const city = cities.find(c => c.id === selectedCityId);
                      return city ? (
                        <>
                          <div className="text-2xl font-bold text-orange-600">
                            {city.average_coverage_percent.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {city.activity_count} activities
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">No data</div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <MapComponent
                key={`map-${selectedCityId || 'all'}`}
                userId={user.id}
                cityId={selectedCityId || undefined}
                showCities={showLayers.cities}
                showActivities={showLayers.activities}
                showCoverage={showLayers.coverage}
                className="h-96 lg:h-[600px]"
              />

              {/* Map Instructions */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Map Controls</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click and drag to pan the map</li>
                  <li>• Use mouse wheel or +/- buttons to zoom</li>
                  <li>• Click on activities or areas for more details</li>
                  <li>• Use layer controls in top-right to toggle visibility</li>
                  <li>• Select a city from the sidebar to focus coverage analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <MapsPageContent />
    </Suspense>
  );
}