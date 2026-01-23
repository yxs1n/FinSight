// Creates list of all my menu items
const navLinks = document.querySelectorAll('.nav-link');
// Creates list of all my views
const views = document.querySelectorAll('.view');

// Loop through each nav link and add click event listener
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        //Prevents page from refreshing on click
        e.preventDefault();
        // Loops through each nav item to find current active link and change to new active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // Looks at data-target attribute of clicked link
        const target = link.getAttribute('data-target');
        // Loops through each view to show/hide based on clicked link
        views.forEach(view => {
            // Adds hidden class to all views
            view.classList.add('hidden');
            // Identifies target view
            if(view.id === target) {
                //Removes hidden class from target view
                view.classList.remove('hidden');
            }
        });
    });
});

        