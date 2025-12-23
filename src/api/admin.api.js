import apiClient from './client';

export const adminAPI = {
    // ==================== DRIVER MANAGEMENT ====================
    /**
     * Get all drivers or filter by status (with user info)
     * @param {string} status - Optional: PENDING_VERIFICATION, ACTIVE, BANNED, REJECTED
     * @returns {Promise<DriverProfileResponse[]>}
     */
    getDrivers: async (status = null) => {
        const params = status ? { status } : {};
        const response = await apiClient.get('/api/drivers', { params });
        const drivers = response.data || [];

        // Fetch user info for each driver
        try {
            const driversWithUserInfo = await Promise.all(
                drivers.map(async (driver) => {
                    try {
                        const userResponse = await apiClient.get(`/api/users/${driver.userId}`);
                        return {
                            ...driver,
                            userInfo: userResponse.data
                        };
                    } catch (error) {
                        console.error(`Failed to fetch user info for driver ${driver.driverId}:`, error);
                        return driver;
                    }
                })
            );
            return driversWithUserInfo;
        } catch (error) {
            console.error('Error fetching user info:', error);
            return drivers;
        }
    },

    /**
     * Approve a driver application
     * @param {string} driverId
     * @returns {Promise<DriverProfileResponse>}
     */
    approveDriver: async (driverId) => {
        const response = await apiClient.patch(`/api/drivers/${driverId}/approve`);
        return response.data;
    },

    /**
     * Reject a driver application
     * @param {string} driverId
     * @returns {Promise<DriverProfileResponse>}
     */
    rejectDriver: async (driverId) => {
        const response = await apiClient.patch(`/api/drivers/${driverId}/reject`);
        return response.data;
    },

    /**
     * Suspend/ban a driver
     * @param {string} driverId
     * @returns {Promise<DriverProfileResponse>}
     */
    suspendDriver: async (driverId) => {
        const response = await apiClient.patch(`/api/drivers/${driverId}/suspend`);
        return response.data;
    },

    /**
     * Unsuspend/unban a driver
     * @param {string} driverId
     * @returns {Promise<DriverProfileResponse>}
     */
    unsuspendDriver: async (driverId) => {
        const response = await apiClient.patch(`/api/drivers/${driverId}/unsuspend`);
        return response.data;
    },

    // ==================== USER MANAGEMENT ====================
    /**
     * Get all user profiles
     * @returns {Promise<UserProfileResponse[]>}
     */
    getUsers: async () => {
        const response = await apiClient.get('/api/users');
        return response.data || [];
    },

    // ==================== PRICING MANAGEMENT ====================
    /**
     * Get all pricing rules
     * @returns {Promise<PricingRule[]>}
     */
    getPricingRules: async () => {
        const response = await apiClient.get('/api/pricing/rules');
        return response.data || [];
    },

    /**
     * Create a new pricing rule
     * @param {Object} rule - { vehicleType, baseFare, perKmRate, perMinuteRate, surgeMultiplier, region, active }
     * @returns {Promise<PricingRule>}
     */
    createPricingRule: async (rule) => {
        const response = await apiClient.post('/api/pricing/rules', rule);
        return response.data;
    },

    /**
     * Update a pricing rule
     * @param {string} ruleId
     * @param {Object} rule
     * @returns {Promise<PricingRule>}
     */
    updatePricingRule: async (ruleId, rule) => {
        const response = await apiClient.put(`/api/pricing/rules/${ruleId}`, rule);
        return response.data;
    },
};
