import axios from 'axios';

const API_URL = 'http://localhost:8000/reports';

export const reportService = {
    downloadReport: async (type) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/generate/${type}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob' // Important for binary files
        });
        
        // Create a download link for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `FinanceAdvisor_${type}_Report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
