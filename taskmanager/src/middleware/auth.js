const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "4eb2e0812ce8ece5ce36681d78ea793452803c0a46044082f24d62e50b6c5b2b80f0a731b163656490b5ae7915259a5582316f365f181a8df9b22e501be986de";

function auth(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        // Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];
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
