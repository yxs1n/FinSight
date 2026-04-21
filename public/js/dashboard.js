/**
 * Dashboard logic: summary, spending by category chart, budget progress
 */

/**
 * Chart.js instance reference, kept at module scope so we can destroy and
 * recreate the chart on each load (needed because Chart.js attaches to a
 * canvas and re-rendering on top of an existing chart causes glitches)
 */
let categoryChart = null;

/**
 * Get the current month as a friendly label, e.g. "April 2026"
 */
function currentMonthLabel() {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/**
 * Fetch all dashboard data in one request
 */
async function fetchDashboardData() {
    try {
        const response = await fetch('/dashboard');
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        return null;
    }
}

/**
 * Update the summary card with this month's total spent
 */
function renderSummary(totalSpent) {
    document.getElementById('dashboard-month-label').textContent = `Spent in ${currentMonthLabel()}`;
    document.getElementById('total-spent').textContent = `£${Number(totalSpent).toFixed(2)}`;
}

/**
 * Render the spending-by-category donut chart using Chart.js
 */
function renderCategoryChart(spendingByCategory) {
    const canvas = document.getElementById('category-chart');
    const container = document.getElementById('category-chart-container');
    const empty = document.getElementById('category-chart-empty');

    // If no spending, show empty state and skip the chart
    if (!spendingByCategory || spendingByCategory.length === 0) {
        container.classList.add('hidden');
        empty.classList.remove('hidden');
        // Clean up any previous chart
        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
        return;
    }

    container.classList.remove('hidden');
    empty.classList.add('hidden');

    // Prepare chart data
    const labels = spendingByCategory.map(c => c.category_name);
    const data = spendingByCategory.map(c => c.total);

    // A palette of reds and greys that matches the app theme
    const colors = [
        '#ec125b', '#d4104f', '#b10e43',
        '#8a0b35', '#666666', '#888888',
        '#aaaaaa', '#ec6891', '#555555',
        '#c7104a', '#999999'
    ];

    // If a chart already exists on this canvas, destroy it first
    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderColor: '#2a2a2a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#efefef',
                        font: { family: 'Inter', size: 12 },
                        padding: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        // Custom tooltip label: "Eating Out: £65.00"
                        label: function(context) {
                            const value = Number(context.parsed).toFixed(2);
                            return `${context.label}: £${value}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render the budget progress list
 * Each budget gets a card with category, spent/limit, and a progress bar
 */
function renderBudgetProgress(budgets) {
    const list = document.getElementById('budgets-progress-list');
    const empty = document.getElementById('budgets-progress-empty');

    list.innerHTML = '';

    if (!budgets || budgets.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    budgets.forEach(budget => {
        const spent = Number(budget.spent);
        const limit = Number(budget.amount_limit);
        // Percentage, capped at 100 for visual purposes, with a flag for overspending
        const rawPercent = (spent / limit) * 100;
        const displayPercent = Math.min(rawPercent, 100);
        const isOver = spent > limit;

        const card = document.createElement('div');
        card.className = 'budget-progress-card';
        card.innerHTML = `
            <div class="budget-progress-header">
                <span class="budget-progress-category">${budget.category_name}</span>
                <span class="budget-progress-amount ${isOver ? 'over-budget' : ''}">
                    £${spent.toFixed(2)} / £${limit.toFixed(2)}
                </span>
            </div>
            <div class="budget-progress-bar">
                <div class="budget-progress-fill ${isOver ? 'over-budget' : ''}"
                     style="width: ${displayPercent}%"></div>
            </div>
        `;
        list.appendChild(card);
    });
}

/**
 * Main function: load all dashboard data and render every section
 */
async function loadDashboard() {
    const data = await fetchDashboardData();
    if (!data) return;

    renderSummary(data.total_spent);
    renderCategoryChart(data.spending_by_category);
    renderBudgetProgress(data.budgets);
}