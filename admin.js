// admin.js

// --- Configuration ---
// Use relative path if adminpanel.html and API are on the same Vercel project
const API_BASE_URL = '';
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
            return;
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
            const files = this.files;
            handleFilesGeneric(files, status, hiddenInput);
        }
    }

    // --- REPLACE THE ENTIRE setupFileUploads FUNCTION ---
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
            // Use the robust setup function that takes element references
            if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
                setupFileDropAreaForLesson(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
            }
        }
    }
}
// --- END OF REPLACEMENT ---

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
            setupFileDropArea(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
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

        // Setup file drop for this new lesson
        const videoDropArea = lessonItem.querySelector('.lesson-video-drop-area');
        const videoFileInput = lessonItem.querySelector('.lesson-video-file');
        const videoStatus = lessonItem.querySelector('.lesson-video-upload-status');
        const videoHiddenInput = lessonItem.querySelector('.lesson-video-url');

        if (videoDropArea && videoFileInput && videoStatus && videoHiddenInput) {
            setupFileDropArea(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
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
                    ...(lessonVideoUrl && { videoUrl: lessonVideoUrl })
                });
            });

            if (!isValid) return;
            sectionsData.push({ title: sectionTitle, lessons: lessons });
        });

        if (!isValid) return;
        if (sectionsData.length === 0) {
            showNotification('Please add at least one section with lessons', 'error');
            return;
        }

        const newCourseData = {
            courseId: courseId,
            title: title,
            level: level,
            duration: duration,
            description: description,
            ...(imageUrl && { image: imageUrl }),
            sections: sectionsData,
            featured: false
        };

        try {
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
                if (response.status === 409) {
                    showNotification(`Error: A course with ID '${courseId}' already exists.`, 'error');
                } else {
                    throw new Error(errorData.error || `Failed to publish course: ${response.status}`);
                }
                return;
            }

            const createdCourse = await response.json();
            showNotification(`Course "${title}" published successfully!`, 'success');
            resetCourseBuilder();

        } catch (error) {
            console.error('Error publishing course:', error);
            showNotification(`Error publishing course: ${error.message}`, 'error');
        }
    }

    function resetCourseBuilder() {
        // Reset form fields
        ['new-course-title', 'new-course-id', 'new-course-description', 'new-course-duration'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('new-course-level').selectedIndex = 0; // Reset select

        // Reset file upload statuses and hidden inputs
        [
            { statusId: 'course-image-upload-status', hiddenId: 'new-course-image-url' }
        ].forEach(({ statusId, hiddenId }) => {
            const statusEl = document.getElementById(statusId);
            const hiddenEl = document.getElementById(hiddenId);
            if (statusEl) {
                statusEl.textContent = 'No file selected';
                statusEl.className = 'upload-status';
            }
            if (hiddenEl) hiddenEl.value = '';
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

            // Re-attach event listeners for the reset section
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
                    setupFileDropArea(videoDropArea, videoFileInput, videoStatus, videoHiddenInput);
                }
            }
        }
    }

    // --- Components & Products ---

    async function addComponent() {
        const name = document.getElementById('component-name')?.value.trim();
        const category = document.getElementById('component-category')?.value;
        const description = document.getElementById('component-description')?.value.trim();
        const imageUrl = document.getElementById('component-image-url')?.value.trim();

        if (!name || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const newComponentData = {
            name: name,
            category: category,
            description: description,
            ...(imageUrl && { image: imageUrl })
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
                throw new Error(errorData.error || `Failed to add component: ${response.status}`);
            }

            const createdComponent = await response.json();
            showNotification(`Component "${name}" added successfully!`, 'success');
            resetComponentForm();

        } catch (error) {
            console.error('Error adding component:', error);
            showNotification(`Error adding component: ${error.message}`, 'error');
        }
    }

    function resetComponentForm() {
        ['component-name', 'component-description'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('component-category').selectedIndex = 0;

        const statusEl = document.getElementById('component-image-upload-status');
        const hiddenEl = document.getElementById('component-image-url');
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.className = 'upload-status';
        }
        if (hiddenEl) hiddenEl.value = '';
    }

    async function addProduct() {
        const name = document.getElementById('product-name')?.value.trim();
        const price = parseFloat(document.getElementById('product-price')?.value);
        const description = document.getElementById('product-description')?.value.trim();
        const imageUrl = document.getElementById('product-image-url')?.value.trim();

        if (!name || isNaN(price) || !description) {
            showNotification('Please fill in all required fields (*)', 'error');
            return;
        }

        const newProductData = {
            name: name,
            price: price,
            description: description,
            ...(imageUrl && { image: imageUrl })
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
                throw new Error(errorData.error || `Failed to add product: ${response.status}`);
            }

            const createdProduct = await response.json();
            showNotification(`Product "${name}" added successfully!`, 'success');
            resetProductForm();

        } catch (error) {
            console.error('Error adding product:', error);
            showNotification(`Error adding product: ${error.message}`, 'error');
        }
    }

    function resetProductForm() {
        ['product-name', 'product-price', 'product-description'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const statusEl = document.getElementById('product-image-upload-status');
        const hiddenEl = document.getElementById('product-image-url');
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.className = 'upload-status';
        }
        if (hiddenEl) hiddenEl.value = '';
    }

    // --- Visibility Management ---

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
            allCourses = courses;
            loadFeaturedCourses(courses);

        } catch (error) {
            console.error("Error loading visibility data:", error);
            showNotification(`Error loading courses: ${error.message}`, 'error');
            loadFeaturedCourses([]);
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

    function createVisibilityCard(item, type) {
        const card = document.createElement('div');
        card.className = 'item-card-small';

        const imageHtml = item.image ? `<img src="${item.image}" alt="${item.title}">` : '';
        const titleHtml = `<h3>${item.title}</h3>`;
        const descriptionHtml = item.description ? `<p>${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</p>` : '';

        const isChecked = item.featured ? 'checked' : '';
        const actionsHtml = `
            <div class="item-actions-small">
                <span>Visibility to Home Page</span>
                <div class="toggle-visibility-small">
                    <input type="checkbox" id="toggle-${type}-${item._id}" ${isChecked} data-id="${item._id}" data-type="${type}">
                    <label for="toggle-${type}-${item._id}"></label>
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

        const toggle = card.querySelector(`#toggle-${type}-${item._id}`);
        if (toggle) {
            toggle.addEventListener('change', function () {
                toggleFeatured(item._id, type, this.checked);
            });
        }

        return card;
    }

    async function toggleFeatured(id, type, isFeatured) {
        if (type !== 'course') {
            showNotification(`Visibility toggle for ${type} not implemented yet.`, 'warning');
            return;
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

            // Update local state
            const courseIndex = allCourses.findIndex(c => c._id === id);
            if (courseIndex !== -1) {
                allCourses[courseIndex].featured = isFeatured;
            }

            showNotification(`${type} visibility updated successfully!`, 'success');

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