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

/**
 * Handle Add Expense form submission
 */
const expenseForm = document.getElementById('expense-form');
const expenseError = document.getElementById('expense-error');
const expenseSuccess = document.getElementById('expense-success');

expenseForm.addEventListener('submit', async (e) => {
    // Stop the browser from refreshing the page
    e.preventDefault();

    // Hide any previous feedback messages
    expenseError.classList.add('hidden');
    expenseSuccess.classList.add('hidden');

    // Grab the values from the form inputs
    const category_id = document.getElementById('expense-category').value;
    const amount = document.getElementById('expense-amount').value;
    const expense_date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-description').value.trim();

    try {
        // Send data to the backend
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({category_id, amount, description, expense_date})
        });

        const data = await response.json();

        // If backend rejected the request, show the error
        if (!response.ok) {
            expenseError.textContent = data.error;
            expenseError.classList.remove('hidden');
            return;
        }

        // Success! Clear the form and show a success message
        expenseForm.reset();
        expenseSuccess.textContent = 'Expense added successfully!';
        expenseSuccess.classList.remove('hidden');
    } catch (err) {
        // Network error (server down, etc.)
        expenseError.textContent = 'Could not connect to server. Please try again.';
        expenseError.classList.remove('hidden');
    }
});