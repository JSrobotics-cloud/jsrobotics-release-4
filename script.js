// script.js
// Check for existing token on page load
function checkExistingSession() {
    const token = localStorage.getItem('token');
    if (token) {
        // In a real app, you'd verify the token with the backend
        // For now, we'll just assume the user is logged in
        // You might want to fetch user data from the backend here
        currentUser = {
            name: 'Previously Logged In User', // This should come from token verification
            points: 0 // This should come from actual user data
        };
        updateAuthUI();
    }
}

// Call it on page load
checkExistingSession();

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
    let currentUser = null;
    let language = 'en';

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

    // Login Form Submission
    // Login Form Submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token in localStorage (or sessionStorage)
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Login successful:', data);
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
    }
});

    // Signup Form Submission
    // Signup Form Submission
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: name, email, password }) // Assuming username is the same as name
        });

        const data = await response.json();

        if (response.ok) {
            // Store token in localStorage (or sessionStorage)
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Signup successful:', data);
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during signup');
    }
});

    // Google Auth Buttons
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

    
// Logout
logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthUI();
});

    // Update Auth UI based on user state
    function updateAuthUI() {
        if (currentUser) {
            // User is logged in
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            document.getElementById('user-name').textContent = currentUser.name;
            document.getElementById('user-points').textContent = `${currentUser.points} pts`;
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

    // Initialize auth UI
    updateAuthUI();
});