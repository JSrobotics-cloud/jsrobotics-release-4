// script.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const closeSignupModal = document.getElementById('close-signup-modal');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const langToggle = document.getElementById('lang-toggle');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleSignupBtn = document.getElementById('google-signup-btn');

    // State management
    // Move currentUser declaration here to be global within the script scope
    let currentUser = null;
    let language = 'en';

    // --- FIXED: Check for existing token on page load and verify it ---
    async function checkExistingSession() {
        const token = localStorage.getItem('token');
        if (token) {
            // You need to update this BASE_URL to point to your actual backend server
            // If running locally, it might be 'https://jsrobotics-release-4.vercel.app/'
            // If deployed, it should be the URL of your backend (e.g., Render, Railway, etc.)
            const BASE_URL = 'https://jsrobotics-release-4.vercel.app/'; // <--- UPDATE THIS TO YOUR BACKEND URL ---

            try {
                // Verify token with backend
                const response = await fetch(`${BASE_URL}/api/profile/me`, { // Example endpoint, adjust if needed
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}` // Send token in Authorization header
                    }
                });

                if (!response.ok) {
                    throw new Error('Invalid token or failed to fetch user');
                }

                const userData = await response.json();
                currentUser = userData; // Assuming the response contains user data
                updateAuthUI();
                console.log('Session restored for:', currentUser);
            } catch (error) {
                console.error('Session check failed:', error);
                // Token invalid or verification failed, remove it
                localStorage.removeItem('token');
                currentUser = null; // Ensure currentUser is null on failure
            }
        }
    }

    // Call it on page load
    checkExistingSession();
    // --- END OF FIX ---

    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Auth Modal Functions
    function openLoginModal() {
        loginModal.classList.remove('hidden');
        signupModal.classList.add('hidden');
    }

    function openSignupModal() {
        signupModal.classList.remove('hidden');
        loginModal.classList.add('hidden');
    }

    function closeModals() {
        loginModal.classList.add('hidden');
        signupModal.classList.add('hidden');
    }

    // Auth Event Listeners
    loginBtn.addEventListener('click', openLoginModal);
    signupBtn.addEventListener('click', openSignupModal);
    closeLoginModal.addEventListener('click', closeModals);
    closeSignupModal.addEventListener('click', closeModals);
    switchToSignup.addEventListener('click', openSignupModal);
    switchToLogin.addEventListener('click', openLoginModal);

    // Language Toggle
    langToggle.addEventListener('click', () => {
        language = language === 'en' ? 'uz' : 'en';
        langToggle.textContent = language === 'en' ? 'UZ' : 'EN';
    });

    // --- FIXED: Login Form Submission ---
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // You need to update this BASE_URL to point to your actual backend server
        const BASE_URL = 'https://jsrobotics-release-4.vercel.app/'; // <--- UPDATE THIS TO YOUR BACKEND URL ---

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            let data;
            const contentType = response.headers.get("content-type");

            // Check if the response is JSON
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // If not JSON, get it as text (e.g., HTML error page)
                data = { error: await response.text() || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Success - Store token and update UI
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Login successful:', data);
            // Optional: User feedback
            // alert('Login successful!');

        } catch (error) {
            console.error('Login Error:', error);
            // Show user-friendly error message
            alert('Login failed: ' + (error.message || 'An unknown error occurred'));
        }
    });
    // --- END OF FIX ---

    // --- FIXED: Signup Form Submission ---
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // You need to update this BASE_URL to point to your actual backend server
        const BASE_URL = 'https://jsrobotics-release-4.vercel.app/'; // <--- UPDATE THIS TO YOUR BACKEND URL ---

        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: name, email, password }) // Ensure backend expects 'username'
            });

            let data;
            const contentType = response.headers.get("content-type");

            // Check if the response is JSON
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // If not JSON, get it as text (e.g., HTML error page)
                data = { error: await response.text() || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Success - Store token and update UI
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Signup successful:', data);
            // Optional: User feedback
            // alert('Signup successful!');

        } catch (error) {
            console.error('Signup Error:', error);
            // Show user-friendly error message
            alert('Signup failed: ' + (error.message || 'An unknown error occurred'));
        }
    });
    // --- END OF FIX ---

    // Google Auth Buttons (Simulated)
    googleLoginBtn.addEventListener('click', function() {
        // Simulate Google login
        currentUser = {
            id: 2,
            name: 'Google User',
            email: 'google@example.com',
            points: 500,
            badges: ['Social Login']
        };

        updateAuthUI();
        closeModals();
    });

    googleSignupBtn.addEventListener('click', function() {
        // Simulate Google signup
        currentUser = {
            id: 3,
            name: 'Google User',
            email: 'google@example.com',
            points: 500,
            badges: ['Social Login']
        };

        updateAuthUI();
        closeModals();
    });


    // --- FIXED: Logout ---
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('token');
        currentUser = null; // Explicitly set to null
        updateAuthUI();
    });
    // --- END OF FIX ---

    // Update Auth UI based on user state
    function updateAuthUI() {
        if (currentUser) {
            // User is logged in
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            // Ensure elements exist before updating
            const nameElement = document.getElementById('user-name');
            const pointsElement = document.getElementById('user-points');
            if (nameElement) nameElement.textContent = currentUser.name || currentUser.username || 'User';
            if (pointsElement) pointsElement.textContent = `${currentUser.points || 0} pts`;
        } else {
            // User is not logged in
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            closeModals();
        }
        if (e.target === signupModal) {
            closeModals();
        }
    });

    // Initialize auth UI (will be called again after session check)
    updateAuthUI();
});