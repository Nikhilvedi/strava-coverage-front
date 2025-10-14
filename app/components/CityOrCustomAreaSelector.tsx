'use client';

import { useState, useEffect, useCallback } from 'react';
import { citiesAPI } from '@/app/lib/api';
import { UI_STRINGS, TOOLTIPS, ICONS, PLACEHOLDERS } from '@/app/lib/constants';

interface City {
  id: number;
  name: string;
  country_code: string;
  latitude?: number;  // For external cities from geocoding
  longitude?: number; // For external cities from geocoding
}

interface CityOrCustomAreaSelectorProps {
  cities: City[];
  onCitySelected: (cityId: number) => void;
  onCustomAreaModeSelected: () => void;
}

export default function CityOrCustomAreaSelector({ 
  cities: initialCities, 
  onCitySelected, 
  onCustomAreaModeSelected 
}: CityOrCustomAreaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<'city' | 'custom' | null>(null);
  const [searchResults, setSearchResults] = useState<City[]>(initialCities);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Debounced search function
  const searchCities = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults(initialCities);
        return;
      }

      setIsSearching(true);
      setSearchError('');

      try {
        const response = await citiesAPI.search(query);
        setSearchResults(response.data || []);
      } catch (error: any) {
        console.error('Failed to search cities:', error);
        setSearchError('Failed to search cities. Please try again.');
        // Fallback to local filtering
        const filtered = initialCities.filter(city =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.country_code.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    },
    [initialCities]
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCities(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCities]);

  const handleCitySelect = async (city: City) => {
    // If it's an external city (ID = 0), create it first
    if (city.id === 0 && city.latitude && city.longitude) {
      try {
        setIsSearching(true);
        const response = await citiesAPI.createFromExternal({
          name: city.name,
          country_code: city.country_code,
          latitude: city.latitude,
          longitude: city.longitude,
        });
        
        // Use the newly created city's ID
        onCitySelected(response.data.id);
      } catch (error) {
        console.error('Failed to create city:', error);
        setSearchError('Failed to create city. Please try again.');
      } finally {
        setIsSearching(false);
      }
    } else {
      // It's a local city, use it directly
      onCitySelected(city.id);
    }
  };

  const handleCustomAreaSelect = () => {
    setSelectedMode('custom');
    onCustomAreaModeSelected();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{UI_STRINGS.AREA_SELECTION.CHOOSE_COVERAGE_AREA}</h3>
      
      {/* Mode Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedMode('city')}
          title={TOOLTIPS.AREA_SELECTION.CITY_MODE}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
            selectedMode === 'city' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="text-xl mb-1">{ICONS.CITY}</div>
            <div className="font-medium">{UI_STRINGS.AREA_SELECTION.SELECT_EXISTING_CITY}</div>
            <div className="text-sm text-gray-600">{UI_STRINGS.AREA_SELECTION.CITY_DESCRIPTION}</div>
          </div>
        </button>
        
        <button
          onClick={handleCustomAreaSelect}
          title={TOOLTIPS.AREA_SELECTION.CUSTOM_MODE}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
            selectedMode === 'custom' 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="text-xl mb-1">{ICONS.DRAW}</div>
            <div className="font-medium">{UI_STRINGS.AREA_SELECTION.DRAW_CUSTOM_AREA}</div>
            <div className="text-sm text-gray-600">{UI_STRINGS.AREA_SELECTION.CUSTOM_DESCRIPTION}</div>
          </div>
        </button>
      </div>

      {/* City Selection Interface */}
      {selectedMode === 'city' && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder={UI_STRINGS.AREA_SELECTION.SEARCH_ALL_CITIES}
              title={TOOLTIPS.AREA_SELECTION.SEARCH_CITIES}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            {isSearching ? (
              <div className="p-4 text-gray-500 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Searching cities...
              </div>
            ) : searchError ? (
              <div className="p-4 text-red-500 text-center">
                {searchError}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                {searchTerm ? UI_STRINGS.AREA_SELECTION.NO_CITIES_FOUND : UI_STRINGS.AREA_SELECTION.NO_CITIES_AVAILABLE}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {searchResults.map((city: City) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    title={`Select ${city.name}, ${city.country_code} for coverage analysis`}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{city.name}</div>
                          {city.id === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              Add new
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{city.country_code}</div>
                      </div>
                      <div className="text-blue-600 flex-shrink-0">
                        {city.id === 0 ? (
                          // Icon for external/new cities
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ) : (
                          // Icon for existing cities
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Area Instructions */}
      {selectedMode === 'custom' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="text-green-600 mr-3 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-1">{UI_STRINGS.AREA_SELECTION.CUSTOM_MODE_ACTIVATED}</h4>
              <p className="text-sm text-green-700">
                {UI_STRINGS.AREA_SELECTION.CUSTOM_MODE_INSTRUCTIONS}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}