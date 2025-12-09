import "dotenv/config"
import express from "express"
import Routes from "./routes/v1/index"
const PORT = process.env.PORT || 3000;
const app  = express();

app.use(express.json());
app.use("/api/v1", Routes)

app.listen(PORT,()=>{
    console.log("runnning on port 3000");
})