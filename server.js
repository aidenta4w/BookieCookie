const express = require("express");
const cors = require("dotenv").config();
const corsMiddleware = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");

const app = express();

app.use(corsMiddleware());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Bookie Cookie backend running on port ${PORT}`);
});