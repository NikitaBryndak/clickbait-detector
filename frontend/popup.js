document.addEventListener('DOMContentLoaded', checkApiStatus);

const API_URL = 'http://localhost:8000';

async function checkApiStatus() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');

    try {
        // Hits the health endpoint defined in your main.py
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();

        if (response.ok && data.status === 'healthy') {
            statusDot.className = 'status-dot healthy';
            statusText.textContent = 'System Online';
            statusText.style.color = '#2e7d32';
        } else {
            throw new Error(data.message || 'API Unhealthy');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        statusDot.className = 'status-dot error';
        statusText.textContent = 'System Offline';
        statusText.style.color = '#c62828';
    }
}