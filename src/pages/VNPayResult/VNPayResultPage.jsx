import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { walletApi } from '../../api/wallet.api';
import './VNPayResult.css';

/**
 * Trang hiển thị kết quả thanh toán VNPay.
 * VNPay sẽ redirect user về đây sau khi thanh toán.
 */
const VNPayResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkPaymentResult = async () => {
            try {
                // Lấy tất cả params từ URL
                const params = {};
                searchParams.forEach((value, key) => {
                    params[key] = value;
                });

                console.log('VNPay return params:', params);

                // Đọc trực tiếp từ URL params (VNPay trả về)
                const vnpResponseCode = params.vnp_ResponseCode;
                const vnpTxnRef = params.vnp_TxnRef;
                const vnpTransactionNo = params.vnp_TransactionNo;
                const vnpAmount = params.vnp_Amount;

                // VNPay sử dụng responseCode "00" cho giao dịch thành công
                const isVNPaySuccess = vnpResponseCode === '00';

                // Format số tiền (VNPay trả về số tiền * 100)
                const amount = vnpAmount ? parseInt(vnpAmount) / 100 : 0;

                // Tạo result object
                const paymentResult = {
                    success: isVNPaySuccess,
                    transactionRef: vnpTxnRef || '',
                    vnpTransactionNo: vnpTransactionNo || '',
                    amount: amount.toString(),
                    message: isVNPaySuccess 
                        ? 'Nạp tiền thành công! Số dư sẽ được cập nhật.' 
                        : getErrorMessage(vnpResponseCode),
                    responseCode: vnpResponseCode
                };

                setResult(paymentResult);

                // Gọi API backend để xác nhận (optional - có thể bỏ nếu backend chưa sẵn sàng)
                try {
                    const response = await walletApi.checkVNPayResult(params);
                    console.log('Backend response:', response);
                    // Merge với response từ backend nếu có
                    if (response) {
                        setResult(prev => ({
                            ...prev,
                            // Giữ nguyên success từ VNPay responseCode
                            success: isVNPaySuccess,
                            message: isVNPaySuccess 
                                ? 'Nạp tiền thành công! Số dư sẽ được cập nhật.'
                                : (response.message || prev.message)
                        }));
                    }
                } catch (apiError) {
                    console.warn('Backend API error (ignored):', apiError);
                    // Không set error - vẫn hiển thị kết quả từ VNPay params
                }

            } catch (err) {
                console.error('Error processing VNPay result:', err);
                setError('Không thể xác nhận kết quả thanh toán.');
            } finally {
                setLoading(false);
            }
        };

        checkPaymentResult();
    }, [searchParams]);

    // Hàm lấy thông báo lỗi từ VNPay response code
    const getErrorMessage = (code) => {
        const messages = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
            '09': 'Thẻ/Tài khoản chưa đăng ký InternetBanking',
            '10': 'Xác thực thông tin không đúng quá 3 lần',
            '11': 'Đã hết hạn chờ thanh toán',
            '12': 'Thẻ/Tài khoản bị khóa',
            '13': 'Mã OTP không chính xác',
            '24': 'Khách hàng hủy giao dịch',
            '51': 'Tài khoản không đủ số dư',
            '65': 'Vượt quá hạn mức giao dịch trong ngày',
            '75': 'Ngân hàng đang bảo trì',
            '79': 'Nhập sai mật khẩu quá số lần quy định',
            '99': 'Lỗi không xác định'
        };
        return messages[code] || `Lỗi: ${code}`;
    };

    const handleGoToWallet = () => {
        navigate('/payment');
    };

    const handleGoHome = () => {
        navigate('/home');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    if (loading) {
        return (
            <div className="vnpay-result-page">
                <div className="vnpay-result-loading">
                    <div className="vnpay-result-spinner"></div>
                    <p>Đang xác nhận kết quả thanh toán...</p>
                </div>
            </div>
        );
    }

    if (error && !result) {
        return (
            <div className="vnpay-result-page">
                <div className="vnpay-result-card vnpay-result-error">
                    <div className="vnpay-result-icon">⚠️</div>
                    <h1 className="vnpay-result-title">Có lỗi xảy ra</h1>
                    <p className="vnpay-result-message">{error}</p>
                    <div className="vnpay-result-actions">
                        <button className="vnpay-result-btn vnpay-result-btn-primary" onClick={handleGoToWallet}>
                            Kiểm tra ví
                        </button>
                        <button className="vnpay-result-btn vnpay-result-btn-secondary" onClick={handleGoHome}>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isSuccess = result?.success;

    return (
        <div className="vnpay-result-page">
            <div className={`vnpay-result-card ${isSuccess ? 'vnpay-result-success' : 'vnpay-result-failed'}`}>
                {/* Icon */}
                <div className="vnpay-result-icon">
                    {isSuccess ? (
                        <svg className="vnpay-result-check" viewBox="0 0 52 52">
                            <circle className="vnpay-result-check-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path className="vnpay-result-check-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    ) : (
                        <svg className="vnpay-result-cross" viewBox="0 0 52 52">
                            <circle className="vnpay-result-cross-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path className="vnpay-result-cross-cross" fill="none" d="M16 16 36 36 M36 16 16 36"/>
                        </svg>
                    )}
                </div>

                {/* Title */}
                <h1 className="vnpay-result-title">
                    {isSuccess ? 'Nạp tiền thành công!' : 'Thanh toán thất bại'}
                </h1>

                {/* Message */}
                <p className="vnpay-result-message">
                    {result?.message || (isSuccess ? 'Số tiền đã được cộng vào ví của bạn.' : 'Giao dịch không thành công.')}
                </p>

                {/* Transaction Details */}
                <div className="vnpay-result-details">
                    {result?.amount && (
                        <div className="vnpay-result-detail-row">
                            <span className="vnpay-result-detail-label">Số tiền:</span>
                            <span className="vnpay-result-detail-value vnpay-result-amount">
                                {formatCurrency(result.amount)} VND
                            </span>
                        </div>
                    )}
                    {result?.transactionRef && (
                        <div className="vnpay-result-detail-row">
                            <span className="vnpay-result-detail-label">Mã giao dịch:</span>
                            <span className="vnpay-result-detail-value">{result.transactionRef}</span>
                        </div>
                    )}
                    {result?.vnpTransactionNo && (
                        <div className="vnpay-result-detail-row">
                            <span className="vnpay-result-detail-label">Mã VNPay:</span>
                            <span className="vnpay-result-detail-value">{result.vnpTransactionNo}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="vnpay-result-actions">
                    <button className="vnpay-result-btn vnpay-result-btn-primary" onClick={handleGoToWallet}>
                        {isSuccess ? 'Xem ví của tôi' : 'Thử lại'}
                    </button>
                    <button className="vnpay-result-btn vnpay-result-btn-secondary" onClick={handleGoHome}>
                        Về trang chủ
                    </button>
                </div>

                {/* VNPay Logo */}
                <div className="vnpay-result-footer">
                    <span>Thanh toán qua</span>
                    <img 
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" 
                        alt="VNPay" 
                        className="vnpay-result-logo"
                    />
                </div>
            </div>
        </div>
    );
};

export default VNPayResultPage;
