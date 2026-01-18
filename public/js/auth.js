// Auth Logic
const API_URL = '/api/auth';

// Toggle Auth Tabs
// Toggle Auth Tabs
function toggleAuth(type) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');

    // Reset styles (handled by CSS now, just toggling class)
    if (type === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    }

    // Clean up inline styles if any remaining from previous logic
    loginTab.style = '';
    registerTab.style = '';
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Save Token
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result));

            // Redirect to separate dashboard page
            window.location.href = '/dashboard.html';
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login Error:', error);
        alert('An error occurred during login.');
    }
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result));
            window.location.href = '/dashboard.html';
        } else {
            alert(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Register Error:', error);
        alert('An error occurred during registration.');
    }
});

// Helper for authenticated requests
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return null;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Token expired or invalid
        logout();
        return null;
    }

    return response;
}
