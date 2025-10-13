import apiClient from '../api';

export interface CustomArea {
  id: number;
  user_id: number;
  name: string;
  coordinates: [number, number][];
  coverage_percentage?: number;
  activities_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomAreaRequest {
  name: string;
  coordinates: [number, number][];
}

export const customAreasAPI = {
  // Create a new custom area
  create: (userId: number, area: CreateCustomAreaRequest) =>
    apiClient.post<CustomArea>(`/api/custom-areas/user/${userId}`, area),

  // Get all custom areas for a user
  getUserAreas: (userId: number) =>
    apiClient.get<CustomArea[]>(`/api/custom-areas/user/${userId}`),

  // Get a specific custom area
  getArea: (areaId: number) =>
    apiClient.get<CustomArea>(`/api/custom-areas/${areaId}`),

  // Update a custom area
  update: (areaId: number, area: CreateCustomAreaRequest) =>
    apiClient.put<CustomArea>(`/api/custom-areas/${areaId}`, area),

  // Delete a custom area
  delete: (areaId: number) =>
    apiClient.delete(`/api/custom-areas/${areaId}`),

  // Calculate coverage for a custom area
  calculateCoverage: (areaId: number) =>
    apiClient.post<CustomArea>(`/api/custom-areas/${areaId}/calculate-coverage`),
};