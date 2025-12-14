import apiClient from './client';

export const pricingAPI = {
  /**
   * Estimate fare
   */
  estimate: async (data) => {
    try {
      console.log('=== PRICING API REQUEST ===');
      console.log('Request data:', data);
      console.log('Full URL will be: http://localhost:8080/api/pricing/estimate');
      
      // Gọi qua API Gateway: http://localhost:8080/api/pricing/estimate
      // API Gateway sẽ route đến PricingService thông qua service discovery
      const response = await apiClient.post('/api/pricing/estimate', data, {
        timeout: 10000, // 10 seconds timeout
      });
      
      console.log('=== PRICING API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', response.data);
      
      // PricingService trả về trực tiếp PricingResponse
      // Format: { estimatedFare: number, appliedRuleId: UUID }
      return response.data;
    } catch (error) {
      console.error('=== PRICING API ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
        console.error('Request URL:', error.config?.url);
        console.error('Request method:', error.config?.method);
        console.error('Request headers:', error.config?.headers);
        console.error('Request data:', error.config?.data);
      } else if (error.request) {
        console.error('No response received');
        console.error('Request:', error.request);
      }
      
      throw error;
    }
  },
};




