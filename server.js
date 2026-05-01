require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const { initSchema } = require("./src/migrations/initSchema");
const authRoutes = require("./src/routes/auth.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initSchema();

  app.listen(PORT, () => {
    console.log(`Bookie Cookie backend running on port ${PORT}`);
  });
};

startServer();
