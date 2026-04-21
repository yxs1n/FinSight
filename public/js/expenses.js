/**
 * Load categories into the dropdown when the page loads
 */
async function loadCategories() {
    const categorySelect = document.getElementById('expense-category');

    try {
        // Fetch categories from the backend
        const response = await fetch('/expenses/categories');

        // If something went wrong (not logged in, server error), just stop
        if (!response.ok) {
            return;
        }

        const data = await response.json();

        // Add each category as an option in the dropdown
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

// Load categories as soon as the page loads
loadCategories();