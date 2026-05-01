const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bookie Cookie Backend API",
      version: "1.0.0",
      description: "API documentation for authentication routes in the Bookie Cookie backend.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
    ],
    components: {
      schemas: {
        SignupRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "Nguyen Van A",
            },
            email: {
              type: "string",
              format: "email",
              example: "vana@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "123456",
            },
            avatar_url: {
              type: "string",
              nullable: true,
              example: "https://example.com/avatar.png",
            },
            bio: {
              type: "string",
              nullable: true,
              example: "I love books and coffee.",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "vana@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "123456",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Nguyen Van A",
            },
            email: {
              type: "string",
              format: "email",
              example: "vana@example.com",
            },
            avatar_url: {
              type: "string",
              nullable: true,
              example: "https://example.com/avatar.png",
            },
            bio: {
              type: "string",
              nullable: true,
              example: "I love books and coffee.",
            },
          },
        },
        SignupSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Sign up successfully",
            },
            data: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        LoginSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login successfully",
            },
            data: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                user: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Invalid email or password",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJSDoc(options);
