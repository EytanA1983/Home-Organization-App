/**
 * ML API utilities
 * Functions for calling ML recommendation endpoints
 */
import api from '../api';

export interface MLRecommendRequest {
  data?: Record<string, any>;
}

export interface MLRecommendResponse {
  suggestion: string;
}

/**
 * Get ML recommendation for next home organizing task
 */
export const getMLRecommendation = async (
  data?: Record<string, any>
): Promise<MLRecommendResponse> => {
  const response = await api.post<MLRecommendResponse>('/api/ml/recommend', {
    data: data || {},
  });
  return response.data;
};
