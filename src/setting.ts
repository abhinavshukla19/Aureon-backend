import express from "express"
import type { Request , Response } from "express"
import authmiddeware from "./auth_middleware.js";
import { database } from "./db.js";
const setting=express.Router()


type UserProfile = {
    user_id: number;
    email: string;
    phone_number: string;
    plan_name: string | null;
    next_billing_date: string | null;
    status: string | null;
};


// <--------------------------->
//      Setting Detail
// <--------------------------->

setting.get("/settings", authmiddeware, async (req: Request, res: Response) => {
    try {
        const user_id = req.authentication?.user_id;

        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const [rows] = await database.query(
            `SELECT
                u.user_id,
                u.email,
                u.phone_number,
                us.end_date AS next_billing_date,
                us.status,
                sp.plan_name
            FROM user_login AS u
            LEFT JOIN user_subscription AS us
                ON u.user_id = us.user_id
                AND us.status = 'active'
            LEFT JOIN subscription_plans AS sp
                ON us.plan_id = sp.plan_id
            WHERE u.user_id = ?;
            `,
            [user_id]
        );

        const userdata = rows as UserProfile[];

        if (!userdata.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userdata[0]!;

        return res.status(200).json({
            message: "Data fetched successfully",
            data: {
                email: user.email,
                phone_number: user.phone_number,
                next_billing: user.next_billing_date || null,
                plan_name: user.plan_name || "Free plan",
                status: user.status 
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
});




export default setting;
