/**
 * Register Form
 */
const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

registerForm.addEventListener('submit', async (e) => {
    // This stops browser from refreshing
    e.preventDefault();

    // Hide any error messages
    registerError.classList.add('hidden');

    // Grab the values from the form inputs
    const first_name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
        // Send data to backend
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({first_name, email, password})
        });

        // Parse the JSON response
        const data = await response.json();

        // Check if the request was successful
        if (!response.ok) {
            // Show error message from server
            registerError.textContent = data.error;
            registerError.classList.remove('hidden');
            return;
        }

        // Clear the form
        registerForm.reset();

        // Switch to dashboard view
        switchView('dashboard-view');
    } catch (err) {
        // Network error
        registerError.textContent = 'Could not connect to server. Please try again.';
        registerError.classList.remove('hidden');
    }
})