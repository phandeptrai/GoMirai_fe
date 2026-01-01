import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentMethodSelector.css';

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  walletBalance = 0,
  totalPrice = 0,
  isLoadingWallet = false
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const paymentMethods = [
    {
      id: 'CASH',
      name: 'Tiền mặt',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="payment-method-icon">
          <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
          <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
          <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
        </svg>
      ),
      displayBalance: false
    },
    {
      id: 'WALLET',
      name: 'MyWallet',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="payment-method-icon">
          <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
        </svg>
      ),
      displayBalance: true,
      balance: walletBalance
    }
  ];

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
  const isInsufficientBalance = selectedMethod === 'WALLET' && walletBalance < totalPrice;

  const handleSelect = (methodId) => {
    onMethodChange(methodId);
    setIsOpen(false);
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="payment-method-selector">
      {/* Trigger button */}
      <div
        className="payment-method-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="payment-method-trigger-content">
          <span className="payment-method-label">Thanh toán:</span>
          <div className="payment-method-selected">
            {selectedMethodData?.icon}
            <span className="payment-method-name">
              {selectedMethodData?.name}
              {selectedMethodData?.displayBalance && (
                <span className="payment-method-balance">
                  {' - '}{isLoadingWallet ? 'Đang tải...' : formatCurrency(walletBalance)}
                </span>
              )}
            </span>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`payment-method-chevron ${isOpen ? 'open' : ''}`}
        >
          <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Warning if insufficient balance */}
      {isInsufficientBalance && (
        <div className="payment-method-warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="warning-icon">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <span>Số dư không đủ</span>
          <button className="payment-method-topup-btn" onClick={(e) => {
            e.stopPropagation();
            navigate('/payment');
          }}>
            Nạp tiền
          </button>
        </div>
      )}

      {/* Bottom sheet / dropdown */}
      {isOpen && (
        <>
          <div className="payment-method-overlay" onClick={() => setIsOpen(false)} />
          <div className="payment-method-sheet">
            <div className="payment-method-sheet-header">
              <h3>Chọn phương thức thanh toán</h3>
              <button className="payment-method-close" onClick={() => setIsOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="payment-method-list">
              {paymentMethods.map((method) => {
                const isSelected = method.id === selectedMethod;
                const isWalletInsufficient = method.id === 'WALLET' && method.balance < totalPrice;

                return (
                  <div
                    key={method.id}
                    className={`payment-method-option ${isSelected ? 'selected' : ''} ${isWalletInsufficient ? 'insufficient' : ''}`}
                    onClick={() => handleSelect(method.id)}
                  >
                    <div className="payment-method-option-icon">
                      {method.icon}
                    </div>
                    <div className="payment-method-option-info">
                      <div className="payment-method-option-name">{method.name}</div>
                      {method.displayBalance && (
                        <div className="payment-method-option-balance">
                          Số dư: {isLoadingWallet ? 'Đang tải...' : formatCurrency(method.balance)}
                        </div>
                      )}
                      {isWalletInsufficient && (
                        <div className="payment-method-option-insufficient">
                          Số dư không đủ
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="payment-method-option-check">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
