/**
 * Helpers
 */

/**
 * Get the current month as a YYYY-MM string
 * Used to default the month picker to "this month"
 */
function currentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Convert a YYYY-MM string from <input type="month"> to YYYY-MM-01
 * This is what the backend expects (first of the month)
 */
function monthToFullDate(yearMonth) {
    return `${yearMonth}-01`;
}

/**
 * Convert a full date (e.g. "2026-04-01T00:00:00.000Z") to a friendly month label
 * Example: "April 2026"
 */
function formatMonthLabel(dateInput) {
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/**
 * Load categories into the budget form dropdown
 * Reuses the same /expenses/categories endpoint since categories are shared
 */
async function loadBudgetCategories() {
    const select = document.getElementById('budget-category');

    try {
        const response = await fetch('/expenses/categories');
        if (!response.ok) return;

        const data = await response.json();

        // Reset dropdown to just the placeholder, then add categories
        select.innerHTML = '<option value="">Select a category</option>';
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading categories for budget form:', err);
    }
}

/**
 * Fetch all budgets for the logged in user
 */
async function fetchBudgets() {
    try {
        const response = await fetch('/budgets');
        if (!response.ok) return [];
        const data = await response.json();
        return data.budgets;
    } catch (err) {
        console.error('Error fetching budgets:', err);
        return [];
    }
}

/**
 * Build a single budget card element
 */
function createBudgetCard(budget) {
    const card = document.createElement('div');
    card.className = 'expense-card';

    const monthLabel = formatMonthLabel(budget.month_year);
    const formattedAmount = Number(budget.amount_limit).toFixed(2);

    card.innerHTML = `
        <div class="expense-info">
            <div class="expense-category">${budget.category_name}</div>
            <div class="expense-date">${monthLabel}</div>
        </div>
        <div class="expense-right">
            <div class="expense-amount">£${formattedAmount}</div>
            <button class="expense-delete" data-id="${budget.id}" aria-label="Delete budget">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return card;
}

/**
 * Render all budgets into the budgets list
 */
function renderBudgets(budgets) {
    const list = document.getElementById('budgets-list');
    const empty = document.getElementById('budgets-empty');

    list.innerHTML = '';

    if (budgets.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    budgets.forEach(budget => {
        list.appendChild(createBudgetCard(budget));
    });
}

/**
 * Load the whole Budgets view: categories in dropdown, default the month input,
 * and render the current budgets list
 */
async function loadBudgetsView() {
    loadBudgetCategories();

    // Default the month input to this month (the "smart default")
    document.getElementById('budget-month').value = currentMonth();

    const budgets = await fetchBudgets();
    renderBudgets(budgets);
}

/**
 * Handle budget form submission
 */
const budgetForm = document.getElementById('budget-form');
const budgetError = document.getElementById('budget-error');
const budgetSuccess = document.getElementById('budget-success');

budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    budgetError.classList.add('hidden');
    budgetSuccess.classList.add('hidden');

    const category_id = document.getElementById('budget-category').value;
    const amount_limit = document.getElementById('budget-amount').value;
    const yearMonth = document.getElementById('budget-month').value;

    // Validate the month is in YYYY-MM format
    // Safari and some browsers let users type invalid text into month inputs
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        budgetError.textContent = 'Please select a valid month (e.g. 2026-04).';
        budgetError.classList.remove('hidden');
        return;
    }

    const month_year = monthToFullDate(yearMonth);
    // ...

    try {
        const response = await fetch('/budgets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({category_id, amount_limit, month_year})
        });

        const data = await response.json();

        if (!response.ok) {
            budgetError.textContent = data.error;
            budgetError.classList.remove('hidden');
            return;
        }

        // Success - show message, refresh the list, keep the form for quick follow-ups
        budgetSuccess.textContent = data.message || 'Budget saved successfully!';
        budgetSuccess.classList.remove('hidden');

        // Clear just the amount field so the user can quickly set another budget for the same month
        document.getElementById('budget-amount').value = '';

        // Refresh the list to show the new/updated budget
        const budgets = await fetchBudgets();
        renderBudgets(budgets);
    } catch (err) {
        budgetError.textContent = 'Could not connect to server. Please try again.';
        budgetError.classList.remove('hidden');
    }
});

/**
 * Handle clicks on the budgets list (event delegation for delete buttons)
 */
document.getElementById('budgets-list').addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.expense-delete');
    if (!deleteBtn) return;

    const budgetId = deleteBtn.getAttribute('data-id');

    if (!confirm('Are you sure you want to delete this budget?')) {
        return;
    }

    try {
        const response = await fetch(`/budgets/${budgetId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            alert('Could not delete budget. Please try again.');
            return;
        }

        // Reload the list
        const budgets = await fetchBudgets();
        renderBudgets(budgets);
    } catch (err) {
        console.error('Error deleting budget:', err);
        alert('Could not connect to server. Please try again.');
    }
});