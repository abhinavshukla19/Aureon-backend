import express from "express"
import database from "./db.js"
import type{Request , Response} from "express"
import authmiddeware from "./auth_middleware.js";

const devices=express.Router();


// add device at login
devices.post("/add-devices", authmiddeware , async(req:Request , res:Response)=>{
        const user_id=req.authentication?.user_id;
        const { os, browser, location, device }=req.body;

    try{
        //later 

    } catch (error) {
        
        // later

    }
})



// Fetch total Device 


devices.get("/get-devices", authmiddeware ,async(req:Request , res:Response)=>{
    try {
        const user_id=req.authentication?.user_id;
        const { rows } = await database.query("SELECT * FROM user_devices WHERE user_id = $1 ; ", [user_id]) 
        return res.status(200).json({success:true , data:rows , message:"data fetched successfully"})
        
    } catch (error) {
        res.status(400).json({success:false , message:"Failed to fetch data"})
    }
})


export default devices;