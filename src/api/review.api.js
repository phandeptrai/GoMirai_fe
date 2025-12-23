import apiClient from './client';

export const reviewAPI = {
    /**
     * Tạo review mới
     * @param {Object} data - { bookingId: UUID, revieweeId: UUID, rating: number (1-5), comment: string }
     * @returns {Promise<ReviewResponse>}
     */
    createReview: async (data) => {
        const response = await apiClient.post('/api/review', data);
        return response.data;
    },

    /**
     * Lấy danh sách reviews của một người (driver hoặc customer)
     * @param {string} revieweeId - UUID của người được đánh giá
     * @param {number} page - Trang (default: 0)
     * @param {number} size - Số lượng (default: 10)
     * @returns {Promise<Page<ReviewResponse>>}
     */
    getReviews: async (revieweeId, page = 0, size = 10) => {
        const response = await apiClient.get(`/api/review/reviewee/${revieweeId}`, {
            params: { page, size }
        });
        return response.data;
    },

    /**
     * Lấy rating summary của một người
     * @param {string} revieweeId - UUID của người được đánh giá
     * @returns {Promise<{averageRating: number, totalReviews: number}>}
     */
    getRatingSummary: async (revieweeId) => {
        const response = await apiClient.get(`/api/review/reviewee/${revieweeId}/rating`);
        return response.data;
    },

    /**
     * Check xem booking đã có review chưa
     * @param {string} bookingId - UUID của booking
     * @returns {Promise<boolean>} true nếu đã review
     */
    checkReviewExists: async (bookingId) => {
        try {
            const response = await apiClient.get(`/api/review/booking/${bookingId}/exists`);
            return response.data.exists || false;
        } catch (error) {
            // Nếu API chưa có, return false
            console.warn('Check review exists failed:', error);
            return false;
        }
    },
};
