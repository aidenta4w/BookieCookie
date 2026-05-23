const express = require("express");
const multer = require("multer");
const path = require("path");
const quoteController = require("../controller/quote.controller");

const router = express.Router();
const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
  ".heif",
]);

const isAcceptedImageFile = (file) => {
  const mimeType = `${file.mimetype ?? ""}`.toLowerCase();
  const extension = path.extname(file.originalname ?? "").toLowerCase();

  if (mimeType.startsWith("image/")) {
    return true;
  }

  return allowedExtensions.has(extension);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (isAcceptedImageFile(file)) {
      cb(null, true);
      return;
    }

    cb(new Error("Quote image must be an image"));
  },
});

router.get("/user/:userId", quoteController.getQuotesByUserId);
router.get("/book/:userBookId", quoteController.getQuotesByUserBookId);

router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Quote image must be 5MB or smaller"
        : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid quote image upload",
    });
  });
}, quoteController.createQuote);

module.exports = router;
