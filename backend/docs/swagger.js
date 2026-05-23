const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bookie Cookie API",
      version: "1.0.0",
      description: "API documentation for Bookie Cookie backend",
    },
    servers: [
      {
        url:
          process.env.APP_BASE_URL ||
          `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
  },
  apis: ["./docs/openapi.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
