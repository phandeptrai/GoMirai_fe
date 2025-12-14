import { useState, useEffect } from 'react';

// Biến global để đảm bảo chỉ hiển thị popup một lần
let permissionChecked = false;
let globalLocation = null;
let globalLocationListeners = [];

/**
 * Custom hook để lấy vị trí hiện tại của người dùng
 * @param {boolean} showModal - Có hiển thị popup yêu cầu quyền không (mặc định: false)
 * @returns {Object} { location: { lat, lng, address }, loading: boolean, error: string | null, showPermissionModal: boolean, handleAllow: function, handleDeny: function }
 */
const useCurrentLocation = (showModal = false) => {
  const [location, setLocation] = useState(globalLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // Đăng ký listener để nhận cập nhật location
  useEffect(() => {
    const listener = (newLocation) => {
      setLocation(newLocation);
    };
    globalLocationListeners.push(listener);
    
    return () => {
      globalLocationListeners = globalLocationListeners.filter(l => l !== listener);
    };
  }, []);

  // Hàm để cập nhật location cho tất cả listeners
  const updateGlobalLocation = (newLocation) => {
    globalLocation = newLocation;
    globalLocationListeners.forEach(listener => listener(newLocation));
  };

  // Reverse geocoding để lấy địa chỉ từ tọa độ
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&limit=1&country=VN`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name || 'Vị trí hiện tại';
      }
      return 'Vị trí hiện tại';
    } catch (err) {
      console.error('Error getting address:', err);
      return 'Vị trí hiện tại';
    }
  };

  const requestLocation = async () => {
    if (!('geolocation' in navigator)) {
      setError('Trình duyệt của bạn không hỗ trợ định vị');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true, // Yêu cầu độ chính xác cao
      timeout: 10000, // Timeout sau 10 giây
      maximumAge: 0 // Không sử dụng cache, luôn lấy vị trí mới
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoords(latitude, longitude);
        
        const newLocation = {
          lat: latitude,
          lng: longitude,
          address: address
        };
        
        updateGlobalLocation(newLocation);
        setLocation(newLocation);
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Không thể lấy vị trí';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không khả dụng';
            break;
          case err.TIMEOUT:
            errorMessage = 'Yêu cầu lấy vị trí đã hết thời gian chờ';
            break;
          default:
            errorMessage = 'Đã xảy ra lỗi khi lấy vị trí';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      options
    );
  };

  // Kiểm tra quyền truy cập khi component mount (chỉ một lần)
  useEffect(() => {
    if (!showModal || permissionChecked) {
      // Nếu đã có location global, sử dụng nó
      if (globalLocation) {
        setLocation(globalLocation);
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Trình duyệt của bạn không hỗ trợ định vị');
      permissionChecked = true;
      return;
    }

    // Kiểm tra xem đã có quyền chưa
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions?.query({ name: 'geolocation' });
        permissionChecked = true;
        if (result.state === 'granted') {
          // Đã có quyền, tự động lấy vị trí
          requestLocation();
        } else if (result.state === 'prompt') {
          // Chưa được hỏi, hiển thị popup của app
          setShowPermissionModal(true);
        } else {
          // Đã từ chối
          setError('Bạn đã từ chối quyền truy cập vị trí');
        }
      } catch {
        // Fallback: nếu permissions API không khả dụng, hiển thị popup
        permissionChecked = true;
        setShowPermissionModal(true);
      }
    };

    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleAllow = () => {
    setShowPermissionModal(false);
    requestLocation();
  };

  const handleDeny = () => {
    setShowPermissionModal(false);
    setError('Bạn đã từ chối quyền truy cập vị trí. Bạn có thể cho phép sau trong cài đặt trình duyệt.');
    setLoading(false);
  };

  return {
    location,
    loading,
    error,
    showPermissionModal,
    handleAllow,
    handleDeny,
    requestLocation // Cho phép gọi lại khi cần
  };
};

export default useCurrentLocation;

