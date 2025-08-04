// admin.js - Updated Admin Panel Logic

// Fetch and render existing courses in Visibility section
async function fetchCoursesForVisibility() {
  const container = document.getElementById("visibility-course-list");
  container.innerHTML = "Loading...";

  try {
    const res = await fetch("/api/courses");
    const courses = await res.json();
    container.innerHTML = "";

    courses.forEach(course => {
      const div = document.createElement("div");
      div.className = "visibility-entry";

      const title = document.createElement("span");
      title.textContent = course.title;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = course.visibleOnHomepage || false;
      checkbox.addEventListener("change", async () => {
        await fetch(`/api/courses/${course._id}/visibility`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ visibleOnHomepage: checkbox.checked })
        });
      });

      const label = document.createElement("label");
      label.textContent = " Visibility to Home Page";

      div.appendChild(title);
      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "Error loading courses.";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchCoursesForVisibility();
});

// Fix file inputs (Create Course Tab, Marketplace, Components)
function setupFileInput(id, previewId) {
  const input = document.getElementById(id);
  const preview = document.getElementById(previewId);

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Create Course Tab
setupFileInput("courseImageInput", "courseImagePreview");
setupFileInput("lessonVideoInput", "lessonVideoPreview");

document.querySelectorAll(".remove-lesson").forEach(button => {
  button.addEventListener("click", e => {
    const lessonRow = e.target.closest(".lesson-row");
    if (lessonRow) lessonRow.remove();
  });
});

// Marketplace
setupFileInput("marketplaceImageInput", "marketplaceImagePreview");

// Components
setupFileInput("componentImageInput", "componentImagePreview");
