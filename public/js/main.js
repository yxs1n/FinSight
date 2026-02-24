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

// Loop through each nav link and add click event listener
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        //Prevents page from refreshing on click
        e.preventDefault();
        // Looks at data-target attribute of clicked link
        const target = link.getAttribute('data-target');
        switchView(target);
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