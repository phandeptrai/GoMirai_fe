import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DriverModeButton.css';

const DriverModeButton = () => {
    const navigate = useNavigate();
    const { user, refreshToken } = useAuth();
    const [checking, setChecking] = useState(false);

    const handleDriverMode = async () => {
        if (checking) return;

        setChecking(true);

        try {
            // Check current role
            if (user?.role === 'DRIVER') {
                // Already has DRIVER role, go straight to driver mode
                navigate('/driver');
                return;
            }

            // Try to refresh token to get latest role
            console.log('Refreshing token to check latest role...');
            const result = await refreshToken();

            if (result.success && result.role === 'DRIVER') {
                // Successfully got DRIVER role, navigate
                alert('Chào mừng bạn đến với chế độ tài xế! 🚗');
                navigate('/driver');
            } else {
                // Still not a driver
                alert(
                    'Bạn chưa được phê duyệt làm tài xế.\n\n' +
                    'Vui lòng:\n' +
                    '1. Đăng ký làm tài xế (nếu chưa)\n' +
                    '2. Chờ admin phê duyệt\n' +
                    '3. Thử lại sau khi được phê duyệt'
                );
            }
        } catch (error) {
            console.error('Error checking driver role:', error);
            alert('Không thể kiểm tra quyền tài xế. Vui lòng thử lại sau.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <button
            className="driver-mode-button"
            onClick={handleDriverMode}
            disabled={checking}
        >
            <span className="driver-icon">🚗</span>
            <span className="driver-text">
                {checking ? 'Đang kiểm tra...' : 'Chế độ tài xế'}
            </span>
        </button>
    );
};

export default DriverModeButton;
