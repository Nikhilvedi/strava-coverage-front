// UI Constants for Strava Coverage App

export const UI_STRINGS = {
  // App Title and Branding
  APP_NAME: 'Strava Coverage',
  
  // Navigation
  NAV: {
    DASHBOARD: 'Dashboard',
    MAPS: 'Maps', 
    SETTINGS: 'Settings',
    LOGOUT: 'Logout',
    LOGIN_WITH_STRAVA: 'Login with Strava'
  },

  // Dashboard Headings
  HEADINGS: {
    WELCOME: 'Welcome',
    DASHBOARD: 'Dashboard',
    COVERAGE_ANALYSIS: 'Coverage Analysis',
    CUSTOM_MAP_AREAS: 'Custom Map Areas', 
    YOUR_CUSTOM_AREAS: 'Your Custom Areas',
    QUICK_ACTIONS: 'Quick Actions',
    IMPORT_STATUS: 'Import Status',
    COVERAGE_SUMMARY: 'Coverage Summary',
    TOP_CITIES: 'Top Covered Cities'
  },

  // Buttons
  BUTTONS: {
    DRAW_NEW_AREA: 'Draw New Area',
    HIDE_MAP: 'Hide Map',
    SHOW_MAP: 'Show Map',
    CALCULATE_COVERAGE: 'Calculate Coverage',
    VIEW_COVERAGE: 'View Coverage',
    DELETE: 'Delete',
    CONFIRM: 'Confirm',
    CANCEL: 'Cancel',
    SAVE: 'Save',
    EDIT: 'Edit',
    START_IMPORT: 'Start Import',
    AUTO_DETECT_CITIES: 'Auto Detect Cities',
    VIEW_MAPS: 'View Maps',
    PROCESS_ACTIVITIES: 'Process Activities'
  },

  // Area Selection
  AREA_SELECTION: {
    CHOOSE_COVERAGE_AREA: 'Choose Coverage Area',
    SELECT_EXISTING_CITY: 'Select Existing City',
    DRAW_CUSTOM_AREA: 'Draw Custom Area',
    CITY_DESCRIPTION: 'Choose from predefined cities',
    CUSTOM_DESCRIPTION: 'Create your own boundaries',
    CUSTOM_MODE_ACTIVATED: 'Custom Area Mode Activated',
    CUSTOM_MODE_INSTRUCTIONS: 'You can now draw your custom area on the map below. Use the drawing tools to create polygons or rectangles that define your area of interest.',
    SEARCH_CITIES: 'Search cities...',
    SEARCH_ALL_CITIES: 'Search all cities worldwide...',
    NO_CITIES_FOUND: 'No cities found matching your search.',
    NO_CITIES_AVAILABLE: 'No cities available.'
  },

  // Custom Areas
  CUSTOM_AREAS: {
    DRAW_INSTRUCTIONS: 'Draw Your Custom Area',
    DRAW_DESCRIPTION: 'Use the drawing controls on the map to create a custom area. Click the polygon or rectangle tool, then click on the map to draw your area.',
    NO_AREAS_YET: 'No custom areas yet',
    CREATE_FIRST_AREA: 'Click "Draw New Area" to create your first custom coverage area',
    ENTER_AREA_NAME: 'Enter area name',
    AREA_NAME_PLACEHOLDER: 'My Coverage Area',
    AREA_NAME_REQUIRED: 'Area name is required',
    COVERAGE_LABEL: 'Coverage:',
    ACTIVITIES_LABEL: 'activities',
    CREATED_LABEL: 'Created:',
    DELETE_CONFIRMATION: 'Are you sure you want to delete this area?',
    COVERAGE_CALCULATION_STARTED: 'Coverage calculation started in background. Results will appear when complete.',
    FAILED_TO_CREATE: 'Failed to create custom area',
    FAILED_TO_CALCULATE: 'Failed to start coverage calculation',
    FAILED_TO_DELETE: 'Failed to delete custom area'
  },

  // Import and Processing
  IMPORT: {
    IMPORT_YOUR_ACTIVITIES: 'Import Your Strava Activities',
    START_AUTOMATED_WORKFLOW: 'Start Automated Workflow',
    ACTIVITIES_IMPORTED: 'Activities Imported',
    ACTIVITIES_PROCESSED: 'Activities Processed',
    CITIES_DETECTED: 'Cities Detected',
    COVERAGE_CALCULATED: 'Coverage Calculated',
    IMPORT_COMPLETED: 'Import completed!',
    PROCESSING_STATUS: 'Processing Status',
    ESTIMATED_TIME: 'Estimated time remaining'
  },

  // Coverage Summary
  COVERAGE: {
    TOTAL_CITIES: 'Total Cities',
    AVERAGE_COVERAGE: 'Average Coverage',
    TOTAL_ACTIVITIES: 'Total Activities', 
    BEST_COVERED_CITY: 'Best Covered City',
    COVERAGE_PERCENTAGE: 'Coverage',
    DISTANCE_COVERED: 'Distance Covered',
    ACTIVITY_COUNT: 'Activity Count',
    LAST_ACTIVITY: 'Last Activity'
  },

  // Status Messages
  STATUS: {
    LOADING: 'Loading...',
    CALCULATING: 'Calculating...',
    PROCESSING: 'Processing...',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    IN_PROGRESS: 'In Progress',
    IDLE: 'Ready',
    SELECTED_CITY: 'Selected City:',
    COUNTRY: 'Country:'
  },

  // Error Messages
  ERRORS: {
    GENERIC: 'An unexpected error occurred',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Please log in to continue',
    NOT_FOUND: 'Resource not found',
    VALIDATION: 'Please check your input',
    TIMEOUT: 'Request timed out. Please try again.'
  }
};

