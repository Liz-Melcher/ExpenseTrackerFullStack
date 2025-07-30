import JWT from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    console.log("🔐 Inside authMiddleware");
    console.log("Authorization Header:", req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized access" });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("✅ req.user set to:", req.user);

        next();
    } catch (error) {
        console.error("❌ Authentication error:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default authMiddleware;

