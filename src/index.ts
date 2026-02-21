import dotenv from "dotenv";
dotenv.config()
import express from "express"
import cors from "cors"
import auth from "./auth.js";
import profile from "./profile.js";
import setting from "./setting.js";
import movie from "./movie.js";
import mylist from "./mylist.js";
import cast from "./cast.js";
import devices from "./devices.js";
import otp from "./otp.js";
import health from "./healthcheck.js";
import update from "./credential_update.js";
import { verifyMailConnection } from './utils/mail.js';

const app=express();
const PORT= process.env.PORT || 3001;

app.use(express.json())
app.use(cors())


app.use(health)
app.use(auth);
app.use(otp);
app.use(profile)
app.use(setting)
app.use(movie)
app.use(mylist)
app.use(cast)
app.use(devices)
app.use(update)


const start = async () => {
  await verifyMailConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();
