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


// Function to add/remove Admin Panel link based on user role
function updateNavigationForAdmin(isAdmin) {
    // Find the existing "Project Sharing" nav item to insert after
    const projectSharingLink = document.querySelector('.nav-menu a[href="projects.html"]');
    const navMenu = document.querySelector('.nav-menu');

    // Check if Admin Panel link already exists
    const existingAdminLink = document.querySelector('.nav-menu a[href="adminpanel.html"]');

    if (isAdmin && !existingAdminLink) {
        // User is an admin and link doesn't exist, add it
        console.log("Adding Admin Panel link to navigation.");
        if (projectSharingLink) {
            const adminListItem = document.createElement('li');
            adminListItem.className = 'nav-item';
            adminListItem.innerHTML = '<a href="adminpanel.html" class="nav-link">Admin Panel</a>';
            // Insert after Project Sharing
            projectSharingLink.parentElement.after(adminListItem);
        } else {
            // Fallback: append to end if Project Sharing not found
            console.warn("Project Sharing link not found, appending Admin Panel to end.");
            const adminListItem = document.createElement('li');
            adminListItem.className = 'nav-item';
            adminListItem.innerHTML = '<a href="adminpanel.html" class="nav-link">Admin Panel</a>';
            navMenu.appendChild(adminListItem);
        }
    } else if (!isAdmin && existingAdminLink) {
        // User is not an admin but link exists, remove it
        console.log("Removing Admin Panel link from navigation.");
        const adminListItem = existingAdminLink.parentElement;
        if (adminListItem && navMenu) {
            navMenu.removeChild(adminListItem);
        }
    } else {
        // console.log(`No navigation update needed. isAdmin: ${isAdmin}, linkExists: ${!!existingAdminLink}`);
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

// Check for existing token on page load and verify it
async function checkExistingSession() {
    const token = localStorage.getItem('token');
    const userDataJson = localStorage.getItem('userData'); // Get stored user data

    if (token && userDataJson) {
        try {
            // Parse stored user data (including isAdmin)
            const userData = JSON.parse(userDataJson);
            currentUser = userData;

            // --- UPDATE NAVIGATION BASED ON STORED DATA ---
            updateNavigationForAdmin(userData.isAdmin);

            // Optionally, verify the token with the backend for better security
            // (Implementation depends on your backend's /api/auth/verify or similar endpoint)
            /*
            const BASE_URL = 'https://jsrobotics-backend-y77j.onrender.com'; // <--- UPDATE THIS TO YOUR ACTUAL DEPLOYED BACKEND URL
            const response = await fetch(`${BASE_URL}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Invalid token');

            const data = await response.json();
            currentUser = data.user;
            */

            updateAuthUI();
        } catch (error) {
            console.error('Session check failed:', error);
            // Token or user data invalid, remove them
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            currentUser = null;
            // Ensure admin link is removed if data was corrupted
            updateNavigationForAdmin(false);
        }
    } else if (token) {
        // Fallback if userData wasn't stored correctly
        console.warn("Token found but no userData, removing token.");
        localStorage.removeItem('token');
        updateNavigationForAdmin(false); // Ensure no admin link
    }
    // If no token, ensure no admin link is shown
    if (!token) {
        updateNavigationForAdmin(false);
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


// Login Form Submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // --- CHANGE THIS BASE_URL TO MATCH YOUR ACTUAL BACKEND ---
    // const BASE_URL = 'http://localhost:3000'; // <--- For local development
    const BASE_URL = 'https://jsrobotics-release-4.vercel.app/'; // <--- UPDATE THIS TO YOUR ACTUAL DEPLOYED BACKEND URL

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

        // --- ADMIN CHECK ---
        // Define your list of admin emails
        // TODO: In a more secure setup, the backend would determine this and send it in the response
        const ADMIN_EMAILS = ['itspecialist2200@gmail.com', 'genz101.uz@gmail.com']; // Add your actual admin emails here
        const isAdmin = ADMIN_EMAILS.includes(data.user.email);

        // Success - Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify({ ...data.user, isAdmin: isAdmin })); // Store isAdmin status

        // Update global currentUser variable
        currentUser = data.user;
        currentUser.isAdmin = isAdmin; // Attach isAdmin to currentUser object for immediate use

        // --- UPDATE NAVIGATION ---
        updateNavigationForAdmin(isAdmin);

        // Update UI
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

    // Logout
logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData'); // Remove stored user data including isAdmin
    currentUser = null;
    // Ensure admin link is removed
    updateNavigationForAdmin(false);
    updateAuthUI();
});

    window.addEventListener('click', function (e) {
        if (e.target === loginModal || e.target === signupModal) {
            closeModals();
        }
    });

    updateAuthUI();
});
