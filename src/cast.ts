import express from "express"
import type { Request , Response } from "express"
import { database } from "./db.js"

const cast=express.Router();

//   Cast data fetch

cast.get("/get-cast" , async(req:Request , res:Response)=>{
    try {
        const movie_id =req.query.movie_id;
        if(!movie_id){
            return res.status(400).json({success:false , message:"Movie ID not found"})
        }
        
        const [data]=await database.query("select * from movie_cast where movie_id=? ;",[movie_id]);
        return res.status(200).json({success:true , data:data , message:"Cast data feched sucessfull"})

    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false , message:"Can't fetch cast"})
    }
})


export default cast;