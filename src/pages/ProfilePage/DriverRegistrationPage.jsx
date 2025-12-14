import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { driverAPI } from '../../api/driver.api';
import { Icons } from '../../components/constants';
import './DriverRegistrationPage.css';

const DriverRegistrationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    licenseNumber: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    plateNumber: '',
    color: '',
    registrationDate: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);

  const vehicleTypes = [
    { value: 'MOTORBIKE', label: 'Xe máy' },
    { value: 'CAR_4', label: 'Ô tô 4 chỗ' },
    { value: 'CAR_7', label: 'Ô tô 7 chỗ' },
  ];

  // Fetch existing driver profile on mount
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!user?.userId) {
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        const driverData = await driverAPI.getMyProfile();
        setDriverProfile(driverData);

        // Fill form with existing data
        if (driverData) {
          let registrationDateFormatted = '';
          if (driverData.vehicle?.registrationDate) {
            const date = new Date(driverData.vehicle.registrationDate);
            registrationDateFormatted = date.toISOString().split('T')[0];
          }

          setForm({
            licenseNumber: driverData.licenseNumber || '',
            vehicleType: driverData.vehicle?.type || '',
            vehicleBrand: driverData.vehicle?.brand || '',
            vehicleModel: driverData.vehicle?.model || '',
            plateNumber: driverData.vehicle?.plateNumber || '',
            color: driverData.vehicle?.color || '',
            registrationDate: registrationDateFormatted,
          });
        }
      } catch (err) {
        // Không có driver profile hoặc chưa đăng ký - không phải lỗi
        if (err.response?.status !== 404 && err.response?.status !== 403) {
          console.error('Error fetching driver profile:', err);
        }
        setDriverProfile(null);
      } finally {
        setFetching(false);
      }
    };

    fetchDriverProfile();
  }, [user?.userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.licenseNumber || form.licenseNumber.trim() === '') {
      newErrors.licenseNumber = 'Số bằng lái xe là bắt buộc';
    }

    if (!form.vehicleType) {
      newErrors.vehicleType = 'Loại phương tiện là bắt buộc';
    }

    if (!form.vehicleBrand || form.vehicleBrand.trim() === '') {
      newErrors.vehicleBrand = 'Hãng xe là bắt buộc';
    }

    if (!form.vehicleModel || form.vehicleModel.trim() === '') {
      newErrors.vehicleModel = 'Dòng xe là bắt buộc';
    }

    if (!form.plateNumber || form.plateNumber.trim() === '') {
      newErrors.plateNumber = 'Biển số là bắt buộc';
    }

    if (!form.color || form.color.trim() === '') {
      newErrors.color = 'Màu xe là bắt buộc';
    }

    if (!form.registrationDate) {
      newErrors.registrationDate = 'Ngày đăng ký xe là bắt buộc';
    } else {
      const date = new Date(form.registrationDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        newErrors.registrationDate = 'Ngày đăng ký không thể là tương lai';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Nếu đang chờ duyệt, không cho phép submit
    if (driverProfile?.accountStatus === 'PENDING_VERIFICATION') {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const registrationDate = form.registrationDate;

      // Nếu đã ACTIVE, gọi API update
      if (driverProfile?.accountStatus === 'ACTIVE') {
        // Update driver profile (license number)
        await driverAPI.updateMyProfile({
          licenseNumber: form.licenseNumber.trim(),
        });

        // Update vehicle
        await driverAPI.updateMyVehicle({
          brand: form.vehicleBrand.trim(),
          model: form.vehicleModel.trim(),
          plateNumber: form.plateNumber.trim(),
          color: form.color.trim(),
          type: form.vehicleType,
          registrationDate: registrationDate,
        });

        alert('Đã cập nhật thông tin thành công!');
        navigate('/profile', { replace: true });
      } else {
        // Nếu REJECTED hoặc chưa có profile, gọi API apply
        const applicationData = {
          licenseNumber: form.licenseNumber.trim(),
          vehicleType: form.vehicleType,
          vehicleBrand: form.vehicleBrand.trim(),
          vehicleModel: form.vehicleModel.trim(),
          plateNumber: form.plateNumber.trim(),
          color: form.color.trim(),
          registrationDate: registrationDate,
        };

        const response = await driverAPI.apply(applicationData);
        console.log('Driver application submitted:', response);
        
        alert('Đã gửi hồ sơ đăng ký thành công! Vui lòng chờ xử lý.');
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      console.error('Error submitting driver application:', err);
      let message = driverProfile?.accountStatus === 'ACTIVE' 
        ? 'Không thể cập nhật thông tin. Vui lòng thử lại.'
        : 'Không thể gửi hồ sơ đăng ký. Vui lòng thử lại.';
      
      if (err.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data.errors)) {
          message = data.errors.map(e => e.defaultMessage || e.message).join(', ');
        } else if (data.message) {
          message = data.message;
        } else if (typeof data === 'string') {
          message = data;
        }
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Get button text and disabled state based on status
  const getButtonConfig = () => {
    if (!driverProfile) {
      return { text: 'Gửi hồ sơ đăng ký', disabled: false };
    }

    switch (driverProfile.accountStatus) {
      case 'ACTIVE':
        return { text: 'Cập nhật thông tin', disabled: false };
      case 'PENDING_VERIFICATION':
        return { text: 'Đang chờ duyệt', disabled: true };
      case 'REJECTED':
        return { text: 'Gửi hồ sơ đăng ký', disabled: false };
      case 'BANNED':
        return { text: 'Tài khoản bị khóa', disabled: true };
      default:
        return { text: 'Gửi hồ sơ đăng ký', disabled: false };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="driver-registration-page">
      {/* Header */}
      <header className="driver-registration-header">
        <button className="driver-registration-back" onClick={() => navigate(-1)}>
          <Icons.ArrowLeft className="driver-registration-back-icon" />
        </button>
        <h1 className="driver-registration-title">Đăng ký tài xế</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* Content */}
      <div className="driver-registration-content">
        {fetching && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5f6c7b' }}>
            <div>Đang tải thông tin...</div>
          </div>
        )}

        {!fetching && (
          <>
            {driverProfile && (
              <div className="driver-registration-info-banner">
                <Icons.Shield className="driver-registration-info-icon" />
                <div className="driver-registration-info-text">
                  <strong>Bạn đã có hồ sơ đăng ký tài xế</strong>
                  <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Trạng thái: {
                      driverProfile.accountStatus === 'PENDING_VERIFICATION' ? 'Chờ duyệt' :
                      driverProfile.accountStatus === 'ACTIVE' ? 'Đã duyệt' :
                      driverProfile.accountStatus === 'REJECTED' ? 'Bị từ chối' :
                      driverProfile.accountStatus === 'BANNED' ? 'Bị khóa' :
                      driverProfile.accountStatus
                    }
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="driver-registration-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
          {/* Driver Information Section */}
          <div className="driver-registration-section">
            <div className="driver-registration-section-header">
              <Icons.Person className="driver-registration-section-icon" style={{ color: '#2563eb' }} />
              <h2 className="driver-registration-section-title">Thông tin tài xế</h2>
            </div>
            
            <div className="driver-registration-field">
              <label className="driver-registration-field-label">SỐ BẰNG LÁI XE</label>
              <input
                type="text"
                className="driver-registration-field-input"
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={handleChange}
                placeholder="Ví dụ: 79C1-123456"
              />
              {errors.licenseNumber && (
                <span className="driver-registration-field-error">{errors.licenseNumber}</span>
              )}
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="driver-registration-section">
            <div className="driver-registration-section-header">
              <Icons.Car className="driver-registration-section-icon" style={{ color: '#f97316' }} />
              <h2 className="driver-registration-section-title">Thông tin phương tiện</h2>
            </div>

            {/* Vehicle Type */}
            <div className="driver-registration-field">
              <label className="driver-registration-field-label">LOẠI PHƯƠNG TIỆN</label>
              <select
                className="driver-registration-field-input"
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
              >
                <option value="">Chọn loại phương tiện</option>
                {vehicleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.vehicleType && (
                <span className="driver-registration-field-error">{errors.vehicleType}</span>
              )}
            </div>

            {/* Vehicle Brand and Model - Side by side */}
            <div className="driver-registration-field-row">
              <div className="driver-registration-field driver-registration-field-half">
                <label className="driver-registration-field-label">HÃNG XE</label>
                <input
                  type="text"
                  className="driver-registration-field-input"
                  name="vehicleBrand"
                  value={form.vehicleBrand}
                  onChange={handleChange}
                  placeholder="Honda"
                />
                {errors.vehicleBrand && (
                  <span className="driver-registration-field-error">{errors.vehicleBrand}</span>
                )}
              </div>
              <div className="driver-registration-field driver-registration-field-half">
                <label className="driver-registration-field-label">DÒNG XE</label>
                <input
                  type="text"
                  className="driver-registration-field-input"
                  name="vehicleModel"
                  value={form.vehicleModel}
                  onChange={handleChange}
                  placeholder="Vision"
                />
                {errors.vehicleModel && (
                  <span className="driver-registration-field-error">{errors.vehicleModel}</span>
                )}
              </div>
            </div>

            {/* Plate Number and Color - Side by side */}
            <div className="driver-registration-field-row">
              <div className="driver-registration-field driver-registration-field-half">
                <label className="driver-registration-field-label">BIỂN SỐ</label>
                <input
                  type="text"
                  className="driver-registration-field-input"
                  name="plateNumber"
                  value={form.plateNumber}
                  onChange={handleChange}
                  placeholder="29A-123.45"
                />
                {errors.plateNumber && (
                  <span className="driver-registration-field-error">{errors.plateNumber}</span>
                )}
              </div>
              <div className="driver-registration-field driver-registration-field-half">
                <label className="driver-registration-field-label">MÀU XE</label>
                <input
                  type="text"
                  className="driver-registration-field-input"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="Trắng"
                />
                {errors.color && (
                  <span className="driver-registration-field-error">{errors.color}</span>
                )}
              </div>
            </div>

            {/* Registration Date */}
            <div className="driver-registration-field">
              <label className="driver-registration-field-label">NGÀY ĐĂNG KÝ XE</label>
              <input
                type="date"
                className="driver-registration-field-input"
                name="registrationDate"
                value={form.registrationDate}
                onChange={handleChange}
                placeholder="mm/dd/yyyy"
              />
              {errors.registrationDate && (
                <span className="driver-registration-field-error">{errors.registrationDate}</span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="driver-registration-submit-btn"
            disabled={loading || buttonConfig.disabled}
            style={{
              opacity: buttonConfig.disabled ? 0.6 : 1,
              cursor: buttonConfig.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {loading 
              ? (driverProfile?.accountStatus === 'ACTIVE' ? 'Đang cập nhật...' : 'Đang gửi...')
              : buttonConfig.text
            }
          </button>

          {/* Disclaimer */}
          <p className="driver-registration-disclaimer">
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <a href="#" className="driver-registration-link" onClick={(e) => {
              e.preventDefault();
              // TODO: Navigate to terms page
            }}>
              Điều khoản đối tác
            </a>
            {' '}của GoMirai.
          </p>
        </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverRegistrationPage;

