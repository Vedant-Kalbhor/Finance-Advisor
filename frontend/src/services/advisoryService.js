import api from './authService';

export const advisoryService = {
    getGoals: async () => {
        const response = await api.get('/advisory/goals');
        return response.data;
    },
    createGoal: async (goalData) => {
        const response = await api.post('/advisory/goals', goalData);
        return response.data;
    },
    deleteGoal: async (id) => {
        const response = await api.delete(`/advisory/goals/${id}`);
        return response.data;
    },
    getRecommendations: async () => {
        const response = await api.get('/advisory/recommendations');
        return response.data;
    }
};

export const taxService = {
    getEstimate: async () => {
        const response = await api.get('/tax/estimate');
        return response.data;
    }
};
