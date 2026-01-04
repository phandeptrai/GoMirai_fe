/**
 * Google OAuth Integration Hook
 * 
 * Sử dụng Google Identity Services (GIS) library mới nhất
 * https://developers.google.com/identity/gsi/web
 * 
 * Lưu ý: Google OAuth chỉ thực hiện AUTHENTICATION (xác thực danh tính).
 * Không phân biệt "đăng ký" hay "đăng nhập" ở phía người dùng:
 * - Nếu providerUserId (Google sub) đã tồn tại → xem như đăng nhập
 * - Nếu chưa tồn tại → hệ thống tự động tạo user (auto-registration)
 */

import { useState, useEffect, useCallback } from 'react';

// Google Client ID từ environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Hook để xử lý Google Sign-In
 * @param {Function} onSuccess - Callback khi nhận được ID token thành công
 * @param {Function} onError - Callback khi có lỗi
 */
export const useGoogleAuth = (onSuccess, onError) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');
      return;
    }

    // Check if script already loaded
    if (window.google?.accounts) {
      initializeGoogleSignIn();
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script');
      onError?.('Không thể tải Google Sign-In');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup nếu cần
    };
  }, []);

  const initializeGoogleSignIn = useCallback(() => {
    if (!window.google?.accounts) {
      console.error('Google Identity Services not loaded');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      onError?.('Không thể khởi tạo Google Sign-In');
    }
  }, []);

  const handleCredentialResponse = useCallback((response) => {
    setIsLoading(false);
    
    if (response.credential) {
      // response.credential là JWT ID token từ Google
      console.log('Google Sign-In successful, received ID token');
      onSuccess?.(response.credential);
    } else {
      console.error('No credential in Google response');
      onError?.('Đăng nhập Google thất bại');
    }
  }, [onSuccess, onError]);

  /**
   * Trigger Google Sign-In popup
   */
  const signInWithGoogle = useCallback(() => {
    if (!isReady) {
      onError?.('Google Sign-In chưa sẵn sàng');
      return;
    }

    setIsLoading(true);

    try {
      // Sử dụng prompt để hiển thị One Tap hoặc popup
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          // One Tap không hiển thị được, fallback to button
          console.log('One Tap not displayed, reason:', notification.getNotDisplayedReason());
          setIsLoading(false);
          
          // Render nút đăng nhập trong một div tạm thời
          renderGoogleButton();
        } else if (notification.isSkippedMoment()) {
          console.log('One Tap skipped');
          setIsLoading(false);
        } else if (notification.isDismissedMoment()) {
          console.log('One Tap dismissed, reason:', notification.getDismissedReason());
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error triggering Google Sign-In:', error);
      setIsLoading(false);
      onError?.('Không thể mở Google Sign-In');
    }
  }, [isReady, onError]);

  /**
   * Render Google Sign-In button as fallback
   */
  const renderGoogleButton = useCallback(() => {
    // Tạo một div tạm để render button
    let buttonContainer = document.getElementById('google-signin-button-temp');
    if (!buttonContainer) {
      buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-button-temp';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '50%';
      buttonContainer.style.left = '50%';
      buttonContainer.style.transform = 'translate(-50%, -50%)';
      buttonContainer.style.zIndex = '10000';
      buttonContainer.style.background = 'white';
      buttonContainer.style.padding = '20px';
      buttonContainer.style.borderRadius = '12px';
      buttonContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
      document.body.appendChild(buttonContainer);

      // Thêm nút đóng
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '8px';
      closeBtn.style.right = '8px';
      closeBtn.style.border = 'none';
      closeBtn.style.background = 'transparent';
      closeBtn.style.fontSize = '18px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => {
        buttonContainer.remove();
      };
      buttonContainer.appendChild(closeBtn);

      // Render Google Sign-In button
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280,
      });
    }
  }, []);

  return {
    signInWithGoogle,
    isLoading,
    isReady,
    clientId: GOOGLE_CLIENT_ID,
  };
};

export default useGoogleAuth;
