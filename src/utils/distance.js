/**
 * Tính khoảng cách giữa 2 điểm bằng công thức Haversine (đường chim bay)
 * @param {Object} point1 - { lat: number, lng: number }
 * @param {Object} point2 - { lat: number, lng: number }
 * @returns {number} Khoảng cách tính bằng km (làm tròn 1 chữ số thập phân)
 */
export const calculateHaversineDistance = (point1, point2) => {
  if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
    return 0;
  }

  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Làm tròn 2 chữ số thập phân
};

/**
 * Tính khoảng cách thực tế trên đường bằng API (nếu có)
 * Fallback về Haversine nếu API không khả dụng
 * @param {Object} point1 - { lat: number, lng: number }
 * @param {Object} point2 - { lat: number, lng: number }
 * @param {Function} routeAPI - Function để gọi API route (optional)
 * @returns {Promise<{distance: number, duration?: number, isEstimated: boolean}>}
 */
export const calculateRouteDistance = async (point1, point2, routeAPI = null) => {
  // Fallback về Haversine nếu không có API
  if (!routeAPI) {
    const distance = calculateHaversineDistance(point1, point2);
    return {
      distance,
      isEstimated: true,
    };
  }

  try {
    // Gọi API để lấy khoảng cách thực tế
    const response = await routeAPI(point1.lat, point1.lng, point2.lat, point2.lng);
    
    if (response && response.distance) {
      // API trả về khoảng cách bằng mét, chuyển sang km
      const distanceKm = response.distance / 1000;
      return {
        distance: Math.round(distanceKm * 100) / 100,
        duration: response.duration ? Math.round(response.duration / 60) : undefined, // Chuyển giây sang phút
        isEstimated: false,
      };
    }
  } catch (error) {
    console.warn('Không thể lấy khoảng cách từ API, sử dụng ước tính:', error);
  }

  // Fallback về Haversine nếu API lỗi
  const distance = calculateHaversineDistance(point1, point2);
  return {
    distance,
    isEstimated: true,
  };
};

/**
 * Format khoảng cách để hiển thị
 * @param {number} distance - Khoảng cách tính bằng km
 * @returns {string} Chuỗi đã format (ví dụ: "5.20 km" hoặc "500 m")
 */
export const formatDistance = (distance) => {
  if (!distance || distance === 0) {
    return '0.00 km';
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  
  // Hiển thị 2 chữ số thập phân
  return `${distance.toFixed(2)} km`;
};
