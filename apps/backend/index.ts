import "dotenv/config"
import express from "express"
import Routes from "./routes/v1/index"
import cors from "cors"
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3001" }));
app.use((req, res, next) => {
    next();
});
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use("/api/v1", Routes)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})