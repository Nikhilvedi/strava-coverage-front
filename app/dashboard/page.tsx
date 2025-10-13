'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { importAPI, detectionAPI, coverageAPI, citiesAPI } from '@/app/lib/api';
import { customAreasAPI, CustomArea } from '@/app/lib/api/customAreas';
import Navbar from '@/app/components/Navbar';
import dynamic from 'next/dynamic';

const MapPreview = dynamic(() => import('@/app/components/MapPreview'), {
  ssr: false
});

const CustomAreaMap = dynamic(() => import('@/app/components/CustomAreaMap'), {
  ssr: false
});

interface ImportStatus {
  user_id: number;
  total_activities: number;
  imported_count: number;
  processed_count: number;
  failed_count: number;
  last_import_time: string;
  in_progress: boolean;
  current_page: number;
  estimated_remaining: number;
}

interface City {
  id: number;
  name: string;
  country_code: string;
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

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'importing' | 'detecting' | 'calculating' | 'completed'>('idle');
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [customAreas, setCustomAreas] = useState<CustomArea[]>([]);
  const [showCustomAreaMap, setShowCustomAreaMap] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadCities();
      loadImportStatus();
      loadCoverageSummary();
      loadCustomAreas();
    }
  }, [user]);

  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      setCities(response.data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadImportStatus = async () => {
    if (!user) return;
    
    try {
      const response = await importAPI.getStatus(user.id);
      setImportStatus(response.data);
      
      // If import is in progress and we're not already processing, start polling
      if (response.data.in_progress && !isProcessing) {
        setIsProcessing(true);
        setCurrentStep('importing');
        setProcessingProgress('Import in progress...');
        startPolling();
      }
    } catch (error) {
      console.error('Failed to load import status:', error);
      // If there's no import status yet, that's okay - the user hasn't started importing
      setImportStatus(null);
    }
  };

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      if (!user) {
        clearInterval(pollInterval);
        return;
      }
      
      try {
        const response = await importAPI.getStatus(user.id);
        setImportStatus(response.data);
        
        if (!response.data.in_progress) {
          clearInterval(pollInterval);
          setIsProcessing(false);
          setCurrentStep('completed');
          setProcessingProgress('Import completed successfully!');
          // Refresh coverage summary when import completes
          loadCoverageSummary();
        }
      } catch (error) {
        console.error('Failed to poll import status:', error);
        clearInterval(pollInterval);
        setIsProcessing(false);
        setCurrentStep('idle');
        setProcessingProgress('Error occurred during import polling');
      }
    }, 2000);
  };

  const loadCoverageSummary = async () => {
    if (!user) return;
    
    try {
      const response = await coverageAPI.getSummary(user.id);
      setCoverageSummary(response.data);
    } catch (error) {
      console.error('Failed to load coverage summary:', error);
      // If there's no coverage data yet, that's okay - the user hasn't calculated coverage
      setCoverageSummary(null);
    }
  };

  const loadCustomAreas = async () => {
    if (!user) return;
    
    try {
      console.log('Loading custom areas for user:', user.id);
      const response = await customAreasAPI.getUserAreas(user.id);
      console.log('Custom areas loaded:', response.data);
      setCustomAreas(response.data);
    } catch (error) {
      console.error('Failed to load custom areas:', error);
      setCustomAreas([]);
    }
  };

  const handleAreaDrawn = async (area: { id: string; name: string; coordinates: [number, number][] }) => {
    console.log('Area drawn:', area);
    if (!user) {
      console.error('No user found when trying to create area');
      return;
    }
    
    try {
      console.log('Creating area for user:', user.id);
      const response = await customAreasAPI.create(user.id, {
        name: area.name,
        coordinates: area.coordinates
      });
      console.log('Area created successfully:', response.data);
      
      // Reload custom areas to get the new one with ID
      await loadCustomAreas();
      console.log('Custom areas reloaded');
    } catch (error: any) {
      console.error('Failed to create custom area:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Show user-friendly error
      alert(`Failed to create custom area: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const calculateAreaCoverage = async (areaId: number) => {
    try {
      console.log('Calculating coverage for area ID:', areaId);
      const response = await customAreasAPI.calculateCoverage(areaId);
      console.log('Coverage calculated successfully:', response.data);
      // Reload to get updated coverage
      await loadCustomAreas();
    } catch (error: any) {
      console.error('Failed to calculate coverage:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Show user-friendly error
      alert(`Failed to calculate coverage: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const deleteArea = async (areaId: number) => {
    try {
      await customAreasAPI.delete(areaId);
      await loadCustomAreas();
    } catch (error) {
      console.error('Failed to delete custom area:', error);
    }
  };

  const startAutomatedWorkflow = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    setCurrentStep('importing');
    
    try {
      // Step 1: Import Activities
      setProcessingProgress('Starting import of your Strava activities...');
      await importAPI.startImport(user.id);
      
      // Poll for import completion
      let importCompleted = false;
      while (!importCompleted) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        try {
          const response = await importAPI.getStatus(user.id);
          const status = response.data;
          
          if (!status.in_progress) {
            importCompleted = true;
            setProcessingProgress(`Import completed! Imported ${status.imported_count} activities.`);
          } else {
            setProcessingProgress(`Importing activities... Page ${status.current_page}, ${status.imported_count} activities imported so far.`);
          }
        } catch (error) {
          console.error('Failed to check import status:', error);
          break;
        }
      }
      
      if (!importCompleted) {
        throw new Error('Import did not complete successfully');
      }
      
      // Step 2: Auto-Detect Cities
      setCurrentStep('detecting');
      setProcessingProgress('Analyzing your activities to detect cities...');
      
      const detectResponse = await detectionAPI.autoDetect(user.id);
      const citiesFound = detectResponse.data.cities?.length || 0;
      setProcessingProgress(`City detection completed! Found ${citiesFound} cities with activities.`);
      
      // Step 3: Calculate Coverage
      setCurrentStep('calculating');
      setProcessingProgress('Calculating coverage for each city...');
      
      await coverageAPI.calculateAll(user.id);
      setProcessingProgress('Coverage calculation completed!');
      
      // Reload data
      await loadCoverageSummary();
      await loadImportStatus();
      
      setCurrentStep('completed');
      setProcessingProgress('All done! Your Strava coverage has been calculated.');
      
    } catch (error) {
      console.error('Failed during automated workflow:', error);
      setProcessingProgress(`Error: ${error instanceof Error ? error.message : 'An error occurred during processing'}`);
      setCurrentStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Automated Workflow - Only show if no coverage data exists yet */}
        {(!coverageSummary || !coverageSummary.city_coverage || coverageSummary.city_coverage.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Your Strava Coverage Analysis</h2>
          
          {!isProcessing && currentStep === 'idle' && (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Click the button below to automatically import your activities, detect cities, and calculate coverage.
              </p>
              <button
                onClick={startAutomatedWorkflow}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
              >
                Start Coverage Analysis
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-lg font-semibold text-gray-900">Processing...</span>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <div className={`flex items-center ${currentStep === 'importing' ? 'text-blue-600' : currentStep === 'detecting' || currentStep === 'calculating' || currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mr-2 ${currentStep === 'importing' ? 'bg-blue-600 animate-pulse' : currentStep === 'detecting' || currentStep === 'calculating' || currentStep === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Import Activities
                  </div>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${currentStep === 'detecting' ? 'text-blue-600' : currentStep === 'calculating' || currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mr-2 ${currentStep === 'detecting' ? 'bg-blue-600 animate-pulse' : currentStep === 'calculating' || currentStep === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Detect Cities
                  </div>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <div className={`flex items-center ${currentStep === 'calculating' ? 'text-blue-600' : currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full mr-2 ${currentStep === 'calculating' ? 'bg-blue-600 animate-pulse' : currentStep === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Calculate Coverage
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {processingProgress}
              </p>
            </div>
          )}

          {currentStep === 'completed' && (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Analysis Complete!</h3>
                <p className="text-gray-600">Your Strava coverage analysis is ready. Check out your results below.</p>
              </div>
              <button
                onClick={() => {
                  setCurrentStep('idle');
                  setProcessingProgress('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Start New Analysis
              </button>
            </div>
          )}
        </div>
        )}

        {/* Analysis Complete Status */}
        {coverageSummary && coverageSummary.city_coverage && coverageSummary.city_coverage.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Coverage Analysis Complete!</h3>
                <p className="text-green-700">
                  Your Strava coverage has been analyzed for {coverageSummary.city_coverage.length} cities. 
                  View your interactive maps and detailed results below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Areas Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Custom Map Areas</h2>
            <button
              onClick={() => setShowCustomAreaMap(!showCustomAreaMap)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showCustomAreaMap ? 'Hide Map' : 'Draw New Area'}
            </button>
          </div>

          {/* Custom Area Drawing Map */}
          {showCustomAreaMap && (
            <div className="mb-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Draw Your Custom Area</h3>
                <p className="text-gray-600">
                  Use the drawing controls on the map to create a custom area. Click the polygon or rectangle tool, 
                  then click on the map to draw your area.
                </p>
              </div>
              <CustomAreaMap 
                onAreaDrawn={handleAreaDrawn} 
                drawnAreas={customAreas.map(area => ({
                  id: area.id.toString(),
                  name: area.name,
                  coordinates: area.coordinates,
                  coverage: area.coverage_percentage
                }))} 
              />
            </div>
          )}

          {/* Custom Areas List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Custom Areas</h3>
            {customAreas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-lg font-medium mb-2">No custom areas yet</p>
                <p>Click "Draw New Area" to create your first custom coverage area</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customAreas.map((area) => (
                  <div key={area.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">{area.name}</h4>
                      <button
                        onClick={() => deleteArea(area.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {area.coverage_percentage !== null && area.coverage_percentage !== undefined ? (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coverage:</span>
                          <span className="font-semibold">{area.coverage_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(area.coverage_percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{area.activities_count} activities</p>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <button
                          onClick={() => calculateAreaCoverage(area.id)}
                          className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                        >
                          Calculate Coverage
                        </button>
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      Created: {new Date(area.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/maps')}
              className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Interactive Maps
            </button>
            <button
              onClick={() => window.open('https://www.strava.com', '_blank')}
              className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7.008 13.828h4.172"/>
              </svg>
              View on Strava
            </button>
          </div>
        </div>

        {/* Coverage Summary */}
        {coverageSummary && coverageSummary.city_coverage && coverageSummary.city_coverage.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Coverage Summary</h2>
              <button
                onClick={() => router.push('/maps')}
                className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
              >
                View on Map 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {coverageSummary.city_coverage.map((city, index) => (
                <div key={city.city_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{city.city_name} <span className="text-sm text-gray-500">({city.country_code})</span></h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coverage</span>
                          <span className="font-semibold text-xl text-orange-600">{city.coverage_percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(city.coverage_percent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="block font-medium text-gray-700">{city.activity_count}</span>
                            <span>activities</span>
                          </div>
                          <div>
                            <span className="block font-medium text-gray-700">#{index + 1}</span>
                            <span>rank</span>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/maps?city=${city.city_id}`)}
                          className="w-full mt-3 px-3 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        >
                          View on Map
                        </button>
                      </div>
                    </div>

                    {/* Map Preview */}
                    <div 
                      onClick={() => router.push(`/maps?city=${city.city_id}`)}
                      className="cursor-pointer"
                    >
                      <MapPreview 
                        userId={user?.id} 
                        cityId={city.city_id}
                        className="h-48"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Total cities with coverage: <span className="font-semibold">{coverageSummary.total_cities}</span>
              </p>
            </div>
          </div>
        )}

        {/* Available Cities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Cities</h2>
          
          {cities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city) => (
                <div key={city.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900">{city.name}</h3>
                  <p className="text-gray-600">{city.country_code}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No cities available. Please check your backend configuration.</p>
          )}
        </div>
      </main>
    </div>
  );
}