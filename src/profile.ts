import express from "express";
import type { Request, Response } from "express";
const profile = express.Router();
import authmiddelware from "./auth_middleware.js";
import { database } from "./db.js";

type UserProfile = {
    username: string;
    email: string;
    phone_number: string;
    plan_name: string | null;
    member_since: Date;
    isverified:string
};

// <------------------>
//     Profile get
// <------------------>

profile.get("/profile", authmiddelware, async (req: Request, res: Response) => {
    try {
        const user_id = req.authentication?.user_id;

        if (!user_id) {
            return res.status(401).json({ message: "User ID not found in token" });
        }

        const [rows] = await database.query(
            `SELECT 
                u.username,
                u.email,
                u.phone_number,
                u.isverified,
                u.created_at AS member_since,
                sp.plan_name
            FROM user_login AS u
            LEFT JOIN user_subscription AS us ON u.user_id = us.user_id AND us.status = 'active'
            LEFT JOIN subscription_plans AS sp ON us.plan_id = sp.plan_id
            WHERE u.user_id = ?;`,
            [user_id]
        );

        const userdata = rows as UserProfile[];

        if (!userdata || userdata.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userdata[0]!;

        return res.json({
            message: "Profile fetched successfully",
            data: {
                username: user.username,
                email: user.email,
                phone_number: user.phone_number,
                plan_name: user.plan_name || "Free Plan",
                member_since: user.member_since,
                emailverifed:user.isverified
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching profile" });
    }
});






export default profile;