require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const { initSchema } = require("./src/migrations/initSchema");
const authRoutes = require("./src/routes/auth.route");
const homeRoutes = require("./src/routes/home.route");
const quoteRoutes = require("./src/routes/quote.route");
const bookRoutes = require("./src/routes/book.route");
const userBookRoutes = require("./src/routes/userBook.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/user-books", userBookRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initSchema();

  app.listen(PORT, () => {
    console.log(`Bookie Cookie backend running on port ${PORT}`);
    console.log(`API docs: http://localhost:${PORT}/api-docs`);
  });
};

startServer();
