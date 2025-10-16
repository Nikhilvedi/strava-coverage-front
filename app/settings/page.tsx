'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/app/components/Navbar';
import { commentsAPI } from '@/app/lib/api';

interface CommentSettings {
  user_id: number;
  enabled: boolean;
  running_enabled: boolean;
  cycling_enabled: boolean;
  walking_enabled: boolean;
  hiking_enabled: boolean;
  ebiking_enabled: boolean;
  skiing_enabled: boolean;
  comment_template: string;
  min_coverage_increase: number;
  custom_areas_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CoverageIncrease {
  user_id: number;
  activity_id: number;
  city_id: number;
  city_name: string;
  previous_coverage: number;
  new_coverage: number;
  increase: number;
  activity_type: string;
  activity_date: string;
}

export default function CommentSettingsPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<CommentSettings | null>(null);
  const [increases, setIncreases] = useState<CoverageIncrease[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSection, setActiveSection] = useState('features');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingSettings(true);
      const response = await commentsAPI.getSettings(user.id);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Failed to load comment settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [user?.id]);

  const loadCoverageIncreases = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await commentsAPI.getCoverageIncreases(user.id);
      setIncreases(response.data.increases || []);
    } catch (error) {
      console.error('Failed to load coverage increases:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
      loadCoverageIncreases();
    }
  }, [user?.id, loadSettings, loadCoverageIncreases]);

  const handleSaveSettings = async () => {
    if (!user?.id || !settings) return;

    try {
      setIsSaving(true);
      await commentsAPI.updateSettings(user.id, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcessComments = async () => {
    if (!user?.id) return;

    try {
      setIsProcessing(true);
      await commentsAPI.processComments(user.id);
      alert('Comment processing started! Comments will be posted to your activities shortly.');
      loadCoverageIncreases();
    } catch (error) {
      console.error('Failed to process comments:', error);
      alert('Failed to start comment processing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSettings = (updates: Partial<CommentSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'Run':
      case 'VirtualRun':
        return '🏃';
      case 'Ride':
      case 'VirtualRide':
        return '🚴';
      case 'Walk':
        return '🚶';
      case 'Hike':
        return '🥾';
      case 'EBikeRide':
        return '🚲';
      case 'AlpineSki':
      case 'BackcountrySki':
      case 'NordicSki':
        return '⛷️';
      default:
        return '🏃';
    }
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || !settings) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <Navbar />

      <div className="flex">
        {/* Sidebar Navigation - Strava Style */}
        <div className="w-64 bg-white shadow-sm border-r" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="p-6">
            <nav className="space-y-4">
              <div className="flex items-center space-x-3 p-3 text-gray-900 font-medium text-lg">
                <span>⚙️</span>
                <span>Settings</span>
              </div>
              
              <div className="space-y-1">
                <button 
                  onClick={() => setActiveSection('features')}
                  className={`w-full text-left px-4 py-3 text-sm rounded-md transition-colors ${
                    activeSection === 'features' 
                      ? 'bg-orange-100 text-orange-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setActiveSection('comments')}
                  className={`w-full text-left px-4 py-3 text-sm rounded-md transition-colors ${
                    activeSection === 'comments' 
                      ? 'bg-orange-100 text-orange-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Auto-Comments
                </button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center space-x-3 p-3 text-gray-600 text-sm">
                  <span>❓</span>
                  <span>Help & FAQ</span>
                </div>
                <div className="flex items-center space-x-3 p-3 text-gray-600 text-sm">
                  <span>ℹ️</span>
                  <span>About</span>
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="max-w-6xl mx-auto p-8">
            
            {activeSection === 'features' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Features</h1>
                  <p className="text-gray-600">
                    Control which features are available in your Strava Coverage application.
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-8">
                  <div className="space-y-8">
                    
                    {/* Custom Areas Feature */}
                    <div className="flex items-start justify-between p-6 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Custom Areas</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Beta
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                          Create and analyze custom geographic areas for coverage tracking. 
                          Draw custom boundaries on the map and track your activity coverage within those areas.
                        </p>
                        <div className="text-xs text-gray-500">
                          When disabled, the Custom Areas page will be hidden from navigation
                        </div>
                      </div>
                      <div className="ml-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.custom_areas_enabled}
                            onChange={(e) => updateSettings({ custom_areas_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Auto Comments Feature */}
                    <div className="flex items-start justify-between p-6 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Auto-Comments</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                          Automatically post comments to your Strava activities when they increase your city coverage percentage.
                          Customize comment templates and choose which activity types to comment on.
                        </p>
                        <div className="text-xs text-gray-500">
                          Click "Auto-Comments" in the sidebar to configure detailed settings
                        </div>
                      </div>
                      <div className="ml-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => updateSettings({ enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="bg-orange-500 text-white py-2 px-6 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'comments' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto-Comments</h1>
                  <p className="text-gray-600">
                    Automatically comment on your Strava activities when they increase your city coverage.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Settings Panel */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Comment Configuration</h2>
                    
                    {/* Master Enable/Disable */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enabled}
                          onChange={(e) => updateSettings({ enabled: e.target.checked })}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 h-4 w-4"
                        />
                        <span className="ml-3 text-base font-medium text-gray-900">
                          Enable Auto-Comments
                        </span>
                      </label>
                      <p className="mt-2 text-sm text-gray-600">
                        When enabled, comments will be posted to activities that increase your coverage
                      </p>
                    </div>

                    {/* Activity Types */}
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Activity Types</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'running_enabled', label: '🏃 Running & Virtual Running' },
                          { key: 'cycling_enabled', label: '🚴 Cycling & Virtual Cycling' },
                          { key: 'walking_enabled', label: '🚶 Walking' },
                          { key: 'hiking_enabled', label: '🥾 Hiking' },
                          { key: 'ebiking_enabled', label: '🚲 E-Biking' },
                          { key: 'skiing_enabled', label: '⛷️ Skiing & Ski Touring' }
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings[key as keyof CommentSettings] as boolean}
                              onChange={(e) => updateSettings({ [key]: e.target.checked })}
                              disabled={!settings.enabled}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50 h-4 w-4"
                            />
                            <span className="ml-3 text-sm text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Comment Template */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment Template
                      </label>
                      <textarea
                        value={settings.comment_template}
                        onChange={(e) => updateSettings({ comment_template: e.target.value })}
                        disabled={!settings.enabled}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
                        rows={3}
                        placeholder="Your coverage of {city} is {coverage}%!"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use {'{city}'} for city name and {'{coverage}'} for coverage percentage
                      </p>
                    </div>

                    {/* Minimum Coverage */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Coverage Increase (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.min_coverage_increase}
                        onChange={(e) => updateSettings({ min_coverage_increase: parseFloat(e.target.value) || 0 })}
                        disabled={!settings.enabled}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Only comment on activities that increase coverage by at least this amount
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                      </button>
                      
                      <button
                        onClick={handleProcessComments}
                        disabled={!settings.enabled || isProcessing || increases.length === 0}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {isProcessing ? 'Processing...' : `Process ${increases.length}`}
                      </button>
                    </div>
                  </div>

                  {/* Preview Panel */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Comments</h2>
                    
                    {increases.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="font-medium">No pending coverage increases</p>
                        <p className="text-sm mt-2">Comments will appear here when you have activities that increase your city coverage.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {increases.map((increase, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getActivityTypeIcon(increase.activity_type)}</span>
                                <span className="font-medium text-gray-900 text-sm">{increase.city_name}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(increase.activity_date).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <div className="text-xs text-gray-600">
                                Coverage: {increase.previous_coverage.toFixed(1)}% → {increase.new_coverage.toFixed(1)}% 
                                <span className="text-green-600 font-medium"> (+{increase.increase.toFixed(1)}%)</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded p-2 text-xs">
                              <span className="font-medium">Preview:</span> {settings.comment_template
                                .replace('{city}', increase.city_name)
                                .replace('{coverage}', increase.new_coverage.toFixed(1))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-base font-semibold text-blue-900 mb-3">How Auto-Comments Work</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <ul className="space-y-1">
                      <li>• Comments posted only when coverage increases</li>
                      <li>• Customizable activity type filters</li>
                      <li>• Minimum threshold prevents spam</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• 2-second delays respect Strava rate limits</li>
                      <li>• Each activity commented only once</li>
                      <li>• Template supports city and coverage variables</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}