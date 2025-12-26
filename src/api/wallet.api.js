import client from './client';

export const walletApi = {
    getWallet: async () => {
        const response = await client.get('/api/payment');
        return response.data;
    },

    topUp: async (data) => {
        const response = await client.post('/api/payment/top-up', data);
        return response.data;
    },

    getMyTransactions: async (page = 0, size = 10) => {
        const response = await client.get('/api/payment/transactions', {
            params: { page, size }
        });
        return response.data;
    }
};
