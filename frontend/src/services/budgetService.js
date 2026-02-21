/**
 * Budget Service
 * ===============
 * API service for budget generation and retrieval.
 * Uses the shared axios instance from authService for
 * automatic JWT token attachment.
 */

import api from './authService';

/**
 * Budget-related API calls.
 * All endpoints require authentication (token is auto-attached by axios interceptor).
 */
export const budgetService = {
    /**
     * Generate a new personalized budget using AI.
     * @param {Object} data - Optional overrides for income, expenses, location, risk, goals
     * @returns {Object} Generated budget with allocations and explanation
     */
    generateBudget: async (data = {}) => {
        const response = await api.post('/budget/generate', data);
        return response.data;
    },

    /**
     * Get the most recently generated budget for the current user.
     * @returns {Object} Latest budget data
     */
    getLatestBudget: async () => {
        const response = await api.get('/budget/latest');
        return response.data;
    },

    /**
     * Get all previously generated budgets for the current user.
     * @returns {Object} { budgets: [...], total: number }
     */
    getBudgetHistory: async () => {
        const response = await api.get('/budget/history');
        return response.data;
    },
};

export default budgetService;
