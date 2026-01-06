import express from "express"
import type { Request , Response } from "express";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { database } from "./db.js";

const auth= express.Router();


type UserRow = {
    user_id: number;
    email: string;
    phone_number: string;
    password: string;
    username: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
};



//   <--------------------->
        // for signup
//   <--------------------->

auth.post("/signup",async (req: Request, res: Response)=>{
    try {
        const { username , phonenumber , email , password }=req.body;
        if (!username || !email || !phonenumber || !password) {
            console.error("Incomplete fields");
            return res.status(400).json({ message: "Please fill all the fields" });
    }
    const saltround=10;
    const hashpassword=await bcrypt.hash(password,saltround);

     const [existing] = await database.query<any>(
      "SELECT * FROM user_login WHERE email = ? OR phone_number = ? LIMIT 1",
      [email, phonenumber]
    );
    const typedExisting = existing as UserRow[];

    if (typedExisting.length > 0) {
    return res.status(409).json({ message: "User already exists" });
    }

    await database.query("insert into user_login (username , email , password , phone_number) values(?,?,?,?)",
        [username , email , hashpassword , phonenumber] )
    
    return res.status(201).json({
    message: "User registered successfully"
    });

        
    } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
    message: "Something went wrong. Please try again later."
  });
}
});




//   <--------------------->
        // for signin
//   <--------------------->
auth.post("/signin", async (req: Request, res: Response) => {
    try {
        const { email, phonenumber, password } = req.body;
        const secret_key = process.env.jwt_secret_key as string;

        // Validation: Check if required fields are provided
        if ((!email && !phonenumber) || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email/Phone number and password are required" 
            });
        }

        // Check if secret key exists
        if (!secret_key) {
            console.error("JWT secret key is not defined");
            return res.status(500).json({ 
                success: false,
                message: "Server configuration error" 
            });
        }

        // Query database based on email or phone number
        let rows;
        if (email) {
            [rows] = await database.query(
                "SELECT * FROM user_login WHERE email = ?",
                [email]
            );
        } else if (phonenumber) {
            [rows] = await database.query(
                "SELECT * FROM user_login WHERE phone_number = ?",
                [phonenumber]
            );
        }

        const userData = rows as unknown as UserRow[];

        // Check if user exists
        if (!userData || userData.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "User doesn't exist" 
            });
        }

        const user = userData[0]!;
        const user_id = user.user_id;
        const hashpassword = user.password;

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, hashpassword);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: "Email/Phone number or password is incorrect" 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id, 
                email: user.email 
            },
            secret_key
        );

        // Update last login timestamp
        await database.query(
            "UPDATE user_login SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
            [user_id]
        );

        // Success response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
        });

    } catch (error) {
        console.error("Signin error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Something went wrong. Please try again later" 
        });
    }
});

export default auth;
