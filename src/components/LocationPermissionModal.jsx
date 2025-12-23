import './LocationPermissionModal.css';

const LocationPermissionModal = ({ isOpen, onAllow, onDeny }) => {
  if (!isOpen) return null;

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-modal">
        <div className="location-permission-icon">📍</div>
        <h2 className="location-permission-title">Cho phép truy cập vị trí</h2>
        <p className="location-permission-description">
          Ứng dụng cần quyền truy cập vị trí của bạn để:
        </p>
        <ul className="location-permission-benefits">
          <li>✓ Tìm địa điểm gần bạn nhanh chóng</li>
          <li>✓ Đề xuất điểm đón phù hợp</li>
          <li>✓ Cải thiện trải nghiệm đặt xe</li>
        </ul>
        <div className="location-permission-actions">
          <button 
            className="location-permission-btn location-permission-btn-deny"
            onClick={onDeny}
          >
            Không cho phép
          </button>
          <button 
            className="location-permission-btn location-permission-btn-allow"
            onClick={onAllow}
          >
            Cho phép
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;