export const TOOLTIPS = {
  // Navigation Tooltips
  NAV: {
    DASHBOARD: 'View your coverage dashboard and statistics',
    MAPS: 'Explore interactive maps of your coverage',
    SETTINGS: 'Manage your account and preferences',
    LOGOUT: 'Sign out of your account',
    LOGIN: 'Connect your Strava account to get started'
  },

  // Button Tooltips
  BUTTONS: {
    DRAW_NEW_AREA: 'Create a custom area to analyze your coverage',
    CALCULATE_COVERAGE: 'Start calculating coverage percentage for this area',
    DELETE_AREA: 'Permanently remove this custom area',
    VIEW_MAPS: 'Open detailed map view with your activities',
    START_IMPORT: 'Begin importing activities from your Strava account',
    AUTO_DETECT: 'Automatically find cities based on your activities',
    PROCESS_ACTIVITIES: 'Calculate coverage for all your imported activities',
    SAVE: 'Save the current changes',
    CANCEL: 'Cancel and discard changes',
    CONFIRM: 'Confirm this action',
    EDIT: 'Edit this item'
  },

  // Area Selection Tooltips
  AREA_SELECTION: {
    CITY_MODE: 'Choose from a database of cities worldwide for coverage analysis',
    CUSTOM_MODE: 'Draw your own boundaries to analyze any geographic area',
    SEARCH_CITIES: 'Search by city name or country code to find specific locations'
  },

  // Map Tooltips
  MAP: {
    POLYGON_TOOL: 'Click to draw a polygon area',
    RECTANGLE_TOOL: 'Click to draw a rectangular area', 
    EDIT_TOOL: 'Modify existing areas',
    DELETE_TOOL: 'Remove drawn areas',
    ZOOM_IN: 'Zoom in to see more detail',
    ZOOM_OUT: 'Zoom out to see larger area'
  },

  // Coverage Tooltips  
  COVERAGE: {
    PERCENTAGE: 'Percentage of the area covered by your activities',
    ACTIVITY_COUNT: 'Number of activities that intersect with this area',
    DISTANCE: 'Total distance of activities within this area',
    LAST_ACTIVITY: 'Date of your most recent activity in this area',
    COVERAGE_BAR: 'Visual representation of coverage percentage'
  },

  // Status Tooltips
  STATUS: {
    IMPORT_PROGRESS: 'Shows progress of importing activities from Strava',
    PROCESSING_PROGRESS: 'Shows progress of analyzing your activities',
    COVERAGE_CALCULATION: 'Shows progress of coverage calculations'
  }
};

export const PLACEHOLDERS = {
  SEARCH_CITIES: 'Enter city name or country...',
  AREA_NAME: 'Enter a name for your area',
  EMAIL: 'your.email@example.com',
  PASSWORD: '••••••••'
};

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  AREA_NAME_REQUIRED: 'Please enter a name for your area',
  AREA_NAME_TOO_LONG: 'Area name must be less than 100 characters'
};

export const API_MESSAGES = {
  SUCCESS: {
    AREA_CREATED: 'Custom area created successfully',
    AREA_DELETED: 'Custom area deleted successfully', 
    COVERAGE_CALCULATED: 'Coverage calculated successfully',
    IMPORT_STARTED: 'Import started successfully'
  },
  ERROR: {
    AREA_CREATE_FAILED: 'Failed to create custom area',
    AREA_DELETE_FAILED: 'Failed to delete custom area',
    COVERAGE_CALC_FAILED: 'Failed to calculate coverage',
    IMPORT_FAILED: 'Failed to start import',
    NETWORK_ERROR: 'Network error. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.'
  }
};

export const ICONS = {
  // Emoji icons for UI elements
  CITY: '🏙️',
  DRAW: '✏️', 
  MAP: '🗺️',
  ACTIVITY: '🏃‍♂️',
  COVERAGE: '📊',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  SEARCH: '🔍',
  DELETE: '🗑️',
  EDIT: '✏️'
};

export const COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981', 
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  NEUTRAL: '#6B7280'
};

export const ANIMATIONS = {
  DURATION: {
    FAST: '150ms',
    NORMAL: '300ms', 
    SLOW: '500ms'
  },
  EASING: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    IN: 'cubic-bezier(0.4, 0, 1, 1)',
    OUT: 'cubic-bezier(0, 0, 0.2, 1)'
  }
};