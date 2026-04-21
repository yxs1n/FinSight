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

/**
 * Fetch all expenses from the backend
 * Returns an array of expenses, or an empty array on error
 */
async function fetchExpenses() {
    try {
        const response = await fetch('/expenses');

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.expenses;
    } catch (err) {
        console.error('Error fetching expenses:', err);
        return [];
    }
}

/**
 * Build a single expense card element from an expense object
 * If showDelete is true, a delete button is included
 */
function createExpenseCard(expense, showDelete = false) {
    const card = document.createElement('div');
    card.className = 'expense-card';

    // Format the date nicely (e.g. "21 Apr 2026" instead of "2026-04-21T...")
    const date = new Date(expense.expense_date);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Format amount with 2 decimal places
    const formattedAmount = Number(expense.amount).toFixed(2);

    // Build the inner HTML (with or without delete button)
    const deleteButton = showDelete
        ? `<button class="expense-delete" data-id="${expense.id}" aria-label="Delete expense">
               <i class="fas fa-trash"></i>
           </button>`
        : '';

    card.innerHTML = `
        <div class="expense-info">
            <div class="expense-category">${expense.category_name}</div>
            <div class="expense-description">${expense.description || ''}</div>
            <div class="expense-date">${formattedDate}</div>
        </div>
        <div class="expense-right">
            <div class="expense-amount">£${formattedAmount}</div>
            ${deleteButton}
        </div>
    `;

    return card;
}

/**
 * Render expenses into the Recent Expenses list on the dashboard
 * Shows up to 5 most recent expenses
 */
function renderRecentExpenses(expenses) {
    const list = document.getElementById('recent-expenses-list');
    const empty = document.getElementById('recent-expenses-empty');

    // Clear any existing content
    list.innerHTML = '';

    if (expenses.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    // Take only the first 5 (they're already sorted newest first by the backend)
    const recent = expenses.slice(0, 5);
    recent.forEach(expense => {
        list.appendChild(createExpenseCard(expense));
    });
}

/**
 * Render expenses into the All Expenses list
 * Each card includes a delete button
 */
function renderAllExpenses(expenses) {
    const list = document.getElementById('all-expenses-list');
    const empty = document.getElementById('all-expenses-empty');

    list.innerHTML = '';

    if (expenses.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    expenses.forEach(expense => {
        list.appendChild(createExpenseCard(expense, true));
    });
}

/**
 * Handle clicks on the All Expenses list (event delegation)
 * Listens for clicks on delete buttons
 */
document.getElementById('all-expenses-list').addEventListener('click', async (e) => {
    // Find the delete button that was clicked (if any)
    const deleteBtn = e.target.closest('.expense-delete');
    if (!deleteBtn) return;

    // Get the expense ID from the button's data attribute
    const expenseId = deleteBtn.getAttribute('data-id');

    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        const response = await fetch(`/expenses/${expenseId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            alert('Could not delete expense. Please try again.');
            return;
        }

        // Reload the list to reflect the deletion
        loadAllExpenses();
    } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Could not connect to server. Please try again.');
    }
});

/**
 * Load expenses and render them on the dashboard
 */
async function loadDashboardExpenses() {
    const expenses = await fetchExpenses();
    renderRecentExpenses(expenses);
    renderTotalSpent(expenses);
}

/**
 * Calculate total spent and update the balance card
 */
function renderTotalSpent(expenses) {
    const totalElement = document.getElementById('total-spent');

    // Sum up all expense amounts
    const total = expenses.reduce((sum, expense) => {
        return sum + Number(expense.amount);
    }, 0);

    // Format with 2 decimal places and a pound sign
    totalElement.textContent = `£${total.toFixed(2)}`;
}

/**
 * Load expenses and render them on the All Expenses view
 */
async function loadAllExpenses() {
    const expenses = await fetchExpenses();
    renderAllExpenses(expenses);
}