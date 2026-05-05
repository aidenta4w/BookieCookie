const express = require("express");
const multer = require("multer");
const path = require("path");
const userBookController = require("../controller/userBook.controller");

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

    cb(new Error("Cover file must be an image"));
  },
});

router.get("/detail/:userBookId", userBookController.getUserBookDetail);

router.post("/:userBookId/start-reading", userBookController.startReadingBook);

router.post("/manual/:userBookId/update", (req, res, next) => {
  upload.single("cover")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Cover image must be 5MB or smaller"
        : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid cover upload",
    });
  });
}, userBookController.updateManualBook);

router.get("/:userId", userBookController.getUserLibrary);

router.post("/manual", (req, res, next) => {
  upload.single("cover")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Cover image must be 5MB or smaller"
        : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid cover upload",
    });
  });
}, userBookController.createManualBook);

module.exports = router;
