import { useState } from 'react';
import { Icons } from '../constants';
import './PaymentScreen.css';

const PaymentScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState('card');

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
              <div className="wallet-balance">540.000₫</div>
            </div>
            <button className="wallet-send-btn">
              <Icons.PaperAirplane className="wallet-send-icon" />
            </button>
          </div>

          {/* Bottom section with card number and top-up button */}
          <div className="wallet-bottom">
            <div className="wallet-card-number">**** **** **** 1234</div>
            <button className="wallet-topup-btn">Nạp tiền</button>
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
                <Icons.QuestionMark className="payment-icon" />
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
    </div>
  );
};

export default PaymentScreen;
