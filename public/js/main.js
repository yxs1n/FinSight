// Creates list of all my menu items
const navLinks = document.querySelectorAll('.nav-link');
// Creates list of all my views
const views = document.querySelectorAll('.view');

// Function to switch to a specific view
function switchView(targetId) {
    // Update nav links - remove active from all, add to matching one
    navLinks.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-target') === targetId) {
            l.classList.add('active');
        }
    });

    // Update views - hide all, show the target
    views.forEach(view => {
        view.classList.add('hidden');
        if (view.id === targetId) {
            view.classList.remove('hidden');
        }
    });
}

// Function to update nav based on login state
function updateNav(isLoggedIn) {
    navLinks.forEach(link => {
        const auth = link.getAttribute('data-auth');

        if (auth === 'user') {
            // Only visible to logged in users
            link.classList.toggle('hidden', !isLoggedIn); // when isLoggedIn = true hidden = false and vice versa
        } else if (auth === 'guest') {
            // Only visible to logged out users
            link.classList.toggle('hidden', isLoggedIn);
        }
    });
}

// Check auth status when page first loads
async function checkAuth() {
    try{
        const response = await fetch('/auth/status');
        const data = await response.json();

        if (data.loggedIn) {
            // User is logged in: show dashboard
            updateNav(true);
            switchView('dashboard-view');
        } else {
            // User is not logged in: show landing page
            updateNav(false);
            switchView('welcome-view');
        }
    } catch (err) {
        // If server is unreachable, default to logged out state
        updateNav(false);
        switchView('welcome-view');
    }
}

// Run auth check on page load
checkAuth();

// Loop through each nav link and add click event listener
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        //Prevents page from refreshing on click
        e.preventDefault();
        // Looks at data-target attribute of clicked link
        const target = link.getAttribute('data-target');
        if (target) { // Prevents 'switchView(null)' if log out link is pressed
            switchView(target);
        }
    });
});

// Handle auth links ("Already have an account?" / "Don't have an account?")
const authLinks = document.querySelectorAll('.auth-link');
authLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        switchView(target);
    });
});

// Handle logout
const logoutLink = document.getElementById('logout-link');
logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
        await fetch('/auth/logout', {method:'POST'});
    } catch (err) {
        console.error('Logout Error:', err);
    }

    // Whether logout suceeded or failed, go to logged out state
    updateNav(false);
    switchView('welcome-view');
})