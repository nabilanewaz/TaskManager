const jwt = require('jsonwebtoken');
const JWT_SECRET = "secretkey";

function auth(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

function roleCheck(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access forbidden' });
        }
        next();
    };
}

module.exports = { auth, roleCheck };
