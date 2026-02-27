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
    }
};
