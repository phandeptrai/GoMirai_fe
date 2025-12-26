import { useState } from 'react';
import { walletApi } from '../../api/wallet.api';
import './TopUpModal.css';

const TopUpModal = ({ isOpen, onClose, currentBalance, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const quickAmounts = [50000, 100000, 200000, 500000];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handleQuickSelect = (value) => {
        setAmount(value.toString());
        setError('');
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setAmount(value);
        setError('');
    };

    const validateAmount = () => {
        const numAmount = parseInt(amount);
        if (!amount || numAmount <= 0) {
            return 'Vui lòng nhập số tiền';
        }
        if (numAmount < 1000) {
            return 'Số tiền tối thiểu là 1,000 VND';
        }
        if (numAmount > 10000000) {
            return 'Số tiền tối đa là 10,000,000 VND';
        }
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateAmount();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await walletApi.topUp({ amount: parseInt(amount) });
            console.log('Top-up success:', response);
            onSuccess && onSuccess(response);
            handleClose();
        } catch (err) {
            console.error('Top-up failed:', err);
            setError(err.response?.data?.message || 'Nạp tiền thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="topup-overlay" onClick={handleClose}>
            <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="topup-header">
                    <h2 className="topup-title">NẠP TIỀN VÀO VÍ</h2>
                    <button className="topup-close-btn" onClick={handleClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Current Balance */}
                <div className="topup-balance-card">
                    <span className="topup-balance-icon">💰</span>
                    <div className="topup-balance-info">
                        <span className="topup-balance-label">SỐ DƯ HIỆN TẠI</span>
                        <span className="topup-balance-value">{formatCurrency(currentBalance || 0)} VND</span>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="topup-input-section">
                    <label className="topup-input-label">NHẬP SỐ TIỀN MUỐN NẠP</label>
                    <div className="topup-input-wrapper">
                        <input
                            type="text"
                            className="topup-input"
                            value={amount ? formatCurrency(parseInt(amount)) : ''}
                            onChange={handleAmountChange}
                            placeholder="0"
                        />
                        <span className="topup-input-currency">VND</span>
                    </div>
                    {error && <div className="topup-error">{error}</div>}
                </div>

                {/* Quick Select */}
                <div className="topup-quick-section">
                    <span className="topup-quick-label">CHỌN NHANH:</span>
                    <div className="topup-quick-buttons">
                        {quickAmounts.map((value) => (
                            <button
                                key={value}
                                className={`topup-quick-btn ${parseInt(amount) === value ? 'topup-quick-btn-active' : ''}`}
                                onClick={() => handleQuickSelect(value)}
                            >
                                {value >= 1000000 ? `${value / 1000000}M` : `${value / 1000}K`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    className="topup-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading || !amount}
                >
                    {loading ? (
                        <span className="topup-loading">Đang xử lý...</span>
                    ) : (
                        <>
                            <svg className="topup-submit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            NẠP TIỀN NGAY
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TopUpModal;
