import express,{Request,Response} from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js" 
import leadRoutes from "./routes/lead.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth",authRoutes);
app.use("/api", leadRoutes);
app.get("/", (req,res) => {
    res.json({
        success: true,
        message: "leadflow crm is running",
    });
});
export default app;
