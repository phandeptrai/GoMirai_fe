import apiClient from './client';

export const mapAPI = {
  /**
   * Geocode address
   */
  geocode: async (address) => {
    const response = await apiClient.get('/api/map/geocode', { params: { address } });
    return response.data?.data || response.data;
  },

  /**
   * Reverse geocode
   */
  reverseGeocode: async (lat, lng) => {
    const response = await apiClient.get('/api/map/reverse-geocode', {
      params: { latitude: lat, longitude: lng },
    });
    return response.data?.data || response.data;
  },

  /**
   * Get route/directions
   * @param {string} profile - 'driving' (ô tô), 'cycling' (xe máy/xe đạp), 'walking' (đi bộ)
   */
  getRoute: async (fromLat, fromLng, toLat, toLng, profile = 'driving') => {
    const response = await apiClient.post('/api/map/directions', {
      origin: { latitude: fromLat, longitude: fromLng },
      destination: { latitude: toLat, longitude: toLng },
      profile: profile,
    });
    return response.data?.data || response.data;
  },

  /**
   * Search places
   */
  searchPlaces: async (query, lat = null, lng = null) => {
    const params = { query };
    if (lat && lng) {
      params.proximity = `${lng},${lat}`;
    }
    const response = await apiClient.get('/api/map/places/search', { params });
    return response.data?.data || response.data;
  },
};




