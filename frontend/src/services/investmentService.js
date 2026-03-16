import api from './authService';

export const investmentService = {
    getInvestments: async () => {
        const response = await api.get('/investments/');
        return response.data;
    },
    createInvestment: async (investmentData) => {
        const response = await api.post('/investments/', investmentData);
        return response.data;
    },
    updateInvestment: async (id, investmentData) => {
        const response = await api.put(`/investments/${id}`, investmentData);
        return response.data;
    },
    deleteInvestment: async (id) => {
        const response = await api.delete(`/investments/${id}`);
        return response.data;
    },
    getBrokerConfig: async () => {
        const response = await api.get('/investments/broker');
        return response.data;
    },
    updateBrokerConfig: async (configData) => {
        const response = await api.put('/investments/broker', configData);
        return response.data;
    },
    getAIRecommendations: async (riskLevel, investmentType) => {
        const response = await api.post('/investments/ai-recommendations', {
            risk_level: riskLevel,
            investment_type: investmentType
        });
        return response.data.recommendations;
    },
    getZerodhaLoginUrl: async () => {
        const response = await api.get('/zerodha/login');
        return response.data;
    },
    connectZerodha: async (requestToken) => {
        const response = await api.post(`/zerodha/callback?request_token=${encodeURIComponent(requestToken)}`);
        return response.data;
    },
    syncZerodhaPortfolio: async () => {
        const response = await api.post('/zerodha/sync-portfolio');
        return response.data;
    },
    disconnectZerodha: async () => {
        const response = await api.post('/zerodha/disconnect');
        return response.data;
    }
};
