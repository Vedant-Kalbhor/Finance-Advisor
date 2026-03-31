import api from './authService';

export const analyticsService = {
    getAnomalies: async () => {
        const response = await api.get('/analytics/anomalies');
        return response.data;
    },
    getMonteCarlo: async (goalId) => {
        const response = await api.get(`/analytics/monte-carlo/${goalId}`);
        return response.data;
    },
    getAllMonteCarlo: async () => {
        const response = await api.get('/analytics/monte-carlo-all');
        return response.data;
    },
};
