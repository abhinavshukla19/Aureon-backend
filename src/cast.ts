import express from "express"
import type { Request , Response } from "express"
import database from "./db.js"  

const cast=express.Router();

//   Cast data fetch

cast.get("/get-cast" , async(req:Request , res:Response)=>{
    try {
        const movie_id =req.query.movie_id;
        if(!movie_id){
            return res.status(400).json({success:false , message:"Movie ID not found"})
        }
        
        const { rows } = await database.query("SELECT a.name , a.profile_url , mc.character_name FROM movie_cast mc JOIN actors a ON mc.actor_id = a.actor_id WHERE mc.movie_id = $1;",[movie_id]);
        return res.status(200).json({success:true , data:rows , message:"Cast data feched sucessfull"})

    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false , message:"Can't fetch cast"})
    }
})


export default cast;