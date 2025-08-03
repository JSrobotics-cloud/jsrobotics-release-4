document.addEventListener('DOMContentLoaded', function() {

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

    let currentUser = null;
    let language = 'en';

    async function checkExistingSession() {
        const token = localStorage.getItem('token');
        if (token) {

            const BASE_URL = 'https://jsrobotics-release-4.vercel.app'; 

            try {

                const response = await fetch(`${BASE_URL}/api/profile/me`, { 
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}` 
                    }
                });

                if (!response.ok) {
                    throw new Error('Invalid token or failed to fetch user');
                }

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

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

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

    loginBtn.addEventListener('click', openLoginModal);
    signupBtn.addEventListener('click', openSignupModal);
    closeLoginModal.addEventListener('click', closeModals);
    closeSignupModal.addEventListener('click', closeModals);
    switchToSignup.addEventListener('click', openSignupModal);
    switchToLogin.addEventListener('click', openLoginModal);

    langToggle.addEventListener('click', () => {
        language = language === 'en' ? 'uz' : 'en';
        langToggle.textContent = language === 'en' ? 'UZ' : 'EN';
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const BASE_URL = 'https://jsrobotics-release-4.vercel.app'; 

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

            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {

                data = { error: await response.text() || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

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

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        const BASE_URL = 'https://jsrobotics-release-4.vercel.app'; 

        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: name, email, password }) 
            });

            let data;
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {

                data = { error: await response.text() || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

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

    googleLoginBtn.addEventListener('click', async function() {
    const tokenId = await handleGoogleSignIn(); 
    const BASE_URL = 'https://jsrobotics-release-4.vercel.app';

    try {
        const res = await fetch(`${BASE_URL}/api/auth/googleSign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem('token', data.token);
        currentUser = data.user;
        updateAuthUI();
        closeModals();
    } catch (err) {
        alert('Google Sign-In Failed: ' + err.message);
    }
});

    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('token');
        currentUser = null; 
        updateAuthUI();
    });

    function updateAuthUI() {
        if (currentUser) {

            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');

            const nameElement = document.getElementById('user-name');
            const pointsElement = document.getElementById('user-points');
            if (nameElement) nameElement.textContent = currentUser.name || currentUser.username || 'User';
            if (pointsElement) pointsElement.textContent = `${currentUser.points || 0} pts`;
        } else {

            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            closeModals();
        }
        if (e.target === signupModal) {
            closeModals();
        }
    });

    updateAuthUI();
});



window.handleGoogleSignIn = async function (response) {
    const tokenId = response.credential;

    const BASE_URL = 'https://jsrobotics-release-4.vercel.app';

    try {
        const res = await fetch(`${BASE_URL}/api/auth/googleSign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        localStorage.setItem('token', data.token);
        currentUser = data.user;
        updateAuthUI();
        closeModals();
        console.log('Google Sign-In successful:', data);
    } catch (err) {
        console.error('Google Sign-In Failed:', err);
        alert('Google Sign-In Failed: ' + err.message);
    }
}

