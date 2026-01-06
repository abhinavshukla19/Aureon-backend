import type { NextFunction, Request , Response } from "express";
import jwt from "jsonwebtoken"


interface JWTPayload {
    user_id: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            authentication?: JWTPayload;
        }
    }
}

const authmiddeware= async(req:Request , res:Response , next:NextFunction)=>{
    try {
        const secret_key=process.env.jwt_secret_key as string;
        const token =req.headers.token as string; 
        if (!token) {
            return res.status(401).json({ message: "Token is not available" });
        }
        const authentication = jwt.verify(token, secret_key) as JWTPayload;

        if (!authentication) {
            return res.status(401).json({ message: "Token is invalid or expired" });
        }

        req.authentication = authentication;
        next();

    } catch (error) {
        console.log(error)
        return res.json({message:"Error in authentication"})
    }
}

export default authmiddeware;