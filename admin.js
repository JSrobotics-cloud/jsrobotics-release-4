// admin.js

document.addEventListener('DOMContentLoaded', function () {
    // --- Configuration ---
    // TODO: Update to your actual backend URL
    const API_BASE_URL = 'https://jsrobotics-backend-y77j.onrender.com'; // Or http://localhost:3000 for local dev

    // --- DOM Elements ---
    const navButtons = document.querySelectorAll('.admin-nav button');
    const sections = document.querySelectorAll('.admin-section');
    const saveAllBtn = document.getElementById('save-all-btn');
    const notification = document.getElementById('notification');
    const addSectionBtn = document.getElementById('add-section-btn');
    const publishCourseBtn = document.getElementById('publish-course-btn');
    const addComponentBtn = document.getElementById('add-component-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // --- State Management ---
    // This would ideally come from your backend or localStorage after login
    // For now, we use sample data
    let existingCourses = [
        {
            _id: "course_001",
            title: "Introduction to Robotics",
            level: "Beginner",
            duration: "4 weeks",
            image: "https://placehold.co/400x250/1e40af/ffffff?text=Robotics+Course",
            description: "Learn the fundamentals of robotics, electronics, and programming with Arduino.",
            featured: true
        },
        {
            _id: "course_002",
            title: "Advanced Robotics with Raspberry Pi",
            level: "Advanced",
            duration: "6 weeks",
            image: "https://placehold.co/400x250/7c3aed/ffffff?text=Raspberry+Pi",
            description: "Build complex robots using Raspberry Pi, computer vision, and AI.",
            featured: true
        },
        {
            _id: "course_003",
            title: "Sensors & Actuators",
            level: "Intermediate",
            duration: "3 weeks",
            image: "https://placehold.co/400x250/059669/ffffff?text=Sensors+%26+Actuators",
            description: "Master various sensors and actuators used in robotics projects.",
            featured: false
        }
    ];

    let existingProjects = [
        {
            _id: "proj_001",
            title: "Autonomous Line Follower Robot",
            author: "Ali Rahmonov",
            likes: 24,
            image: "https://placehold.co/300x200/f59e0b/ffffff?text=Line+Follower",
            featured: true
        },
        {
            _id: "proj_002",
            title: "Smart Home Automation System",
            author: "Zarina Karimova",
            likes: 41,
            image: "https://placehold.co/300x200/ef4444/ffffff?text=Smart+Home",
            featured: true
        }
    ];

    let existingComponents = [
        {
            _id: "comp_001",
            name: "HC-SR04 Ultrasonic Sensor",
            category: "sensor",
            image: "https://placehold.co/150x150/10b981/ffffff?text=Ultrasonic",
            description: "Measures distance using ultrasonic waves. Range: 2cm to 400cm."
        }
    ];

    let existingProducts = [
        {
            _id: "prod_001",
            name: "Starter Robotics Kit",
            price: 89.99,
            image: "https://placehold.co/200x200/8b5cf6/ffffff?text=Starter+Kit",
            description: "Complete kit with Arduino, sensors, motors, and tutorial guide."
        }
    ];

    // --- Initialize ---
    initializeAdminPanel();
    setupNavigation();
    setupEventListeners();
    setupFileUploads();
    loadVisibilityData(); // Load data for the default active "visibility" section

    // --- Functions ---

    function initializeAdminPanel() {
        // Check if user is admin (this should be done securely in a real app)
        // For now, we assume the user is an admin if they can access this page
        // because you handle login in script.js

        // Set admin user name (this should come from your login process)
        const adminUserName = document.getElementById('admin-user-name');
        if (adminUserName) {
            // In a real app, get this from localStorage or a global variable set by script.js
            adminUserName.textContent = "Administrator"; // Placeholder
        }
    }

    function setupNavigation() {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sectionId = button.getAttribute('data-section');

                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Show active section
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === `${sectionId}-section`) {
                        section.classList.add('active');
                    }
                });

                // Load data for the selected section
                if (sectionId === 'visibility') {
                    loadVisibilityData();
                } else if (sectionId === 'components') {
                    loadComponents();
                } else if (sectionId === 'marketplace') {
                    loadProducts();
                }
                // 'course-builder' section doesn't need initial data loading
            });
        });
    }

    function setupEventListeners() {
        if (saveAllBtn) saveAllBtn.addEventListener('click', saveAllChanges);
        if (addSectionBtn) addSectionBtn.addEventListener('click', addSection);
        if (publishCourseBtn) publishCourseBtn.addEventListener('click', publishCourse);
        if (addComponentBtn) addComponentBtn.addEventListener('click', addComponent);
        if (addProductBtn) addProductBtn.addEventListener('click', addProduct);
        if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleLogout);
    }

    function handleLogout() {
        // This should trigger your logout logic in script.js
        // For example, by dispatching a custom event or calling a function
        // if (typeof logoutUser === 'function') logoutUser();
        // Or, redirect to logout endpoint if you have one
        // window.location.href = '/logout'; // If you have a server-side logout

        // For simulation, just reload the page or redirect to index
        alert('Logout functionality should be handled by your main script.js');
        // window.location.href = 'index.html'; // Uncomment for actual redirect
    }

    function setupFileUploads() {
        // Setup file upload areas
        setupFileDropArea('course-image-drop-area', 'new-course-image-file', 'course-image-upload-status', 'new-course-image-url');
        setupFileDropArea('component-image-drop-area', 'component-image-file', 'component-image-upload-status', 'component-image-url');
        setupFileDropArea('product-image-drop-area', 'product-image-file', 'product-image-upload-status', 'product-image-url');
    }

    function setupFileDropArea(dropAreaId, inputId, statusId, hiddenInputId) {
        const dropArea = document.getElementById(dropAreaId);
        const fileInput = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        const hiddenInput = document.getElementById(hiddenInputId);

        if (!dropArea || !fileInput || !status || !hiddenInput) {
            console.warn("setupFileDropArea: Missing elements for", dropAreaId);
            return;
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.style.borderColor = '#3b82f6';
            dropArea.style.backgroundColor = '#eff6ff';
        }

        function unhighlight() {
            dropArea.style.borderColor = '#cbd5e1';
            dropArea.style.backgroundColor = '';
        }

        dropArea.addEventListener('drop', handleDrop, false);
        fileInput.addEventListener('change', handleFiles);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFilesGeneric(files, status, hiddenInput);
        }

        function handleFiles() {
            const files = this.files;
            handleFilesGeneric(files, status, hiddenInput);
        }
    }

    // Generic file handler for uploads (simulated)
    function handleFilesGeneric(files, statusElement, hiddenInput) {
        if (files.length === 0) return;

        const file = files[0];
        statusElement.textContent = `Selected: ${file.name}`;
        statusElement.className = 'upload-status';

        // --- SIMULATED UPLOAD ---
        // In a real app, you would upload the file to Firebase here
        // and update the corresponding hidden input field with the URL
        /*
        const formData = new FormData();
        formData.append('file', file);
        
        fetch(`${API_BASE_URL}/api/upload`, { // You need to implement this endpoint
            method: 'POST',
            body: formData,
            // headers: { 'Authorization': `Bearer ${authToken}` } // Include auth if needed
        })
        .then(response => {
            if (!response.ok) throw new Error('Upload failed');
            return response.json();
        })
        .then(data => {
            statusElement.textContent = 'Upload successful!';
            statusElement.classList.remove('uploading');
            statusElement.classList.add('success');
            hiddenInput.value = data.url; // URL from backend
        })
        .catch(error => {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.classList.remove('uploading');
            statusElement.classList.add('error');
        });
        */

        // For simulation, we'll just show success and set a placeholder URL
        setTimeout(() => {
            statusElement.textContent = 'Upload successful (simulated)!';
            statusElement.classList.add('success');
            // Simulate a Firebase Storage URL
            hiddenInput.value = `https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/uploads%2F${encodeURIComponent(file.name)}?alt=media`;
            console.log(`Simulated upload URL for ${file.name}:`, hiddenInput.value);
        }, 1500);
    }

    // --- Data Loading and UI Population ---

    function loadVisibilityData() {
        loadFeaturedCourses();
        loadPopularProjects();
    }

    function loadFeaturedCourses() {
        const container = document.getElementById('featured-courses-list');
        if (!container) return;

        container.innerHTML = '';
        existingCourses.forEach(course => {
            const card = createVisibilityCard(course, 'course');
            container.appendChild(card);
        });
    }

    function loadPopularProjects() {
        const container = document.getElementById('popular-projects-list');
        if (!container) return;

        container.innerHTML = '';
        existingProjects.forEach(project => {
            const card = createVisibilityCard(project, 'project');
            container.appendChild(card);
        });
    }

    function loadComponents() {
        const container = document.getElementById('components-list');
        if (!container) return;

        container.innerHTML = '';
        existingComponents.forEach(component => {
            const card = createItemCard(component, 'component');
            container.appendChild(card);
        });
    }

    function loadProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;

        container.innerHTML = '';
        existingProducts.forEach(product => {
            const card = createItemCard(product, 'product');
            container.appendChild(card);
        });
    }

    function createVisibilityCard(item, type) {
        const card = document.createElement('div');
        card.className = 'item-card';

        const imageHtml = item.image ? `<img src="${item.image}" alt="${item.title || item.name}">` : '';
        const titleHtml = `<h3>${item.title || item.name}</h3>`;
        const descriptionHtml = item.description ? `<p>${item.description}</p>` : (item.author ? `<p>by ${item.author}</p>` : '');

        const isChecked = item.featured ? 'checked' : '';
        const actionsHtml = `
            <div class="item-actions">
                <div class="toggle-visibility">
                    <input type="checkbox" id="toggle-${type}-${item._id}" ${isChecked} data-id="${item._id}" data-type="${type}">
                    <label for="toggle-${type}-${item._id}">Featured</label>
                </div>
            </div>
        `;

        card.innerHTML = `
            ${imageHtml}
            <div class="item-card-content">
                ${titleHtml}
                ${descriptionHtml}
            </div>
            ${actionsHtml}
        `;

        // Add event listener for toggle
        const toggle = card.querySelector(`#toggle-${type}-${item._id}`);
        if (toggle) {
            toggle.addEventListener('change', function () {
                toggleFeatured(item._id, type, this.checked);
            });
        }

        return card;
    }

    function createItemCard(item, type) {
        // For Components and Products, show details
        const card = document.createElement('div');
        card.className = 'item-card';

        const imageHtml = item.image ? `<img src="${item.image}" alt="${item.name}">` : '';
        const titleHtml = `<h3>${item.name}</h3>`;

        let descriptionHtml = '';
        if (item.description) {
            descriptionHtml += `<p>${item.description}</p>`;
        }
        if (item.price !== undefined) {
            descriptionHtml += `<p><strong>Price:</strong> $${item.price.toFixed(2)}</p>`;
        }
        if (item.category) {
            descriptionHtml += `<p><strong>Category:</strong> ${item.category}</p>`;
        }

        // For now, no edit/delete actions are implemented in this simplified version
        const actionsHtml = `
            <div class="item-actions">
                <span class="item-id">ID: ${item._id}</span>
            </div>
        `;

        card.innerHTML = `
            ${imageHtml}
            <div class="item-card-content">
                ${titleHtml}
                ${descriptionHtml}
            </div>
            ${actionsHtml}
        `;

        return card;
    }

    function toggleFeatured(id, type, isFeatured) {
        console.log(`Toggling featured status for ${type} ID ${id} to ${isFeatured}`);
        // In a real app, you would send this update to your backend API
        if (type === 'course') {
            const course = existingCourses.find(c => c._id === id);
            if (course) course.featured = isFeatured;
        } else if (type === 'project') {
            const project = existingProjects.find(p => p._id === id);
            if (project) project.featured = isFeatured;
        }
        showNotification(`${type} visibility updated (simulated)`, 'success');
        // fetch(`${API_BASE_URL}/api/${type}s/${id}`, { method: 'PATCH', body: JSON.stringify({featured: isFeatured}), ... })
    }

    // --- Course Builder Functions ---

    function addSection() {
        const sectionsContainer = document.getElementById('sections-container');
        if (!sectionsContainer) return;

        const sectionCount = sectionsContainer.children.length + 1;

        const sectionItem = document.createElement('div');
        sectionItem.className = 'section-item';
        sectionItem.innerHTML = `
            <div class="form-group">
                <label>Section ${sectionCount} Title *</label>
                <input type="text" class="section-title" placeholder="New Section" required>
            </div>
            <div class="lessons-container">
                <div class="lesson-item">
                    <div class="lesson-header">
                        <h4>Lesson 1</h4>
                        <button class="btn btn-danger remove-lesson-btn">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Lesson Title *</label>
                        <input type="text" class="lesson-title" placeholder="New Lesson" required>
                    </div>
                    <div class="form-group">
                        <label>Lesson Video</label>
                        <div class="file-input-container lesson-video-drop-area">
                            <i class="fas fa-file-video"></i>
                            <p>Drag & drop a video here or click to browse</p>
                            <input type="file" class="lesson-video-file file-input" accept="video/*">
                        </div>
                        <div class="upload-status lesson-video-upload-status">No file selected</div>
                        <input type="hidden" class="lesson-video-url">
                    </div>
                    <div class="form-group">
                        <label>Lesson Content *</label>
                        <textarea class="lesson-content" placeholder="Lesson content..." required></textarea>
                    </div>
                </div>
            </div>
            <button class="btn btn-secondary add-lesson-btn">
                <i class="fas fa-plus"></i> Add Lesson
            </button>
        `;
        sectionsContainer.appendChild(sectionItem);

        // Setup event listeners for the new section
        const newLessonContainer = sectionItem.querySelector('.lessons-container');
        const addLessonBtn = sectionItem.querySelector('.add-lesson-btn');
        const removeLessonBtn = sectionItem.querySelector('.remove-lesson-btn');

        if (addLessonBtn) {
            addLessonBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addLessonToSection(newLessonContainer);
            });
        }

        if (removeLessonBtn) {
            removeLessonBtn.addEventListener('click', function () {
                if (newLessonContainer.children.length > 1) {
                    newLessonContainer.removeChild(this.closest('.lesson-item'));
                    renumberLessonsInSection(newLessonContainer);
                } else {
                    show