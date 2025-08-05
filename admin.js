
const API_BASE_URL = 'https://jsrobotics-release-4.vercel.app'; // Your Vercel frontend URL (if API is separate)


document.addEventListener('DOMContentLoaded', function () {
    // --- Configuration ---
    // const API_BASE_URL is defined above

    // --- DOM Elements ---
    const navButtons = document.querySelectorAll('.admin-nav button');
    const sections = document.querySelectorAll('.admin-section');
    const notification = document.getElementById('notification');
    const addSectionBtn = document.getElementById('add-section-btn');
    const publishCourseBtn = document.getElementById('publish-course-btn');
    const addComponentBtn = document.getElementById('add-component-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    // Assume logout is handled by script.js

    // --- State Management ---
    let authToken = localStorage.getItem('token'); // Get token from localStorage (set by script.js)
    let allCourses = []; // To store fetched courses

    // --- Initialize ---
    if (!authToken) {
        showNotification('Authentication required. Please log in.', 'error');
        // Optionally redirect to login or hide admin panel
        // window.location.href = 'index.html';
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

                // Load data for the selected section if needed
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
        if (addSectionBtn) addSectionBtn.addEventListener('click', addSection);
        if (publishCourseBtn) publishCourseBtn.addEventListener('click', publishCourse);
        if (addComponentBtn) addComponentBtn.addEventListener('click', addComponent);
        if (addProductBtn) addProductBtn.addEventListener('click', addProduct);
        // Logout is handled by script.js
    }

    // --- File Uploads ---

    // --- IMPROVED setupFileDropArea ---
    function setupFileDropArea(dropAreaId, inputId, statusId, hiddenInputId) {
        // console.log(`Attempting to setup drop area: ${dropAreaId}, input: ${inputId}`); // Debug log

        const dropArea = document.getElementById(dropAreaId);
        const fileInput = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        const hiddenInput = document.getElementById(hiddenInputId);

        // Check if elements exist before proceeding
        if (!dropArea || !fileInput || !status || !hiddenInput) {
             // This warning for initial template elements is often expected and harmless
            console.warn("setupFileDropArea: Missing elements for IDs:", dropAreaId, inputId, statusId, hiddenInputId);
            return false; // Indicate setup wasn't performed
        }

        // --- CRITICAL: Prevent duplicate event listeners ---
        // Remove existing listeners by cloning the input element
        // This is a robust way to ensure we don't attach multiple listeners
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

        // Event handler functions (defined inside to capture closure variables)
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            // Pass the specific status and hiddenInput elements found at setup time
            handleFilesGeneric(files, status, hiddenInput);
        }

        function handleFiles() {
            const files = this.files; // 'this' refers to the cloned input element
            // Pass the specific status and hiddenInput elements found at setup time
            handleFilesGeneric(files, status, hiddenInput);
        }

        // console.log(`Successfully setup drop area: ${dropAreaId}`); // Debug log
        return true; // Indicate setup was successful
    }


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
        // We need to find them within that context and set them up.
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
                if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
                     // Use unique identifiers or pass the elements directly if setupFileDropArea is refactored
                     // For now, we rely on the robustness of setupFileDropArea to handle finding them by ID
                     // But since these are part of a template, they might not have unique IDs initially.
                     // A better approach is to pass the element references directly.
                     // Let's refactor setupFileDropArea slightly or use a helper.

                     // --- BETTER APPROACH: Pass element references ---
                     setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
                }
            }
        }
    }

    // --- Helper specifically for lesson videos (takes element refs, not IDs) ---
    function setupFileDropAreaForLesson(dropArea, fileInput, statusElement, hiddenInputElement) {
         if (!dropArea || !fileInput || !statusElement || !hiddenInputElement) {
             console.warn("setupFileDropAreaForLesson: Missing element references");
             return false;
         }

         // --- CRITICAL: Prevent duplicate event listeners (using element refs) ---
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

         function handleDrop(e) {
             const dt = e.dataTransfer;
             const files = dt.files;
             handleFilesGeneric(files, statusElement, hiddenInputElement); // Use passed refs
         }

         function handleFiles() {
             const files = this.files;
             handleFilesGeneric(files, statusElement, hiddenInputElement); // Use passed refs
         }

         return true;
    }


    // --- Generic file handler for uploads (Real implementation with fetch) ---
    async function handleFilesGeneric(files, statusElement, hiddenInput) {
        if (files.length === 0 || !statusElement || !hiddenInput) {
            console.warn("handleFilesGeneric: Missing files or elements");
            return;
        }

        const file = files[0];
        statusElement.textContent = `Uploading: ${file.name}...`;
        statusElement.className = 'upload-status uploading';

        try {
            // --- REAL UPLOAD LOGIC using Fetch API ---
            const formData = new FormData();
            // The backend expects the field name 'file'
            formData.append('file', file);
            // Optional: Add metadata like folder
            // formData.append('folder', 'course_videos'); // Example

            // --- KEY: Use the correct API endpoint ---
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                // DO NOT set Content-Type header for FormData
                // It will be set automatically with the correct boundary
                // headers: { 'Content-Type': 'multipart/form-data' }, // REMOVE THIS LINE
                body: formData,
                // Include Authorization header if your /api/upload endpoint requires it
                // headers: {
                //     'Authorization': `Bearer ${authToken}`
                // }
                // If you remove authenticateToken from /api/upload.js, remove this header.
                // If you keep it, uncomment the line above.
            });

            if (!response.ok) {
                // Try to get error message from response body
                let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If parsing JSON fails, ignore, use default message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const downloadURL = data.url; // Assume backend returns { url: '...' }

            statusElement.textContent = 'Upload successful!';
            statusElement.classList.remove('uploading');
            statusElement.classList.add('success');
            hiddenInput.value = downloadURL; // Set the URL in the hidden input
            console.log(`Uploaded file URL for ${file.name}:`, downloadURL);
            showNotification(`File "${file.name}" uploaded successfully!`, 'success');

        } catch (error) {
            console.error("File upload error:", error);
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.classList.remove('uploading');
            statusElement.classList.add('error');
            hiddenInput.value = ''; // Clear hidden input on error
            showNotification(`File upload failed: ${error.message}`, 'error');
        }
    }


    // --- Course Builder Functions ---
    function addSection() {
        const sectionsContainer = document.getElementById('sections-container');
        if (!sectionsContainer) {
            console.error("addSection: #sections-container not found");
            return;
        }

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
                        <input type="hidden" class="lesson-video-url"> <!-- Hidden field for URL -->
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
        const removeLessonBtn = sectionItem.querySelector('.remove-lesson-btn'); // For the first lesson

        if (addLessonBtn) {
            addLessonBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addLessonToSection(newLessonContainer);
            });
        }

        // --- FIX: Allow removing the last lesson in a new section ---
        if (removeLessonBtn) {
            removeLessonBtn.addEventListener('click', function () {
                // if (newLessonContainer.children.length > 1) { // Old restrictive logic
                    newLessonContainer.removeChild(this.closest('.lesson-item'));
                    renumberLessonsInSection(newLessonContainer);
                // } else {
                //     showNotification('Cannot remove the last lesson in a section', 'error');
                // }
            });
        }

        // --- CRITICAL FIX: Setup file drop for the NEWLY added lesson video ---
        // Get the elements within the newly created sectionItem for the first lesson
        const videoDropArea = sectionItem.querySelector('.lesson-video-drop-area');
        const videoFileInput = sectionItem.querySelector('.lesson-video-file');
        const videoStatus = sectionItem.querySelector('.lesson-video-upload-status');
        const videoHiddenInput = sectionItem.querySelector('.lesson-video-url');

        // Use the robust setup function that takes element references
        if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
            setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
        }
    }

    function addLessonToSection(lessonsContainer) {
        if (!lessonsContainer) {
             console.error("addLessonToSection: lessonsContainer not provided");
             return;
        }
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
                <input type="hidden" class="lesson-video-url"> <!-- Hidden field for URL -->
            </div>
            <div class="form-group">
                <label>Lesson Content *</label>
                <textarea class="lesson-content" placeholder="Lesson content..." required></textarea>
            </div>
        `;
        lessonsContainer.appendChild(lessonItem);

        const removeBtn = lessonItem.querySelector('.remove-lesson-btn');
        if (removeBtn) {
            // --- FIX: Allow removing any lesson ---
            removeBtn.addEventListener('click', function () {
                lessonsContainer.removeChild(lessonItem);
                renumberLessonsInSection(lessonsContainer);
            });
        }

        // --- CRITICAL FIX: Setup file drop for the NEWLY added lesson video ---
        // Get the elements within the newly created lessonItem
        const videoDropArea = lessonItem.querySelector('.lesson-video-drop-area');
        const videoFileInput = lessonItem.querySelector('.lesson-video-file');
        const videoStatus = lessonItem.querySelector('.lesson-video-upload-status');
        const videoHiddenInput = lessonItem.querySelector('.lesson-video-url');

        // Use the robust setup function that takes element references
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
        // ... (rest of publishCourse logic remains largely the same, ensure it uses hidden input values) ...
        const title = document.getElementById('new-course-title')?.value.trim();
        const courseId = document.getElementById('new-course-id')?.value.trim(); // slug
        const level = document.getElementById('new-course-level')?.value;
        const duration = document.getElementById('new-course-duration')?.value.trim();
        const description = document.getElementById('new-course-description')?.value.trim();
        const imageUrl = document.getElementById('new-course-image-url')?.value; // From hidden input after upload

        if (!title || !courseId || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        // Validate courseId slug format (basic check)
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseId)) {
             showNotification('Course ID (slug) must be lowercase, use hyphens, and contain only letters and numbers (e.g., genz101)', 'error');
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
                const lessonVideoUrl = lessonItem.querySelector('.lesson-video-url')?.value.trim(); // From hidden input

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
             // Ensure authToken is available
             if (!authToken) {
                 throw new Error('Authentication token missing. Please log in again.');
             }
             const response = await fetch(`${API_BASE_URL}/api/courses`, {
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
                                    <p>Drag & drop a video here or click to browse</p>
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
                        // if (lessonsContainer.children.length > 1) {
                            lessonsContainer.removeChild(this.closest('.lesson-item'));
                            renumberLessonsInSection(lessonsContainer);
                        // } else {
                        //     showNotification('Cannot remove the last lesson in a section', 'error');
                        // }
                    });
                }

                // --- CRITICAL FIX: Setup file drop for the lesson video in the reset section ---
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
        // ... (similar fixes for component/product forms) ...
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
             // Ensure authToken is available
             if (!authToken) {
                 throw new Error('Authentication token missing. Please log in again.');
             }
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
         // ... (similar fixes for component/product forms) ...
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
             // Ensure authToken is available
             if (!authToken) {
                 throw new Error('Authentication token missing. Please log in again.');
             }
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

    // --- Data Loading (Placeholder, implement with real API calls) ---
    async function loadVisibilityData() {
        // ... (implement fetching courses/projects and populating visibility cards) ...
        try {
            // Example API call to fetch courses
            /*
            const response = await fetch(`${API_BASE_URL}/api/courses`, {
                 method: 'GET',
                 headers: {
                     'Authorization': `Bearer ${authToken}`
                 }
            });
            if (!response.ok) throw new Error('Failed to fetch courses');
            const courses = await response.json();
            allCourses = courses;
            loadFeaturedCourses(courses);
            */
            // For now, simulate
            console.log("Loading visibility data (simulated)");
            loadFeaturedCourses([
                { _id: "1", title: "Sample Course 1", featured: true, image: "https://placehold.co/250x150/blue/white?text=Course+1" },
                { _id: "2", title: "Sample Course 2", featured: false, image: "https://placehold.co/250x150/green/white?text=Course+2" }
            ]);
            loadPopularProjects([
                 { _id: "1", title: "Sample Project 1", featured: true, image: "https://placehold.co/250x150/orange/white?text=Project+1" },
                 { _id: "2", title: "Sample Project 2", featured: false, image: "https://placehold.co/250x150/red/white?text=Project+2" }
            ]);

        } catch (error) {
            console.error("Error loading visibility ", error);
            showNotification(`Error loading  ${error.message}`, 'error');
        }
    }

    function loadFeaturedCourses(courses) { /* ... */ }
    function loadPopularProjects(projects) { /* ... */ }
    function loadComponents() { /* ... */ }
    function loadProducts() { /* ... */ }

    // --- General Functions ---
    function showNotification(message, type) {
        if (!notification) return;
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000); // Show for 5 seconds
    }

});