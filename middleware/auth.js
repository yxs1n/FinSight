// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    // Check if the session has a userId
    if (req.session && req.session.userId) {
        // User is logged in
        return next();
    }

    // User is not logged in
    res.status(401).json({error: 'You must be logged in to access this'});
}

module.exports = {isAuthenticated};