import client from './client';

export const walletApi = {
    getWallet: async () => {
        const response = await client.get('/api/payment');
        return response.data;
    },

    /**
     * Nạp tiền trực tiếp vào ví (cách cũ - không qua VNPay)
     * @deprecated Sử dụng createVNPayPayment thay thế
     */
    topUp: async (data) => {
        const response = await client.post('/api/payment/top-up', data);
        return response.data;
    },

    /**
     * Tạo thanh toán VNPay để nạp tiền vào ví.
     * 
     * Flow:
     * 1. Gọi API này → nhận paymentUrl
     * 2. Redirect user đến paymentUrl (trang VNPay)
     * 3. User thanh toán trên VNPay
     * 4. VNPay redirect về /payment/vnpay/result
     * 
     * @param {Object} data - { amount: number, orderInfo?: string, bankCode?: string }
     * @returns {Promise<{ paymentUrl: string, transactionRef: string, message: string }>}
     */
    createVNPayPayment: async (data) => {
        const response = await client.post('/api/payment/vnpay/create', data);
        return response.data;
    },

    /**
     * Kiểm tra kết quả thanh toán VNPay
     * @param {Object} params - Query params từ VNPay return URL
     */
    checkVNPayResult: async (params) => {
        const response = await client.get('/api/payment/vnpay/return', { params });
        return response.data;
    },

    getMyTransactions: async (page = 0, size = 10) => {
        const response = await client.get('/api/payment/transactions', {
            params: { page, size }
        });
        return response.data;
    }
};

