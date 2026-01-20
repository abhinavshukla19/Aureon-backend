import express  from "express";
import { database } from "./db.js";
import type{Request , Response } from "express";
import authmiddeware from "./auth_middleware.js";
import movie from "./movie.js";

const mylist=express.Router();


type rowdata={
     movie_id: number,
    title: string;
    release_year: number,
    duration: number,
    genre: string,
    banner_url: string,
    type: string,
  }


// <---------------------------->
//      mylist movie add fetch
// <---------------------------->

mylist.post("/add-to-mylist", authmiddeware , async(req:Request , res:Response)=>{
    const { movie_id }=req.body;
    try { 
        const user_id=req.authentication?.user_id;
        if(!user_id){
            return res.status(401).json({success:false , message:"User id not found"})
        }

        const [existing]=await database.query("SELECT 1 FROM my_list WHERE user_id = ? AND movie_id = ? LIMIT 1;",[user_id,movie_id])
        const data = existing as rowdata[] | any;
    

        if (data.length > 0) {
            await database.query("DELETE FROM my_list WHERE user_id=? AND movie_id=? ;",[user_id,movie_id])
            return res.json({ success: false, message: "Removed from list" });
        }

        await database.query("INSERT INTO my_list (user_id, movie_id) VALUES (?, ?);",[user_id,movie_id])
        return res.status(200).json({success:true , message:"Added to list"})

    } catch (error) {
        console.log(error);
        return res.status(404).json({success:false , message:"Failed to add"})
    }
})




// <---------------------------->
//      mylist movie fetch
// <---------------------------->

mylist.get("/get_my_list", authmiddeware ,async(req:Request , res:Response)=>{
    try{
        const user_id = req.authentication?.user_id;
        if(!user_id){
            return res.status(401).json({success :false , message:"Don't be oversmart! Sign in first"})
        }
        
        const[rows]=await database.query("SELECT m.movie_id, m.title, m.banner_url, m.type FROM my_list ml JOIN movies m ON ml.movie_id = m.movie_id WHERE ml.user_id = ? ORDER BY ml.created_at DESC",[user_id]);
        const mylistdata = rows as rowdata[]

        return res.status(200).json({success:true , 
            data:mylistdata,
            message:"Data Fetched sucessfully"})
        
    }
    catch(error){
        console.log(error)
        return res.status(404).json({success:false , message:"Error in fetching data"})
    }
})



// <--------------------------------->
//      mylist movie remove fetch
// <--------------------------------->

mylist.post("/remove-from-mylist", authmiddeware , async(req:Request , res:Response)=>{
    
    try {
        const user_id=await req.authentication?.user_id;
        const { movie_id }=req.body;
        if(!user_id){
            return res.status(401).json({success:false , message:"User id not found"})
        }
        if(!movie_id){
            return res.status(401).json({success:false , message:"movie id not found"})
        }

        const [result]=await database.query("DELETE FROM my_list WHERE user_id=? AND movie_id=? ;",[user_id,movie_id])
        console.log(result)
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({success: false, message: "Movie not found in My List"});
        }

        return res.status(200).json({success: true, message: "Item removed from My List"});

    } catch (error) {
        console.log(error)
        return res.status(404).json({success:false , message:"Failed to remove"})
    }
})


export default mylist;