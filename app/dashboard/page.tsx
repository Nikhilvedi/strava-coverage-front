'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { importAPI, detectionAPI, coverageAPI, citiesAPI } from '@/app/lib/api';
import { UI_STRINGS, TOOLTIPS, ICONS } from '@/app/lib/constants';
import Navbar from '@/app/components/Navbar';
import dynamic from 'next/dynamic';

const MapPreview = dynamic(() => import('@/app/components/MapPreview'), {
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
  latitude?: number;
  longitude?: number;
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

export default function Dashboard() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [cities, setCities] = useState<CityWithCoverage[]>([]);
  const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'importing' | 'detecting' | 'calculating' | 'completed'>('idle');
  const [processingProgress, setProcessingProgress] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Refresh user data on component mount to get updated name
  useEffect(() => {
    if (user?.id && !isLoading) {
      refreshUser().catch(console.error);
    }
  }, [user?.id, isLoading, refreshUser]);

  const loadCities = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await citiesAPI.getUserCitiesWithCoverage(user.id);
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Failed to load user cities:', error);
    }
  }, [user?.id]);

  const loadImportStatus = useCallback(async () => {
    if (!user?.id) return;
    
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
      setImportStatus(null);
    }
  }, [user?.id, isProcessing]);

  const loadCoverageSummary = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await coverageAPI.getSummary(user.id);
      setCoverageSummary(response.data);
    } catch (error) {
      console.error('Failed to load coverage summary:', error);
      setCoverageSummary(null);
    }
  }, [user?.id]);

  // Load data when user changes
  useEffect(() => {
    if (user?.id) {
      loadCities();
      loadImportStatus();
      loadCoverageSummary();
    }
  }, [user?.id, loadCities, loadImportStatus, loadCoverageSummary]);

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
    }, 60000); // Poll every 60 seconds
  };

  const startFullProcess = async () => {
    if (!user) return;

    setIsProcessing(true);
    
    try {
      // Step 1: Import Activities
      setCurrentStep('importing');
      setProcessingProgress('Starting import of your Strava activities...');

      const importResponse = await importAPI.startImport(user.id);
      console.log('Import started:', importResponse.data);

      // Poll for import completion
      let importComplete = false;
      while (!importComplete) {
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
        
        const status = await importAPI.getStatus(user.id);
        if (!status.data.in_progress) {
          importComplete = true;
          if (status.data.imported_count > 0) {
            setProcessingProgress(`Import completed! Imported ${status.data.imported_count} activities.`);
          } else {
            setProcessingProgress(`Importing activities... Page ${status.data.current_page}, ${status.data.imported_count} activities imported so far.`);
          }
        }
      }

      // Wait a moment before detection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: City Detection
      setCurrentStep('detecting');
      setProcessingProgress('Analyzing your activities to detect cities...');

      const detectResponse = await detectionAPI.autoDetect(user.id);
      const citiesFound = detectResponse.data.cities?.length || 0;
      setProcessingProgress(`City detection completed! Found ${citiesFound} cities with activities.`);

      // Wait a moment before coverage calculation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Calculate Coverage
      setCurrentStep('calculating');
      setProcessingProgress('Calculating coverage for all detected cities...');

      await coverageAPI.calculateAll(user.id);

      setCurrentStep('completed');
      setProcessingProgress('All processing completed successfully!');
      
      // Reload data
      await loadCoverageSummary();
      
    } catch (error: any) {
      console.error('Failed to complete process:', error);
      setCurrentStep('idle');
      setIsProcessing(false);
      setProcessingProgress('');
      alert(`Process failed: ${error.message || 'Unknown error'}`);
    } finally {
      // Keep processing true to show completed state
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{user.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-gray-600">
            Track your Strava activity coverage across cities and custom areas.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/maps')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="text-orange-500 mb-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Interactive Maps</h3>
            <p className="text-gray-600 text-sm">Explore your coverage on detailed maps</p>
          </button>

          <button
            onClick={() => router.push('/areas')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="text-green-500 mb-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Custom Areas</h3>
            <p className="text-gray-600 text-sm">Create and analyze custom coverage areas</p>
          </button>

          <button
            onClick={startFullProcess}
            disabled={isProcessing}
            className="bg-orange-500 text-white p-6 rounded-lg shadow-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
          >
            <div className="text-orange-200 mb-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="font-semibold mb-1">
              {isProcessing ? 'Processing...' : 'Analyze Coverage'}
            </h3>
            <p className="text-orange-200 text-sm">
              {isProcessing ? processingProgress : 'Import activities and calculate coverage'}
            </p>
          </button>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-4"></div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  {currentStep === 'importing' && 'Importing Activities'}
                  {currentStep === 'detecting' && 'Detecting Cities'}
                  {currentStep === 'calculating' && 'Calculating Coverage'}
                  {currentStep === 'completed' && 'Processing Complete!'}
                </h3>
                <p className="text-blue-700">{processingProgress}</p>
              </div>
            </div>
          </div>
        )}

        {/* No Coverage State */}
        {(!coverageSummary || !coverageSummary.city_coverage || coverageSummary.city_coverage.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started with Coverage Analysis</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Click the button below to automatically import your activities, detect cities, and calculate coverage.
            </p>
            <button
              onClick={startFullProcess}
              disabled={isProcessing}
              className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </span>
              ) : (
                'Start Coverage Analysis'
              )}
            </button>
          </div>
        )}

        {/* Coverage Summary - Top 3 Cities */}
        {coverageSummary && coverageSummary.city_coverage && coverageSummary.city_coverage.length > 0 && (
          <>
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
                    Your top performing cities are shown below.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Top 3 Cities</h2>
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
                {coverageSummary.city_coverage.slice(0, 3).map((city, index) => (
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
                  Showing your top 3 cities • Total cities with coverage: <span className="font-semibold">{coverageSummary.total_cities}</span>
                </p>
                {coverageSummary.total_cities > 3 && (
                  <button
                    onClick={() => router.push('/maps')}
                    className="mt-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    View all {coverageSummary.total_cities} cities →
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Stats Overview */}
        {coverageSummary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{coverageSummary.total_cities}</div>
                <div className="text-gray-600">Cities Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{coverageSummary.global_stats.average_coverage_percent.toFixed(1)}%</div>
                <div className="text-gray-600">Average Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{Math.round(coverageSummary.global_stats.total_distance_covered_km)}</div>
                <div className="text-gray-600">Total Distance (km)</div>
              </div>
            </div>
          </div>
        )}

        {/* View Strava Profile Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.open('https://www.strava.com/athletes/' + user.id, '_blank')}
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7.008 13.828h4.172"/>
            </svg>
            View on Strava
          </button>
        </div>
      </main>
    </div>
  );
}