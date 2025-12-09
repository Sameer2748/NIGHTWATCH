import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";



export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            res.status(401).json({ message: "Unauthorized - No token provided" });
            return; // Return void, not the response object
        }

        // Extract token (handle "Bearer <token>" format)
        const token = authHeader.startsWith("Bearer ") 
            ? authHeader.substring(7) 
            : authHeader;

        if (!token) {
            res.status(401).json({ message: "Unauthorized - Invalid token format" });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        // Attach userId to request
        req.userId = decoded.sub as string;
        
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Unauthorized - Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Unauthorized - Token expired" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
};