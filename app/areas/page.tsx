'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { customAreasAPI, CustomArea } from '@/app/lib/api/customAreas';
import { UI_STRINGS, TOOLTIPS, ICONS } from '@/app/lib/constants';
import Navbar from '@/app/components/Navbar';
import ConfirmationDialog from '@/app/components/ConfirmationDialog';
import dynamic from 'next/dynamic';

const CustomAreaMap = dynamic(() => import('@/app/components/CustomAreaMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded flex items-center justify-center">Loading map...</div>
});

export default function CustomAreasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [customAreas, setCustomAreas] = useState<CustomArea[]>([]);
  const [areaToDelete, setAreaToDelete] = useState<CustomArea | null>(null);
  const [selectedArea, setSelectedArea] = useState<CustomArea | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const loadCustomAreas = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('Loading custom areas for user:', user.id);
      const response = await customAreasAPI.getUserAreas(user.id);
      console.log('Custom areas loaded:', response.data);
      setCustomAreas(response.data);
    } catch (error) {
      console.error('Failed to load custom areas:', error);
      setCustomAreas([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadCustomAreas();
    }
  }, [user?.id, loadCustomAreas]);

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
      
      const createdArea = response.data;
      
      // Reload custom areas to get the updated list
      await loadCustomAreas();
      console.log('Custom areas reloaded');
      
      // Automatically select the newly created area
      setSelectedArea(createdArea);
      
      // Automatically start coverage calculation for the new area
      console.log('Starting coverage calculation for new area:', createdArea.id);
      await calculateCustomAreaCoverage(createdArea.id);
      
    } catch (error: any) {
      console.error('Failed to create custom area:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Show user-friendly error
      alert(`Failed to create custom area: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const calculateCustomAreaCoverage = async (areaId: number) => {
    try {
      console.log('Calculating coverage for area ID:', areaId);
      const response = await customAreasAPI.calculateCoverage(areaId);
      console.log('Coverage calculation started:', response.data);
      
      // Show user feedback that calculation started
      alert('Coverage calculation started in background. Results will appear when complete.');
      
      // Start polling for updates every 5 seconds
      const pollInterval = setInterval(async () => {
        try {
          await loadCustomAreas();
          
          // Check if this area now has coverage calculated
          const updatedAreas = await customAreasAPI.getUserAreas(user!.id);
          const updatedArea = updatedAreas.data.find(area => area.id === areaId);
          
          if (updatedArea?.coverage_percentage !== null && updatedArea?.coverage_percentage !== undefined) {
            console.log(`Coverage calculation completed for area ${areaId}: ${updatedArea.coverage_percentage}%`);
            clearInterval(pollInterval);
          }
        } catch (pollError) {
          console.error('Error polling for coverage updates:', pollError);
        }
      }, 60000); // Poll every 60 seconds
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 120000);
      
    } catch (error: any) {
      console.error('Failed to start coverage calculation:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Show user-friendly error
      alert(`Failed to start coverage calculation: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const deleteArea = async (areaId: number) => {
    const area = customAreas?.find(a => a.id === areaId);
    if (!area) return;
    
    setAreaToDelete(area);
  };

  const confirmDeleteArea = async () => {
    if (!areaToDelete) return;
    
    try {
      await customAreasAPI.delete(areaToDelete.id);
      await loadCustomAreas();
    } catch (error) {
      console.error('Failed to delete custom area:', error);
      alert(UI_STRINGS.CUSTOM_AREAS.FAILED_TO_DELETE);
    } finally {
      setAreaToDelete(null);
    }
  };

  const cancelDeleteArea = () => {
    setAreaToDelete(null);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Areas</h1>
          <p className="text-gray-600">
            Create and analyze your own custom areas for coverage tracking.
          </p>
        </div>

        {/* Selected Area Display */}
        {selectedArea && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedArea.name}</h2>
                {selectedArea.coverage_percentage !== null && selectedArea.coverage_percentage !== undefined && (
                  <p className="text-lg text-orange-600 font-semibold">
                    Coverage: {selectedArea.coverage_percentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedArea(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {selectedArea.coverage_percentage !== null && (
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(selectedArea.coverage_percentage || 0, 100)}%` }}
                ></div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => calculateCustomAreaCoverage(selectedArea.id)}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                Calculate Coverage
              </button>
              <button
                onClick={() => router.push(`/maps?area=${selectedArea.id}`)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                View on Map
              </button>
              <button
                onClick={() => deleteArea(selectedArea.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Delete Area
              </button>
            </div>
          </div>
        )}

        {/* Custom Areas Grid */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Custom Areas</h3>
          {!customAreas || customAreas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-lg font-medium mb-2">{UI_STRINGS.CUSTOM_AREAS.NO_AREAS_YET}</p>
              <p>{UI_STRINGS.CUSTOM_AREAS.CREATE_FIRST_AREA}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customAreas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => setSelectedArea(area)}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{area.name}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAreaToDelete(area);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                  {area.coverage_percentage !== null && area.coverage_percentage !== undefined && (
                    <p className="text-sm text-gray-600 mb-2">
                      Coverage: {area.coverage_percentage.toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create New Area Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Custom Area</h3>
          <CustomAreaMap
            onAreaDrawn={async (area) => {
              await handleAreaDrawn(area);
              await loadCustomAreas();
            }}
            drawnAreas={customAreas?.map(area => ({
              id: area.id.toString(),
              name: area.name,
              coordinates: area.coordinates,
              coverage: area.coverage_percentage || undefined
            })) || []}
          />
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={areaToDelete !== null}
        title={UI_STRINGS.BUTTONS.DELETE + ' Area'}
        message={`${UI_STRINGS.CUSTOM_AREAS.DELETE_CONFIRMATION}\n\n"${areaToDelete?.name}"`}
        onConfirm={confirmDeleteArea}
        onCancel={cancelDeleteArea}
        confirmText={UI_STRINGS.BUTTONS.DELETE}
        isDestructive={true}
      />
    </div>
  );
}