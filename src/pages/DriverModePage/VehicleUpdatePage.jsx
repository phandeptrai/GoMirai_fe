import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverAPI } from '../../api/driver.api';
import { Icons } from '../../components/constants';
import './VehicleUpdatePage.css';

const VehicleUpdatePage = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState({
    brand: '',
    model: '',
    plateNumber: '',
    color: '',
    type: 'MOTORBIKE',
    registrationDate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const vehicleData = await driverAPI.getMyVehicle();
        setVehicle({
          brand: vehicleData.brand || '',
          model: vehicleData.model || '',
          plateNumber: vehicleData.plateNumber || '',
          color: vehicleData.color || '',
          type: vehicleData.type || 'MOTORBIKE',
          registrationDate: vehicleData.registrationDate ? vehicleData.registrationDate.split('T')[0] : ''
        });
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        alert('Không thể tải thông tin xe. Vui lòng thử lại.');
        navigate('/driver');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [navigate]);

  const handleChange = (field, value) => {
    setVehicle(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!vehicle.brand.trim()) {
      newErrors.brand = 'Hãng xe là bắt buộc';
    }
    if (!vehicle.model.trim()) {
      newErrors.model = 'Dòng xe là bắt buộc';
    }
    if (!vehicle.plateNumber.trim()) {
      newErrors.plateNumber = 'Biển số là bắt buộc';
    }
    if (!vehicle.color.trim()) {
      newErrors.color = 'Màu xe là bắt buộc';
    }
    if (!vehicle.type) {
      newErrors.type = 'Loại xe là bắt buộc';
    }
    if (!vehicle.registrationDate) {
      newErrors.registrationDate = 'Ngày đăng ký là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      
      await driverAPI.updateMyVehicle({
        brand: vehicle.brand.trim(),
        model: vehicle.model.trim(),
        plateNumber: vehicle.plateNumber.trim(),
        color: vehicle.color.trim(),
        type: vehicle.type,
        registrationDate: vehicle.registrationDate
      });

      alert('Cập nhật thông tin xe thành công!');
      navigate('/driver');
    } catch (err) {
      console.error('Error updating vehicle:', err);
      alert('Không thể cập nhật thông tin xe. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const vehicleTypeOptions = [
    { value: 'MOTORBIKE', label: 'Xe máy' },
    { value: 'CAR_4', label: 'Ô tô 4 chỗ' },
    { value: 'CAR_7', label: 'Ô tô 7 chỗ' },
  ];

  if (loading) {
    return (
      <div className="vehicle-update-container">
        <div className="vehicle-update-loading">
          <div className="vehicle-update-spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-update-container">
      {/* Header */}
      <div className="vehicle-update-header">
        <button 
          className="vehicle-update-back-button"
          onClick={() => navigate('/driver')}
        >
          <Icons.ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="vehicle-update-title">Cập nhật phương tiện</h1>
        <button 
          className="vehicle-update-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>

      {/* Form */}
      <div className="vehicle-update-form">
        {/* Loại xe */}
        <div className="vehicle-update-field">
          <label className="vehicle-update-label">LOẠI XE</label>
          <select
            className={`vehicle-update-input ${errors.type ? 'error' : ''}`}
            value={vehicle.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            {vehicleTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <span className="vehicle-update-error">{errors.type}</span>
          )}
        </div>

        {/* Hãng xe */}
        <div className="vehicle-update-field">
          <label className="vehicle-update-label">HÃNG XE</label>
          <input
            type="text"
            className={`vehicle-update-input ${errors.brand ? 'error' : ''}`}
            value={vehicle.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="Nhập hãng xe"
          />
          {errors.brand && (
            <span className="vehicle-update-error">{errors.brand}</span>
          )}
        </div>

        {/* Dòng xe */}
        <div className="vehicle-update-field">
          <label className="vehicle-update-label">DÒNG XE</label>
          <input
            type="text"
            className={`vehicle-update-input ${errors.model ? 'error' : ''}`}
            value={vehicle.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="Nhập dòng xe"
          />
          {errors.model && (
            <span className="vehicle-update-error">{errors.model}</span>
          )}
        </div>

        {/* Biển số */}
        <div className="vehicle-update-field">
          <label className="vehicle-update-label">BIỂN SỐ</label>
          <input
            type="text"
            className={`vehicle-update-input ${errors.plateNumber ? 'error' : ''}`}
            value={vehicle.plateNumber}
            onChange={(e) => handleChange('plateNumber', e.target.value)}
            placeholder="Nhập biển số"
          />
          {errors.plateNumber && (
            <span className="vehicle-update-error">{errors.plateNumber}</span>
          )}
        </div>

        {/* Màu xe */}
        <div className="vehicle-update-field">
          <label className="vehicle-update-label">MÀU XE</label>
          <input
            type="text"
            className={`vehicle-update-input ${errors.color ? 'error' : ''}`}
            value={vehicle.color}
            onChange={(e) => handleChange('color', e.target.value)}
            placeholder="Nhập màu xe"
          />
          {errors.color && (
            <span className="vehicle-update-error">{errors.color}</span>
          )}
        </div>

        {/* Ngày đăng ký */}
        <div className="vehicle-update-field">
          <label className="vehicle-update-label">NGÀY ĐĂNG KÝ</label>
          <input
            type="date"
            className={`vehicle-update-input ${errors.registrationDate ? 'error' : ''}`}
            value={vehicle.registrationDate}
            onChange={(e) => handleChange('registrationDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.registrationDate && (
            <span className="vehicle-update-error">{errors.registrationDate}</span>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="vehicle-update-note">
        <p>
          Lưu ý: Việc thay đổi thông tin phương tiện cần đảm bảo chính xác với giấy tờ xe. 
          GoMirai có thể yêu cầu xác minh lại nếu phát hiện bất thường.
        </p>
      </div>
    </div>
  );
};

export default VehicleUpdatePage;







