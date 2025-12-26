import { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { walletApi } from '../../api/wallet.api';
import TopUpModal from './TopUpModal';
import './PaymentScreen.css';

const PaymentScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const fetchWallet = async () => {
    try {
      const data = await walletApi.getWallet();
      setWallet(data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleTopUpSuccess = (response) => {
    // Cập nhật số dư mới từ response
    if (response && response.balanceAfter !== undefined) {
      setWallet(prev => ({
        ...prev,
        balance: response.balanceAfter
      }));
    } else {
      // Fallback: fetch lại wallet nếu không có balanceAfter
      fetchWallet();
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-content">
        {/* Wallet Balance Card */}
        <div className="wallet-card">
          <div className="wallet-card-bg-circle"></div>

          {/* Top section with balance and send icon */}
          <div className="wallet-top">
            <div className="wallet-info">
              <div className="wallet-label">Số dư ví RidePay</div>
              <div className="wallet-balance">
                {loading ? '---' : wallet ? formatCurrency(wallet.balance) : '0₫'}
              </div>
            </div>
            <button className="wallet-send-btn">
              <Icons.PaperAirplane className="wallet-send-icon" />
            </button>
          </div>

          {/* Bottom section with card number and top-up button */}
          <div className="wallet-bottom">
            <div className="wallet-card-number">
              {wallet ? `Wallet ID: ...${wallet.walletId?.slice(-4) || '****'}` : '**** **** **** ****'}
            </div>
            <button
              className="wallet-topup-btn"
              onClick={() => setShowTopUpModal(true)}
            >
              Nạp tiền
            </button>
          </div>
        </div>

        {/* Payment Methods Section */}
        <h3 className="payment-methods-title">Phương thức thanh toán</h3>
        <div className="payment-methods-card">
          {/* First payment method - Wallet/Question mark */}
          <button
            onClick={() => setSelectedMethod('wallet')}
            className="payment-method-item"
          >
            <div className="payment-method-left">
              <div className="payment-icon-circle payment-icon-green">
                <Icons.Wallet className="payment-icon" />
              </div>
            </div>
            <div className={`payment-radio ${selectedMethod === 'wallet' ? 'payment-radio-selected' : ''}`}>
              {selectedMethod === 'wallet' && <div className="payment-radio-dot"></div>}
            </div>
          </button>

          {/* Second payment method - Credit card */}
          <button
            onClick={() => setSelectedMethod('card')}
            className="payment-method-item payment-method-item-last"
          >
            <div className="payment-method-left">
              <div className="payment-icon-circle payment-icon-blue">
                <Icons.CreditCard className="payment-icon" />
              </div>
            </div>
            <div className={`payment-radio ${selectedMethod === 'card' ? 'payment-radio-selected' : ''}`}>
              {selectedMethod === 'card' && <div className="payment-radio-dot"></div>}
            </div>
          </button>
        </div>
      </div>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentBalance={wallet?.balance || 0}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
};

export default PaymentScreen;

