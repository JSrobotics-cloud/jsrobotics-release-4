// admin.js

document.addEventListener('DOMContentLoaded', function () {
    // --- Configuration ---
    // TODO: Update to your actual backend URL
    const API_BASE_URL = 'https://jsrobotics-release-4.vercel.app'; // Or http://localhost:3000 for local dev

    // --- DOM Elements ---
    const navButtons = document.querySelectorAll('.admin-nav button');
    const sections = document.querySelectorAll('.admin-section');
    // const saveAllBtn = document.getElementById('save-all-btn'); // Removed as per simplification
    const notification = document.getElementById('notification');
    const addSectionBtn = document.getElementById('add-section-btn');
    const publishCourseBtn = document.getElementById('publish-course-btn');
    const addComponentBtn = document.getElementById('add-component-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    // const adminLogoutBtn = document.getElementById('admin-logout-btn'); // Not needed, handled by script.js

    // --- State Management (Simulated Data) ---
    // In a real app, this data would be fetched from your backend API
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
    setupNavigation();
    setupEventListeners();
    setupFileUploads();
    loadVisibilityData(); // Load data for the default active "visibility" section

    // --- Functions ---

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
        // if (saveAllBtn) saveAllBtn.addEventListener('click', saveAllChanges); // Removed
        if (addSectionBtn) addSectionBtn.addEventListener('click', addSection);
        if (publishCourseBtn) publishCourseBtn.addEventListener('click', publishCourse);
        if (addComponentBtn) addComponentBtn.addEventListener('click', addComponent);
        if (addProductBtn) addProductBtn.addEventListener('click', addProduct);
        // Logout is handled by script.js, no listener needed here
    }

    // --- File Uploads ---
    function setupFileUploads() {
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

        fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            // headers: { 'Authorization': `Bearer ${authToken}` }
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
        // Use the new, smaller card class
        const card = document.createElement('div');
        card.className = 'item-card-small'; 

        const imageHtml = item.image ? `<img src="${item.image}" alt="${item.title || item.name}">` : '';
        const titleHtml = `<h3>${item.title || item.name}</h3>`;
        // Keep description short or omit for small cards if needed
        const descriptionHtml = item.description ? `<p>${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</p>` : (item.author ? `<p>by ${item.author}</p>` : '');

        const isChecked = item.featured ? 'checked' : '';
        // Use the new, smaller actions class
        const actionsHtml = `
            <div class="item-actions-small"> 
                <span>Featured</span> <!-- Simple text label -->
                <div class="toggle-visibility-small"> 
                    <input type="checkbox" id="toggle-${type}-${item._id}" ${isChecked} data-id="${item._id}" data-type="${type}">
                    <label for="toggle-${type}-${item._id}"></label> <!-- Label for checkbox -->
                </div>
            </div>
        `;

        card.innerHTML = `
            ${imageHtml}
            <div class="item-card-content-small"> 
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
        // For Components and Products, use the standard larger card
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

        // Simple actions for display
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
        // Example API call:
        // fetch(`${API_BASE_URL}/api/${type}s/${id}`, { 
        //     method: 'PATCH', 
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({featured: isFeatured})
        // })
    }

    // --- Course Builder Functions (Largely unchanged, just removed handleLogout call) ---
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
                    showNotification('Cannot remove the last lesson in a section', 'error');
                }
            });
        }

        const videoDropArea = sectionItem.querySelector('.lesson-video-drop-area');
        const videoFileInput = sectionItem.querySelector('.lesson-video-file');
        const videoStatus = sectionItem.querySelector('.lesson-video-upload-status');
        const videoHiddenInput = sectionItem.querySelector('.lesson-video-url');

        if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
            setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
        }
    }

    function addLessonToSection(lessonsContainer) {
        const lessonCount = lessonsContainer.children.length + 1;
        const lessonItem = document.createElement('div');
        lessonItem.className = 'lesson-item';
        lessonItem.innerHTML = `
            <div class="lesson-header">
                <h4>Lesson ${lessonCount}</h4>
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
        `;
        lessonsContainer.appendChild(lessonItem);

        const removeBtn = lessonItem.querySelector('.remove-lesson-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                lessonsContainer.removeChild(lessonItem);
                renumberLessonsInSection(lessonsContainer);
            });
        }

        const videoDropArea = lessonItem.querySelector('.lesson-video-drop-area');
        const videoFileInput = lessonItem.querySelector('.lesson-video-file');
        const videoStatus = lessonItem.querySelector('.lesson-video-upload-status');
        const videoHiddenInput = lessonItem.querySelector('.lesson-video-url');

        if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
            setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
        }
    }

    function setupFileDropAreaForLesson(dropArea, fileInput, statusElement, hiddenInput) {
        // ... (same as before) ...
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
            handleFilesGeneric(files, statusElement, hiddenInput);
        }

        function handleFiles() {
            const files = this.files;
            handleFilesGeneric(files, statusElement, hiddenInput);
        }
    }

    function renumberLessonsInSection(lessonsContainer) {
        const lessons = lessonsContainer.querySelectorAll('.lesson-item');
        lessons.forEach((lesson, index) => {
            const header = lesson.querySelector('.lesson-header h4');
            if (header) header.textContent = `Lesson ${index + 1}`;
        });
    }

    function publishCourse() {
        const title = document.getElementById('new-course-title')?.value;
        const courseId = document.getElementById('new-course-id')?.value;
        const level = document.getElementById('new-course-level')?.value;
        const duration = document.getElementById('new-course-duration')?.value;
        const description = document.getElementById('new-course-description')?.value;
        const imageUrl = document.getElementById('new-course-image-url')?.value;

        if (!title || !courseId || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const sectionsData = [];
        const sectionItems = document.querySelectorAll('.section-item');

        let isValid = true;
        sectionItems.forEach((sectionItem, sectionIndex) => {
            const sectionTitle = sectionItem.querySelector('.section-title')?.value;
            if (!sectionTitle) {
                showNotification(`Please enter a title for Section ${sectionIndex + 1}`, 'error');
                isValid = false;
                return;
            }

            const lessons = [];
            const lessonItems = sectionItem.querySelectorAll('.lesson-item');
            lessonItems.forEach((lessonItem, lessonIndex) => {
                const lessonTitle = lessonItem.querySelector('.lesson-title')?.value;
                const lessonContent = lessonItem.querySelector('.lesson-content')?.value;
                const lessonVideoUrl = lessonItem.querySelector('.lesson-video-url')?.value;

                if (!lessonTitle || !lessonContent) {
                    showNotification(`Please fill in all required fields for Lesson ${lessonIndex + 1} in Section ${sectionIndex + 1}`, 'error');
                    isValid = false;
                    return;
                }

                lessons.push({
                    title: lessonTitle,
                    content: lessonContent,
                    videoUrl: lessonVideoUrl || null
                });
            });

            if (!isValid) return;

            sectionsData.push({
                title: sectionTitle,
                lessons: lessons
            });
        });

        if (!isValid) return;

        if (sectionsData.length === 0) {
            showNotification('Please add at least one section with lessons', 'error');
            return;
        }

        const newCourse = {
            courseId: courseId,
            title: title,
            level: level,
            duration: duration,
            description: description,
            image: imageUrl,
            sections: sectionsData,
            featured: false
        };

        // --- SIMULATED PUBLISH ---
        console.log('Publishing course (simulated):', newCourse);
        // Example API call:
        /*
        fetch(`${API_BASE_URL}/api/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse)
        })
        .then(response => {
             if (!response.ok) throw new Error('Failed to publish course');
             return response.json();
        })
        .then(data => {
             showNotification(`Course "${title}" published successfully!`, 'success');
             resetCourseBuilder();
        })
        .catch(error => {
             console.error('Error publishing course:', error);
             showNotification(`Error publishing course: ${error.message}`, 'error');
        });
        */
        showNotification(`Course "${title}" published successfully! (Simulated)`, 'success');
        console.log("Published Course Data:", newCourse);
        resetCourseBuilder();
    }

    function resetCourseBuilder() {
        const fields = [
            'new-course-title', 'new-course-id', 'new-course-description',
            'new-course-image-url'
        ];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const statusFields = [
            'course-image-upload-status'
        ];
        statusFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = 'No file selected';
                el.className = 'upload-status';
            }
        });

        const sectionsContainer = document.getElementById('sections-container');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = `
                <div class="section-item">
                    <div class="form-group">
                        <label>Section Title *</label>
                        <input type="text" class="section-title" placeholder="Getting Started" required>
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
                                <input type="text" class="lesson-title" placeholder="Introduction to Arduino" required>
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
                                <textarea class="lesson-content" placeholder="In this lesson, you will learn..." required></textarea>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-secondary add-lesson-btn">
                        <i class="fas fa-plus"></i> Add Lesson
                    </button>
                </div>
            `;

            const firstSection = sectionsContainer.querySelector('.section-item');
            if (firstSection) {
                const addLessonBtn = firstSection.querySelector('.add-lesson-btn');
                const removeLessonBtn = firstSection.querySelector('.remove-lesson-btn');
                const lessonsContainer = firstSection.querySelector('.lessons-container');

                if (addLessonBtn && lessonsContainer) {
                    addLessonBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        addLessonToSection(lessonsContainer);
                    });
                }

                if (removeLessonBtn && lessonsContainer) {
                    removeLessonBtn.addEventListener('click', function () {
                        if (lessonsContainer.children.length > 1) {
                            lessonsContainer.removeChild(this.closest('.lesson-item'));
                            renumberLessonsInSection(lessonsContainer);
                        } else {
                            showNotification('Cannot remove the last lesson in a section', 'error');
                        }
                    });
                }

                const videoDropArea = firstSection.querySelector('.lesson-video-drop-area');
                const videoFileInput = firstSection.querySelector('.lesson-video-file');
                const videoStatus = firstSection.querySelector('.lesson-video-upload-status');
                const videoHiddenInput = firstSection.querySelector('.lesson-video-url');

                if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
                    setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
                }
            }
        }
    }

    // --- Components & Products ---
    function addComponent() {
        const name = document.getElementById('component-name')?.value;
        const category = document.getElementById('component-category')?.value;
        const description = document.getElementById('component-description')?.value;
        const imageUrl = document.getElementById('component-image-url')?.value;

        if (!name || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const newComponent = {
            _id: `comp_${Date.now()}`,
            name: name,
            category: category,
            description: description,
            image: imageUrl || 'https://placehold.co/150x150/94a3b8/ffffff?text=Component'
        };

        console.log('Adding component (simulated):', newComponent);
        // Example API call:
        /*
        fetch(`${API_BASE_URL}/api/components`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComponent)
        })
        .then(response => { ... })
        .catch(error => { ... });
        */
        existingComponents.push(newComponent);
        loadComponents();
        showNotification(`Component "${name}" added successfully! (Simulated)`, 'success');
        resetComponentForm();
    }

    function resetComponentForm() {
        const fields = ['component-name', 'component-description', 'component-image-url'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const statusEl = document.getElementById('component-image-upload-status');
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.className = 'upload-status';
        }
    }

    function addProduct() {
        const name = document.getElementById('product-name')?.value;
        const price = parseFloat(document.getElementById('product-price')?.value);
        const description = document.getElementById('product-description')?.value;
        const imageUrl = document.getElementById('product-image-url')?.value;

        if (!name || isNaN(price) || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const newProduct = {
            _id: `prod_${Date.now()}`,
            name: name,
            price: price,
            description: description,
            image: imageUrl || 'https://placehold.co/200x200/94a3b8/ffffff?text=Product'
        };

        console.log('Adding product (simulated):', newProduct);
        // Example API call:
        /*
        fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        })
        .then(response => { ... })
        .catch(error => { ... });
        */
        existingProducts.push(newProduct);
        loadProducts();
        showNotification(`Product "${name}" added successfully! (Simulated)`, 'success');
        resetProductForm();
    }

    function resetProductForm() {
        const fields = ['product-name', 'product-price', 'product-description', 'product-image-url'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const statusEl = document.getElementById('product-image-upload-status');
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.className = 'upload-status';
        }
    }

    // --- General Functions ---
    // function saveAllChanges() { ... } // Removed as per simplification

    function showNotification(message, type) {
        if (!notification) return;
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

});
