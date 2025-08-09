// admin.js

// --- Configuration ---
// Use relative path if adminpanel.html and API are on the same Vercel project
const API_BASE_URL = 'https://jsrobotics-release-4-1.fly.dev';
// For local development: const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Elements ---
    const navButtons = document.querySelectorAll('.admin-nav button');
    const sections = document.querySelectorAll('.admin-section');
    const notification = document.getElementById('notification');
    const addSectionBtn = document.getElementById('add-section-btn');
    const publishCourseBtn = document.getElementById('publish-course-btn');
    const addComponentBtn = document.getElementById('add-component-btn');
    const addProductBtn = document.getElementById('add-product-btn');

    // --- State Management ---
    let authToken = localStorage.getItem('token');
    let allCourses = [];

    // --- Initialize ---
    if (!authToken) {
        showNotification('Authentication required. Please log in.', 'error');
        return;
    }

    setupNavigation();
    setupEventListeners();
    setupFileUploads(); // Setup static and initial dynamic file inputs
    loadVisibilityData(); // Load data for the default active "visibility" section

    // --- Functions ---

    function setupNavigation() {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sectionId = button.getAttribute('data-section');

                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === `${sectionId}-section`) {
                        section.classList.add('active');
                    }
                });

                if (sectionId === 'visibility') {
                    loadVisibilityData();
                } else if (sectionId === 'components') {
                    // loadComponents(); // Implement if needed
                } else if (sectionId === 'marketplace') {
                    // loadProducts(); // Implement if needed
                }
            });
        });
    }

    function setupEventListeners() {
        if (addSectionBtn) addSectionBtn.addEventListener('click', addSection);
        if (publishCourseBtn) publishCourseBtn.addEventListener('click', publishCourse);
        if (addComponentBtn) addComponentBtn.addEventListener('click', addComponent);
        if (addProductBtn) addProductBtn.addEventListener('click', addProduct);
    }

    // --- File Uploads ---

    function setupFileDropArea(dropAreaId, inputId, statusId, hiddenInputId) {
        const dropArea = document.getElementById(dropAreaId);
        const fileInput = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        const hiddenInput = document.getElementById(hiddenInputId);

        if (!dropArea || !fileInput || !status || !hiddenInput) {
            console.warn("setupFileDropArea: Missing elements for", dropAreaId);
            return false;
        }

        // Prevent duplicate listeners by cloning
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);

        const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
        const highlight = () => {
            dropArea.style.borderColor = '#3b82f6';
            dropArea.style.backgroundColor = '#eff6ff';
        };
        const unhighlight = () => {
            dropArea.style.borderColor = '#cbd5e1';
            dropArea.style.backgroundColor = '';
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        dropArea.addEventListener('drop', handleDrop, false);
        newFileInput.addEventListener('change', handleFiles, false);

        // Make the drop area clickable to trigger file input
        dropArea.addEventListener('click', () => {
            newFileInput.click();
        });

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFilesGeneric(files, status, hiddenInput);
        }

        function handleFiles() {
            const files = this.files; // 'this' refers to newFileInput
            handleFilesGeneric(files, status, hiddenInput);
        }

        return true;
    }

    // --- ADD THIS FUNCTION ---
    // Sets up a file drop area specifically for lesson videos or other
    // dynamically created elements where passing element references is preferred.
    // This avoids issues with querying by ID when IDs might not be unique or easily determinable.
    function setupFileDropAreaForLesson(dropArea, fileInput, statusElement, hiddenInput) {
        if (!dropArea || !fileInput || !statusElement || !hiddenInput) {
            console.warn("setupFileDropAreaForLesson: Missing element references");
            return false;
        }

        // --- CRITICAL: Prevent duplicate event listeners ---
        // Clone the file input to remove any potentially problematic existing listeners
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        // Use the cloned input for attaching listeners

        // Helper functions for drag/drop visual feedback
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const highlight = () => {
            dropArea.style.borderColor = '#3b82f6';
            dropArea.style.backgroundColor = '#eff6ff';
        };

        const unhighlight = () => {
            dropArea.style.borderColor = '#cbd5e1';
            dropArea.style.backgroundColor = '';
        };

        // Add drag/drop event listeners to the drop area
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        // Add drop and change event listeners to the *cloned* input
        dropArea.addEventListener('drop', handleDrop, false);
        newFileInput.addEventListener('change', handleFiles, false); // Use cloned input

        // --- MAKE DROP AREA CLICKABLE ---
        dropArea.addEventListener('click', () => {
            newFileInput.click(); // Programmatically click the hidden file input
        });

        // Event handler functions (defined inside to capture closure variables)
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            // Pass the specific status and hiddenInput elements found at setup time
            handleFilesGeneric(files, statusElement, hiddenInput);
        }

        function handleFiles() {
            const files = this.files; // 'this' refers to the cloned input element
            // Pass the specific status and hiddenInput elements found at setup time
            handleFilesGeneric(files, statusElement, hiddenInput);
        }

        return true; // Indicate successful setup
    }
    // --- END OF NEW FUNCTION ---

    function setupFileUploads() {
        // --- Setup for STATIC file drop areas (present in initial HTML) ---

        // 1. Create Course - Course Image
        setupFileDropArea('course-image-drop-area', 'new-course-image-file', 'course-image-upload-status', 'new-course-image-url');

        // 2. Components - Image
        setupFileDropArea('component-image-drop-area', 'component-image-file', 'component-image-upload-status', 'component-image-url');

        // 3. Marketplace - Image
        setupFileDropArea('product-image-drop-area', 'product-image-file', 'product-image-upload-status', 'product-image-url');

        // --- Setup for INITIAL DYNAMIC content (lesson video in the first section template) ---
        // These elements exist in the initial HTML inside the #sections-container template.
        // They are not standalone IDs but are part of the innerHTML string.
        // We need to find them within that context and set them up correctly.
        // Find the initial section item container (the first one in the sections container)
        const sectionsContainer = document.getElementById('sections-container');
        if (sectionsContainer && sectionsContainer.firstElementChild) {
            const firstSectionItem = sectionsContainer.firstElementChild;
            // Find the first lesson item within the first section
            const lessonsContainer = firstSectionItem.querySelector('.lessons-container');
            if (lessonsContainer && lessonsContainer.firstElementChild) {
                const firstLessonItem = lessonsContainer.firstElementChild;
                // Now find the file input elements within this first lesson item
                const videoDropArea = firstLessonItem.querySelector('.lesson-video-drop-area');
                const videoFileInput = firstLessonItem.querySelector('.lesson-video-file');
                const videoStatus = firstLessonItem.querySelector('.lesson-video-upload-status');
                const videoHiddenInput = firstLessonItem.querySelector('.lesson-video-url');

                // Setup the drop area for this initial lesson video
                // Use the element references, not their IDs
                if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
                    setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
                }
            }
        }
    }

    async function handleFilesGeneric(files, statusElement, hiddenInput) {
        if (files.length === 0) return;

        const file = files[0];
        statusElement.textContent = `Uploading: ${file.name}...`;
        statusElement.className = 'upload-status uploading';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
                if (response.status === 413) {
                     errorMessage = 'File too large. Please select a smaller file.';
                } else {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) { /* Ignore JSON parse error */ }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const downloadURL = data.url;

            statusElement.textContent = 'Upload successful!';
            statusElement.classList.remove('uploading');
            statusElement.classList.add('success');
            hiddenInput.value = downloadURL;
            showNotification(`File "${file.name}" uploaded successfully!`, 'success');

        } catch (error) {
            console.error("File upload error:", error);
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.classList.remove('uploading');
            statusElement.classList.add('error');
            hiddenInput.value = '';
            showNotification(`File upload failed: ${error.message}`, 'error');
        }
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
                            <p>Drag & drop a video (upto 50mb) here or click to browse</p>
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
                // Allow removing the last lesson
                newLessonContainer.removeChild(this.closest('.lesson-item'));
                renumberLessonsInSection(newLessonContainer);
            });
        }

        // Setup file drop for the first lesson in this new section
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
                    <p>Drag & drop a video (upto 50mb) here or click to browse</p>
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

        // Setup file drop for this new lesson
        const videoDropArea = lessonItem.querySelector('.lesson-video-drop-area');
        const videoFileInput = lessonItem.querySelector('.lesson-video-file');
        const videoStatus = lessonItem.querySelector('.lesson-video-upload-status');
        const videoHiddenInput = lessonItem.querySelector('.lesson-video-url');

        if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
            setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
        }
    }

    function renumberLessonsInSection(lessonsContainer) {
        const lessons = lessonsContainer.querySelectorAll('.lesson-item');
        lessons.forEach((lesson, index) => {
            const header = lesson.querySelector('.lesson-header h4');
            if (header) header.textContent = `Lesson ${index + 1}`;
        });
    }

    async function publishCourse() {
        const title = document.getElementById('new-course-title')?.value.trim();
        const courseId = document.getElementById('new-course-id')?.value.trim();
        const level = document.getElementById('new-course-level')?.value;
        const duration = document.getElementById('new-course-duration')?.value.trim();
        const description = document.getElementById('new-course-description')?.value.trim();
        const imageUrl = document.getElementById('new-course-image-url')?.value;

        if (!title || !courseId || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        // Validate courseId slug format (basic check)
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseId)) {
             showNotification('Course ID (slug) must be lowercase, use hyphens, and contain only letters and numbers (e.g., intro-to-robotics)', 'error');
             return;
        }

        const sectionsData = [];
        const sectionItems = document.querySelectorAll('.section-item');
        let isValid = true;

        sectionItems.forEach((sectionItem, sectionIndex) => {
            const sectionTitle = sectionItem.querySelector('.section-title')?.value.trim();
            if (!sectionTitle) {
                showNotification(`Please enter a title for Section ${sectionIndex + 1}`, 'error');
                isValid = false;
                return;
            }

            const lessons = [];
            const lessonItems = sectionItem.querySelectorAll('.lesson-item');
            if (lessonItems.length === 0) {
                 showNotification(`Section "${sectionTitle}" must have at least one lesson.`, 'error');
                 isValid = false;
                 return;
            }
            lessonItems.forEach((lessonItem, lessonIndex) => {
                const lessonTitle = lessonItem.querySelector('.lesson-title')?.value.trim();
                const lessonContent = lessonItem.querySelector('.lesson-content')?.value.trim();
                const lessonVideoUrl = lessonItem.querySelector('.lesson-video-url')?.value.trim();

                if (!lessonTitle || !lessonContent) {
                    showNotification(`Please fill in all required fields for Lesson ${lessonIndex + 1} in Section "${sectionTitle}"`, 'error');
                    isValid = false;
                    return;
                }

                lessons.push({
                    title: lessonTitle,
                    content: lessonContent,
                    // Only include videoUrl if a video was uploaded
                    ...(lessonVideoUrl && { videoUrl: lessonVideoUrl })
                });
            });

            if (!isValid) return; // Stop if an error occurred in lessons

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

        const newCourseData = {
            courseId: courseId, // This will be used for the URL path
            title: title,
            level: level,
            duration: duration,
            description: description,
            // Only include image if one was uploaded
            ...(imageUrl && { image: imageUrl }),
            sections: sectionsData,
            featured: false // New courses are not featured by default
        };

        // --- PUBLISH TO BACKEND ---
        try {
             const response = await fetch(`${API_BASE_URL}/api/courses/create`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${authToken}`
                 },
                 body: JSON.stringify(newCourseData)
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                 // Handle specific errors like duplicate courseId
                 if (response.status === 409) {
                     showNotification(`Error: A course with ID '${courseId}' already exists.`, 'error');
                 } else {
                     throw new Error(errorData.error || `Failed to publish course: ${response.status} ${response.statusText}`);
                 }
                 return;
             }

             const createdCourse = await response.json();
             console.log('Course published successfully:', createdCourse);
             showNotification(`Course "${title}" published successfully!`, 'success');

             // Reset the form
             resetCourseBuilder();

        } catch (error) {
             console.error('Error publishing course:', error);
             showNotification(`Error publishing course: ${error.message}`, 'error');
        }
    }

    function resetCourseBuilder() {
        // Reset form fields
        const fieldsToReset = [
            'new-course-title', 'new-course-id', 'new-course-description',
            'new-course-duration'
            // 'new-course-level' - keep selected value?
        ];
        fieldsToReset.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'SELECT') {
                    // Reset select to first option or a default
                    el.selectedIndex = 0;
                } else {
                    el.value = '';
                }
            }
        });

        // Reset file upload statuses and hidden inputs
        const uploadStatuses = [
            { statusId: 'course-image-upload-status', hiddenId: 'new-course-image-url' }
        ];
        uploadStatuses.forEach(({ statusId, hiddenId }) => {
            const statusEl = document.getElementById(statusId);
            const hiddenEl = document.getElementById(hiddenId);
            if (statusEl) {
                statusEl.textContent = 'No file selected';
                statusEl.className = 'upload-status';
            }
            if (hiddenEl) {
                hiddenEl.value = '';
            }
        });

        // Reset sections to initial state
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
                                    <p>Drag & drop a video (upto 50mb) here or click to browse</p>
                                    <input type="file" class="lesson-video-file file-input" accept="video/*">
                                </div>
                                <div class="upload-status lesson-video-upload-status">No file selected</div>
                                <input type="hidden" class="lesson-video-url"> <!-- Hidden field for URL -->
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

            // Re-attach event listeners for the reset section
            const firstSection = sectionsContainer.querySelector('.section-item');
            if (firstSection) {
                const addLessonBtn = firstSection.querySelector('.add-lesson-btn');
                const removeLessonBtn = firstSection.querySelector('.remove-lesson-btn'); // For the first lesson
                const lessonsContainer = firstSection.querySelector('.lessons-container');

                if (addLessonBtn && lessonsContainer) {
                    addLessonBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        addLessonToSection(lessonsContainer);
                    });
                }

                if (removeLessonBtn && lessonsContainer) {
                    removeLessonBtn.addEventListener('click', function () {
                        // Allow removing the last lesson in the reset section
                        lessonsContainer.removeChild(this.closest('.lesson-item'));
                        renumberLessonsInSection(lessonsContainer);
                    });
                }

                // Setup file drop for the lesson video in the reset section
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


    // --- Components & Products (with real API calls) ---
    async function addComponent() {
        const name = document.getElementById('component-name')?.value.trim();
        const category = document.getElementById('component-category')?.value;
        const description = document.getElementById('component-description')?.value.trim();
        const imageUrl = document.getElementById('component-image-url')?.value.trim(); // From hidden input

        if (!name || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const newComponentData = {
            name: name,
            category: category,
            description: description,
            // Only include image if one was uploaded
            ...(imageUrl && { image: imageUrl })
            // Add other fields as needed by your backend API
        };

        try {
             const response = await fetch(`${API_BASE_URL}/api/components`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${authToken}`
                 },
                 body: JSON.stringify(newComponentData)
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                 throw new Error(errorData.error || `Failed to add component: ${response.status} ${response.statusText}`);
             }

             const createdComponent = await response.json();
             console.log('Component added successfully:', createdComponent);
             showNotification(`Component "${name}" added successfully!`, 'success');

             // Reset form and reload list (if implemented)
             resetComponentForm();
             // loadComponents(); // Uncomment when loadComponents fetches from API

        } catch (error) {
             console.error('Error adding component:', error);
             showNotification(`Error adding component: ${error.message}`, 'error');
        }
    }

    function resetComponentForm() {
        const fieldsToReset = ['component-name', 'component-description'];
        fieldsToReset.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Reset file upload status and hidden input
        const statusEl = document.getElementById('component-image-upload-status');
        const hiddenEl = document.getElementById('component-image-url');
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.className = 'upload-status';
        }
        if (hiddenEl) {
            hiddenEl.value = '';
        }
    }

    async function addProduct() {
        const name = document.getElementById('product-name')?.value.trim();
        const price = parseFloat(document.getElementById('product-price')?.value);
        const description = document.getElementById('product-description')?.value.trim();
        const imageUrl = document.getElementById('product-image-url')?.value.trim(); // From hidden input

        if (!name || isNaN(price) || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const newProductData = {
            name: name,
            price: price,
            description: description,
            // Only include image if one was uploaded
            ...(imageUrl && { image: imageUrl })
            // Add other fields as needed by your backend API
        };

        try {
             const response = await fetch(`${API_BASE_URL}/api/products`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${authToken}`
                 },
                 body: JSON.stringify(newProductData)
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                 throw new Error(errorData.error || `Failed to add product: ${response.status} ${response.statusText}`);
             }

             const createdProduct = await response.json();
             console.log('Product added successfully:', createdProduct);
             showNotification(`Product "${name}" added successfully!`, 'success');

             // Reset form and reload list (if implemented)
             resetProductForm();
             // loadProducts(); // Uncomment when loadProducts fetches from API

        } catch (error) {
             console.error('Error adding product:', error);
             showNotification(`Error adding product: ${error.message}`, 'error');
        }
    }

    function resetProductForm() {
        const fieldsToReset = ['product-name', 'product-price', 'product-description'];
        fieldsToReset.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'number') {
                    el.value = '';
                } else {
                    el.value = '';
                }
            }
        });

        // Reset file upload status and hidden input
        const statusEl = document.getElementById('product-image-upload-status');
        const hiddenEl = document.getElementById('product-image-url');
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.className = 'upload-status';
        }
        if (hiddenEl) {
            hiddenEl.value = '';
        }
    }

    // --- Visibility Management (with real API calls) ---
    async function loadVisibilityData() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/courses`, {
                 method: 'GET',
                 headers: {
                     'Authorization': `Bearer ${authToken}`
                 }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch courses: ${response.status}`);
            }

            const courses = await response.json();
            allCourses = courses; // Store fetched courses
            loadFeaturedCourses(courses); // Pass fetched courses
            // TODO: loadPopularProjects - implement if you have a projects API
            loadPopularProjects([]); // Placeholder

        } catch (error) {
            console.error("Error loading visibility data:", error);
            showNotification(`Error loading  ${error.message}`, 'error');
            // Load with empty data or cached data on error
            loadFeaturedCourses([]);
            loadPopularProjects([]);
        }
    }

    function loadFeaturedCourses(courses) {
        const container = document.getElementById('featured-courses-list');
        if (!container) return;

        container.innerHTML = '';
        if (!courses || courses.length === 0) {
            container.innerHTML = '<p>No courses found.</p>';
            return;
        }

        courses.forEach(course => {
            const card = createVisibilityCard(course, 'course');
            container.appendChild(card);
        });
    }

    function loadPopularProjects(projects) {
        const container = document.getElementById('popular-projects-list');
        if (!container) return;

        container.innerHTML = '';
        if (!projects || projects.length === 0) {
            container.innerHTML = '<p>No projects found.</p>';
            return;
        }

        projects.forEach(project => {
            const card = createVisibilityCard(project, 'project');
            container.appendChild(card);
        });
    }

    // TODO: Implement loadComponents and loadProducts by fetching from backend
    function loadComponents() {
        const container = document.getElementById('components-list');
        if (!container) return;
        container.innerHTML = '<p>Component loading not implemented yet.</p>';
        // Fetch from /api/components and populate
    }

    function loadProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;
        container.innerHTML = '<p>Product loading not implemented yet.</p>';
        // Fetch from /api/products and populate
    }

    function createVisibilityCard(item, type) {
        // Use the new, smaller card class
        const card = document.createElement('div');
        card.className = 'item-card-small';

        const imageHtml = item.image ? `<img src="${item.image}" alt="${item.title || item.name}">` : '';
        const titleHtml = `<h3>${item.title || item.name}</h3>`;
        // Keep description short or omit for small cards if needed
        const descriptionHtml = item.description ? `<p>${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</p>` : (item.author ? `<p>by ${item.author}</p>` : '');

        // Use the item's 'featured' property for the checkbox state
        const isChecked = item.featured ? 'checked' : '';
        // Use the new, smaller actions class
        const actionsHtml = `
            <div class="item-actions-small">
                <span>Visibility to Home Page</span> <!-- Updated label -->
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

    // TODO: Implement createItemCard for Components/Products if editing is needed
    function createItemCard(item, type) {
        // For Components and Products, use the standard larger card
        const card = document.createElement('div');
        card.className = 'item-card';
        // ... (implementation similar to previous versions)
        card.innerHTML = `<p>${type} display not fully implemented.</p><p>ID: ${item._id}</p>`;
        return card;
    }

    async function toggleFeatured(id, type, isFeatured) {
        console.log(`Toggling featured status for ${type} ID ${id} to ${isFeatured}`);
        // In a real app, send this update to your backend API
        if (type !== 'course') {
             showNotification(`Visibility toggle for ${type} not implemented yet.`, 'warning');
             return; // Only courses implemented for now
        }

        try {
             const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
                 method: 'PATCH',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${authToken}`
                 },
                 body: JSON.stringify({ featured: isFeatured })
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                 throw new Error(errorData.error || `Failed to update ${type}: ${response.status}`);
             }

             const updatedCourse = await response.json();
             console.log(`${type} visibility updated:`, updatedCourse);
             showNotification(`${type} visibility updated successfully!`, 'success');

             // Update local state
             const courseIndex = allCourses.findIndex(c => c._id === id);
             if (courseIndex !== -1) {
                 allCourses[courseIndex].featured = isFeatured;
             }

        } catch (error) {
             console.error(`Error updating ${type} visibility:`, error);
             showNotification(`Error updating ${type} visibility: ${error.message}`, 'error');
             // Revert checkbox state on error? Optional.
        }
    }


    // --- General Functions ---
    function showNotification(message, type) {
        if (!notification) return;
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

});