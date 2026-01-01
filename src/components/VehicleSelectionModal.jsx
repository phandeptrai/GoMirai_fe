import { useState, useEffect } from 'react';
import { VEHICLES } from './constants';
import { calculateHaversineDistance, formatDistance } from '../utils/distance';
import { mapAPI } from '../api/map.api';
import { pricingAPI } from '../api/pricing.api';
import { bookingAPI } from '../api/booking.api';
import { walletApi } from '../api/wallet.api';
import PaymentMethodSelector from './PaymentMethodSelector';
import './VehicleSelectionModal.css';

const VehicleSelectionModal = ({
  isOpen,
  onClose,
  onBack = null, // Hàm để quay lại popup chọn địa điểm
  pickupLocation,
  destinationLocation,
  pickupCoords,
  destinationCoords,
  initialDistance = null,
  isDistanceEstimated = true,
  onConfirm
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]); // Mặc định chọn Bike
  const [estimatedDistance, setEstimatedDistance] = useState(initialDistance || 0); // km
  const [estimatedDuration, setEstimatedDuration] = useState(null); // phút (chung cho tất cả xe)
  // Lưu thời gian di chuyển riêng cho từng loại xe: { vehicleType: duration }
  const [vehicleDurations, setVehicleDurations] = useState({});
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [isEstimated, setIsEstimated] = useState(isDistanceEstimated);
  // Lưu giá cho từng loại xe: { vehicleType: fare }
  const [pricingFares, setPricingFares] = useState({});
  // Lưu trạng thái loading cho từng loại xe
  const [pricingLoadingStates, setPricingLoadingStates] = useState({});
  const [pricingError, setPricingError] = useState(null);
  // Trạng thái đặt xe
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // Tính khoảng cách giữa 2 điểm
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      // Nếu có initialDistance từ parent, sử dụng nó làm giá trị ban đầu
      if (initialDistance !== null && initialDistance > 0) {
        setEstimatedDistance(initialDistance);
        setIsEstimated(isDistanceEstimated);
      } else {
        // Tính khoảng cách bằng Haversine ngay lập tức (ước tính nhanh)
        setIsCalculatingDistance(true);
        const haversineDistance = calculateHaversineDistance(pickupCoords, destinationCoords);
        setEstimatedDistance(haversineDistance);
        setIsEstimated(true);
        setIsCalculatingDistance(false);
      }

      // Thử lấy khoảng cách thực tế từ API (async, không block UI)
      // Chỉ gọi API nếu chưa có giá trị chính xác từ parent
      if (isDistanceEstimated) {
        // Lấy khoảng cách với profile driving (ô tô) làm chuẩn
        mapAPI.getRoute(pickupCoords.lat, pickupCoords.lng, destinationCoords.lat, destinationCoords.lng, 'driving')
          .then((routeData) => {
            if (routeData && routeData.distance) {
              // API trả về khoảng cách bằng mét, chuyển sang km
              const distanceKm = routeData.distance / 1000;
              setEstimatedDistance(Math.round(distanceKm * 100) / 100);

              // Lưu thời gian cho ô tô (CAR_4) làm mặc định
              if (routeData.duration) {
                const durationMinutes = Math.round(routeData.duration / 60);
                setEstimatedDuration(durationMinutes);
                setVehicleDurations(prev => ({ ...prev, 'CAR_4': durationMinutes }));
              }

              setIsEstimated(false);
            }
          })
          .catch((error) => {
            // Nếu API lỗi, giữ nguyên giá trị đã tính
            console.warn('Không thể lấy khoảng cách từ API, sử dụng ước tính:', error);
          });
      } else {
        // Nếu đã có khoảng cách chính xác từ parent, lấy thời gian cho ô tô làm chuẩn
        mapAPI.getRoute(pickupCoords.lat, pickupCoords.lng, destinationCoords.lat, destinationCoords.lng, 'driving')
          .then((routeData) => {
            if (routeData && routeData.duration) {
              const durationMinutes = Math.round(routeData.duration / 60);
              setEstimatedDuration(durationMinutes);
              setVehicleDurations(prev => ({ ...prev, 'CAR_4': durationMinutes }));
            }
          })
          .catch((error) => {
            // Bỏ qua lỗi nếu chỉ cần lấy thời gian
            console.warn('Không thể lấy thời gian từ API:', error);
          });
      }

      // Lấy thời gian riêng cho các loại xe khác (async, không block)
      // Xe máy
      getDurationForVehicle('BIKE');
      // Xe 7 chỗ (có thể dùng chung với xe 4 chỗ hoặc tính riêng)
      // getDurationForVehicle('CAR_7');
    } else {
      setEstimatedDistance(0);
      setEstimatedDuration(null);
    }
  }, [pickupCoords, destinationCoords, initialDistance, isDistanceEstimated]);

  // Map vehicleType từ frontend sang backend format
  const mapVehicleTypeForPricing = (vehicleType) => {
    // Backend dùng: MOTORBIKE, CAR_4, CAR_7
    // Frontend dùng: BIKE, CAR_4, CAR_7
    if (vehicleType === 'BIKE') {
      return 'MOTORBIKE';
    }
    return vehicleType; // CAR_4, CAR_7 giữ nguyên
  };

  // Map vehicleType sang Map API profile
  const mapVehicleTypeToProfile = (vehicleType) => {
    // Mapbox profiles: 'driving' (ô tô), 'cycling' (xe máy/xe đạp), 'walking' (đi bộ)
    if (vehicleType === 'BIKE') {
      return 'cycling'; // Xe máy dùng cycling profile (gần với tốc độ thực tế hơn)
    }
    return 'driving'; // CAR_4, CAR_7 dùng driving profile
  };

  // Hàm lấy thời gian di chuyển cho một loại xe cụ thể
  const getDurationForVehicle = async (vehicleId) => {
    if (!pickupCoords || !destinationCoords) {
      return null;
    }

    const profile = mapVehicleTypeToProfile(vehicleId);

    try {
      const routeData = await mapAPI.getRoute(
        pickupCoords.lat,
        pickupCoords.lng,
        destinationCoords.lat,
        destinationCoords.lng,
        profile
      );

      if (routeData && routeData.duration) {
        let durationMinutes = Math.round(routeData.duration / 60);

        // Điều chỉnh thời gian cho xe máy (cycling profile có thể chậm hơn thực tế)
        if (vehicleId === 'BIKE') {
          // Xe máy thường nhanh hơn cycling trong thành phố, điều chỉnh giảm 20-30%
          durationMinutes = Math.max(3, Math.round(durationMinutes * 0.75));
        }

        // Lưu thời gian cho loại xe này
        setVehicleDurations(prev => ({ ...prev, [vehicleId]: durationMinutes }));
        return durationMinutes;
      }
    } catch (error) {
      console.warn(`Không thể lấy thời gian cho ${vehicleId}:`, error);
    }

    return null;
  };

  // Hàm gọi Pricing Service cho một loại xe cụ thể
  const fetchPricingForVehicle = async (vehicleId) => {
    const canPrice =
      estimatedDistance > 0 &&
      vehicleId &&
      (estimatedDuration !== null || estimatedDistance > 0);

    if (!canPrice) {
      return null;
    }

    // Ưu tiên dùng thời gian riêng cho loại xe này, nếu không có thì dùng chung
    const durationMinute =
      vehicleDurations[vehicleId] !== undefined
        ? vehicleDurations[vehicleId]
        : estimatedDuration !== null
          ? estimatedDuration
          : Math.max(5, Math.round(estimatedDistance * 2));

    const region = 'DEFAULT';
    const vehicleTypeForPricing = mapVehicleTypeForPricing(vehicleId);

    // Đánh dấu đang loading cho loại xe này
    setPricingLoadingStates(prev => ({ ...prev, [vehicleId]: true }));
    setPricingError(null);

    try {
      const res = await pricingAPI.estimate({
        vehicleType: vehicleTypeForPricing,
        distanceKm: estimatedDistance,
        durationMinute: durationMinute,
        region,
      });

      console.log('Pricing Service Response for', vehicleId, ':', res);

      let fare = null;
      if (res) {
        if (typeof res.estimatedFare === 'number') {
          fare = res.estimatedFare;
        } else if (typeof res === 'number') {
          fare = res;
        } else if (res.data && typeof res.data.estimatedFare === 'number') {
          fare = res.data.estimatedFare;
        }
      }

      if (fare !== null && fare > 0) {
        // Lưu giá cho loại xe này
        setPricingFares(prev => ({ ...prev, [vehicleId]: fare }));
        setPricingError(null);
        console.log('Đã lấy giá từ Pricing Service cho', vehicleId, ':', fare);
        return fare;
      } else {
        console.warn('Pricing Service trả về format không hợp lệ:', res);
        setPricingError('Không thể tính giá tự động. Đang dùng giá tạm.');
        return null;
      }
    } catch (err) {
      console.error('=== LỖI KHI GỌI PRICING SERVICE CHO', vehicleId, '===');
      console.error('Error:', err);

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        if (status === 404) {
          setPricingError('Pricing Service không khả dụng. Đang dùng giá tạm.');
        } else if (status === 400) {
          setPricingError('Dữ liệu không hợp lệ.');
        } else if (status === 500) {
          setPricingError('Lỗi server. Đang dùng giá tạm.');
        } else if (data?.message) {
          setPricingError(data.message);
        }
      } else {
        setPricingError('Không thể kết nối đến server. Đang dùng giá tạm.');
      }
      return null;
    } finally {
      setPricingLoadingStates(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  // Tự động tính giá cho tất cả các xe khi có khoảng cách
  useEffect(() => {
    if (estimatedDistance > 0 && isOpen) {
      // Tính giá cho tất cả các loại xe ngay khi mở modal
      VEHICLES.forEach((vehicle) => {
        // Lấy thời gian cho loại xe này nếu chưa có
        if (!vehicleDurations[vehicle.id]) {
          getDurationForVehicle(vehicle.id);
        }

        // Gọi pricing nếu chưa có giá cho loại xe này và không đang loading
        if (!pricingFares[vehicle.id] && !pricingLoadingStates[vehicle.id]) {
          fetchPricingForVehicle(vehicle.id);
        }
      });
    } else if (estimatedDistance === 0) {
      // Reset giá khi không có khoảng cách
      setPricingFares({});
      setVehicleDurations({});
    }
  }, [estimatedDistance, isOpen]); // Trigger khi khoảng cách thay đổi hoặc modal mở

  // Gọi Pricing Service khi chọn xe khác (để đảm bảo có giá ngay khi chọn)
  useEffect(() => {
    if (selectedVehicle?.id && estimatedDistance > 0) {
      // Lấy thời gian cho loại xe này nếu chưa có
      if (!vehicleDurations[selectedVehicle.id]) {
        getDurationForVehicle(selectedVehicle.id);
      }

      // Gọi pricing nếu chưa có giá cho loại xe này
      if (!pricingFares[selectedVehicle.id] && !pricingLoadingStates[selectedVehicle.id]) {
        fetchPricingForVehicle(selectedVehicle.id);
      }
    }
  }, [selectedVehicle?.id]); // Trigger khi chọn xe khác

  // Fetch wallet balance when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingWallet(true);
      walletApi.getWallet()
        .then((res) => {
          // Response structure from PaymentService: { walletId, userId, balance, currency, lastUpdated }
          setWalletBalance(res.balance || 0);
          setIsLoadingWallet(false);
        })
        .catch((err) => {
          console.error('Failed to load wallet balance:', err);
          setWalletBalance(0);
          setIsLoadingWallet(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Tính giá fallback tại FE
  const calculateFallbackPrice = (vehicle) => {
    return vehicle.basePrice + vehicle.pricePerKm * estimatedDistance;
  };

  // Tính giá cho một xe cụ thể (ưu tiên giá từ API, fallback về công thức)
  const getPriceForVehicle = (vehicle) => {
    const vehicleId = vehicle.id;
    const apiPrice = pricingFares[vehicleId];
    if (apiPrice !== undefined && apiPrice !== null) {
      return apiPrice;
    }
    return calculateFallbackPrice(vehicle);
  };

  // Kiểm tra đang loading cho một xe
  const isVehicleLoading = (vehicleId) => {
    return pricingLoadingStates[vehicleId] === true;
  };

  const totalPrice = getPriceForVehicle(selectedVehicle);

  // Map vehicleType từ frontend sang backend enum
  const mapVehicleTypeForBooking = (vehicleType) => {
    // Backend enum: MOTORBIKE, CAR_4, CAR_7
    // Frontend: BIKE, CAR_4, CAR_7
    if (vehicleType === 'BIKE') {
      return 'MOTORBIKE';
    }
    return vehicleType; // CAR_4, CAR_7 giữ nguyên
  };

  const handleConfirm = async () => {
    // Validate dữ liệu
    if (!pickupCoords || !destinationCoords || !selectedVehicle) {
      setBookingError('Vui lòng chọn đầy đủ thông tin đặt xe.');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      // Chuẩn bị dữ liệu booking
      const vehicleTypeForBooking = mapVehicleTypeForBooking(selectedVehicle.id);

      // Tạo AddressSnapshot cho pickup và dropoff
      const pickupAddressSnapshot = {
        fullAddress: pickupLocation || 'Điểm đón',
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
      };

      const dropoffAddressSnapshot = {
        fullAddress: destinationLocation || 'Điểm đến',
        latitude: destinationCoords.lat,
        longitude: destinationCoords.lng,
      };

      // Gọi API đặt xe
      const bookingData = {
        pickupLocation: pickupAddressSnapshot,
        dropoffLocation: dropoffAddressSnapshot,
        vehicleType: vehicleTypeForBooking,
        paymentMethod: selectedPaymentMethod, // CASH or WALLET
      };

      console.log('Creating booking with data:', bookingData);

      const bookingResponse = await bookingAPI.createBooking(bookingData);

      console.log('Booking created successfully:', bookingResponse);

      // Đóng modal và gọi callback
      if (onConfirm) {
        onConfirm({
          booking: bookingResponse,
          vehicle: selectedVehicle,
          price: totalPrice,
          pickupLocation,
          destinationLocation,
        });
      }

      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);

      let errorMessage = 'Không thể đặt xe. Vui lòng thử lại.';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
          errorMessage = data?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (status === 401) {
          errorMessage = 'Vui lòng đăng nhập để đặt xe.';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền đặt xe.';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setBookingError(errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  // Check if user can pay with wallet
  const canPayWithWallet = selectedPaymentMethod === 'WALLET'
    ? walletBalance >= totalPrice
    : true;

  const isBookingDisabled =
    isBooking ||
    isVehicleLoading(selectedVehicle.id) ||
    !pickupCoords ||
    !destinationCoords ||
    estimatedDistance <= 0 ||
    totalPrice <= 0 ||
    !canPayWithWallet;

  return (
    <div className="vehicle-selection-overlay" onClick={onClose}>
      <div className="vehicle-selection-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vehicle-selection-header">
          <button
            className="vehicle-selection-back-btn"
            onClick={() => {
              if (onBack) {
                onBack(); // Quay lại popup chọn địa điểm
              } else {
                onClose(); // Fallback: đóng modal nếu không có onBack
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="vehicle-selection-title">Chọn phương tiện</h2>
          <div className="vehicle-selection-sparkles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Distance Info */}
        {estimatedDistance > 0 && (
          <div className="vehicle-selection-distance-info">
            <span className="vehicle-selection-distance-label">
              {isCalculatingDistance ? 'Đang tính...' : 'Khoảng cách:'}
            </span>
            <span className="vehicle-selection-distance-value">
              {formatDistance(estimatedDistance)}
              {isEstimated && ' (ước tính)'}
            </span>
            {estimatedDuration && (
              <>
                <span className="vehicle-selection-distance-separator">•</span>
                <span className="vehicle-selection-distance-value">
                  {estimatedDuration} phút
                </span>
              </>
            )}
          </div>
        )}

        {/* Vehicle List */}
        <div className="vehicle-selection-list">
          {VEHICLES.map((vehicle) => {
            const isSelected = selectedVehicle.id === vehicle.id;
            const price = getPriceForVehicle(vehicle);
            const isLoading = isVehicleLoading(vehicle.id);

            return (
              <div
                key={vehicle.id}
                className={`vehicle-selection-item ${isSelected ? 'vehicle-selection-item-selected' : ''}`}
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  // Gọi API khi click vào xe (nếu chưa có giá)
                  if (!pricingFares[vehicle.id] && !isLoading && estimatedDistance > 0) {
                    fetchPricingForVehicle(vehicle.id);
                  }
                }}
              >
                <div className="vehicle-selection-item-icon">
                  {vehicle.icon}
                </div>
                <div className="vehicle-selection-item-info">
                  <h3 className="vehicle-selection-item-name">{vehicle.name}</h3>
                  <p className="vehicle-selection-item-description">
                    {vehicle.description} • {vehicleDurations[vehicle.id] !== undefined
                      ? vehicleDurations[vehicle.id]
                      : estimatedDuration || vehicle.eta} phút
                    {estimatedDistance > 0 && ` • ${formatDistance(estimatedDistance)}`}
                  </p>
                </div>
                <div className="vehicle-selection-item-price">
                  <div className="vehicle-selection-item-price-value">
                    {estimatedDistance <= 0
                      ? 'Chọn điểm đến'
                      : isLoading
                        ? 'Đang tính...'
                        : price > 0
                          ? `${price.toLocaleString('vi-VN')}₫`
                          : '--'}
                  </div>
                  {isSelected && (
                    <div className="vehicle-selection-item-selected-badge">Đã chọn</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment and Promotion */}
        <div className="vehicle-selection-footer-info">
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            onMethodChange={setSelectedPaymentMethod}
            walletBalance={walletBalance}
            totalPrice={totalPrice}
            isLoadingWallet={isLoadingWallet}
          />
          {pricingError && (
            <div className="vehicle-selection-pricing-error">
              {pricingError}
            </div>
          )}
          {bookingError && (
            <div className="vehicle-selection-booking-error">
              {bookingError}
            </div>
          )}
          <button className="vehicle-selection-promotion-btn">
            Khuyến mãi
          </button>
        </div>

        {/* Confirm Button */}
        <button
          className="vehicle-selection-confirm-btn"
          onClick={handleConfirm}
          disabled={isBookingDisabled}
        >
          {isBooking
            ? 'Đang đặt xe...'
            : isVehicleLoading(selectedVehicle.id)
              ? 'Đang tính giá...'
              : estimatedDistance <= 0
                ? 'Vui lòng chọn điểm đến'
                : totalPrice <= 0
                  ? 'Đang tính giá...'
                  : `Đặt xe • ${totalPrice.toLocaleString('vi-VN')}₫`}
        </button>
      </div>
    </div>
  );
};

export default VehicleSelectionModal;

