let currentUser = null;
let language = 'en';

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const nameElement = document.getElementById('user-name');
    const pointsElement = document.getElementById('user-points');

    if (currentUser) {
        authButtons?.classList.add('hidden');
        userMenu?.classList.remove('hidden');

        if (nameElement) nameElement.textContent = currentUser.name || currentUser.username || 'User';
        if (pointsElement) pointsElement.textContent = `${currentUser.points || 0} pts`;
    } else {
        authButtons?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
    }
}

function closeModals() {
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    loginModal?.classList.add('hidden');
    signupModal?.classList.add('hidden');
}

window.handleGoogleSignIn = async (response) => {
    const tokenId = response.credential;
    const BASE_URL = 'https://jsrobotics-release-4.vercel.app';

    try {
        const res = await fetch(`${BASE_URL}/api/auth/googleSign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Google login success:', data);
        } else {
            throw new Error(data.error || 'Google login failed');
        }
    } catch (error) {
        console.error('Google Sign-In Failed:', error);
        alert('Google Sign-In Failed: ' + error.message);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const closeSignupModal = document.getElementById('close-signup-modal');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const langToggle = document.getElementById('lang-toggle');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const BASE_URL = 'https://jsrobotics-release-4.vercel.app';

    async function checkExistingSession() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${BASE_URL}/api/profile/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Invalid token or failed to fetch user');
                const userData = await response.json();
                currentUser = userData;
                updateAuthUI();
                console.log('Session restored for:', currentUser);
            } catch (error) {
                console.error('Session check failed:', error);
                localStorage.removeItem('token');
                currentUser = null;
            }
        }
    }

    checkExistingSession();

    hamburger?.addEventListener('click', () => {
        navMenu?.classList.toggle('active');
    });

    loginBtn?.addEventListener('click', () => {
        loginModal?.classList.remove('hidden');
        signupModal?.classList.add('hidden');
    });

    signupBtn?.addEventListener('click', () => {
        signupModal?.classList.remove('hidden');
        loginModal?.classList.add('hidden');
    });

    closeLoginModal?.addEventListener('click', closeModals);
    closeSignupModal?.addEventListener('click', closeModals);
    switchToSignup?.addEventListener('click', () => {
        signupModal?.classList.remove('hidden');
        loginModal?.classList.add('hidden');
    });
    switchToLogin?.addEventListener('click', () => {
        loginModal?.classList.remove('hidden');
        signupModal?.classList.add('hidden');
    });

    langToggle?.addEventListener('click', () => {
        language = language === 'en' ? 'uz' : 'en';
        langToggle.textContent = language === 'en' ? 'UZ' : 'EN';
    });

    loginForm?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value;
        const password = document.getElementById('login-password')?.value;

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { error: await response.text() || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);

            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Login successful:', data);
        } catch (error) {
            console.error('Login Error:', error);
            alert('Login failed: ' + (error.message || 'An unknown error occurred'));
        }
    });

    signupForm?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('signup-name')?.value;
        const email = document.getElementById('signup-email')?.value;
        const password = document.getElementById('signup-password')?.value;

        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, email, password })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { error: await response.text() || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);

            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeModals();
            console.log('Signup successful:', data);
        } catch (error) {
            console.error('Signup Error:', error);
            alert('Signup failed: ' + (error.message || 'An unknown error occurred'));
        }
    });

    logoutBtn?.addEventListener('click', function () {
        localStorage.removeItem('token');
        currentUser = null;
        updateAuthUI();
    });

    window.addEventListener('click', function (e) {
        if (e.target === loginModal || e.target === signupModal) {
            closeModals();
        }
    });

    updateAuthUI();
});
