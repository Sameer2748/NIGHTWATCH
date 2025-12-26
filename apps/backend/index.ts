import "dotenv/config"
import express from "express"
import Routes from "./routes/v1/index"
import cors from "cors"
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));
app.use("/api/v1", Routes)

app.listen(PORT, () => {
    console.log("runnning on port 3000");
})