// Activity type to color mapping
export const ACTIVITY_COLORS = {
  'Ride': '#FF6B35',      // Orange for cycling
  'MountainBikeRide': '#FF6B35', // Orange for mountain biking (same as cycling)
  'Run': '#4CAF50',       // Green for running  
  'Walk': '#2196F3',      // Blue for walking
  'Hike': '#795548',      // Brown for hiking
  'VirtualRide': '#FF9800', // Amber for virtual cycling
  'VirtualRun': '#8BC34A', // Light green for virtual running
  'default': '#9C27B0'    // Purple for other activities
};

// Function to get activity color
export const getActivityColor = (activityType?: string, sportType?: string): string => {
  if (!activityType) return ACTIVITY_COLORS.default;
  
  // Check specific activity type first
  if (activityType in ACTIVITY_COLORS) {
    return ACTIVITY_COLORS[activityType as keyof typeof ACTIVITY_COLORS];
  }
  
  // Check sport type as fallback
  if (sportType && sportType in ACTIVITY_COLORS) {
    return ACTIVITY_COLORS[sportType as keyof typeof ACTIVITY_COLORS];
  }
  
  return ACTIVITY_COLORS.default;
};