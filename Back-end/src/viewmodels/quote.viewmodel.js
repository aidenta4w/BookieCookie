const { pool } = require("../config/db");
const { uploadBufferToCloudinary } = require("../config/cloudinary");
const quoteModel = require("../models/quote.model");
const userBookModel = require("../models/userBook.model");

const parseRequiredPositiveInteger = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsedValue;
};

const parseOptionalPositiveInteger = (value, fieldName) => {
  if (value === undefined || value === null || `${value}`.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsedValue;
};

const parseOptionalConfidence = (value) => {
  if (value === undefined || value === null || `${value}`.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 100) {
    throw new Error("Invalid OCR confidence");
  }

  return parsedValue;
};

const createQuote = async (payload, imageFile) => {
  const userId = parseRequiredPositiveInteger(payload?.user_id, "user id");
  const userBookId = parseRequiredPositiveInteger(
    payload?.user_book_id,
    "user book id"
  );
  const content = `${payload?.content ?? ""}`.trim();
  const note = `${payload?.note ?? ""}`.trim();
  const ocrText = `${payload?.ocr_text ?? ""}`.trim();
  const ocrStatus = `${payload?.ocr_status ?? "manual"}`.trim() || "manual";
  const pageNumber = parseOptionalPositiveInteger(
    payload?.page_number,
    "page number"
  );
  const ocrConfidence = parseOptionalConfidence(payload?.ocr_confidence);

  if (!content && !imageFile?.buffer) {
    throw new Error("Quote content or image is required");
  }

  if (!["manual", "pending", "processed", "failed"].includes(ocrStatus)) {
    throw new Error("Invalid OCR status");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingDetail = await userBookModel.getUserBookDetail({
      userBookId,
      userId,
      client,
    });

    if (!existingDetail) {
      throw new Error("Book detail not found");
    }

    let imageUrl = null;

    if (imageFile?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(imageFile.buffer, {
        originalFilename: imageFile.originalname,
        folder: "bookiecookie/quotes",
      });
      imageUrl = uploadResult.secure_url;
    }

    const quote = await quoteModel.createQuote({
      userId,
      userBookId,
      content: content || ocrText || null,
      pageNumber,
      note: note || null,
      imageUrl,
      ocrText: ocrText || null,
      ocrStatus,
      ocrConfidence,
      client,
    });

    await client.query("COMMIT");

    return quote;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getQuotesByUserId = async (userIdParam) => {
  const userId = parseRequiredPositiveInteger(userIdParam, "user id");
  return quoteModel.getQuotesByUserId(userId);
};

const getQuotesByUserBookId = async ({ userBookId, userId }) => {
  const parsedUserBookId = parseRequiredPositiveInteger(
    userBookId,
    "user book id"
  );
  const parsedUserId = parseRequiredPositiveInteger(userId, "user id");

  return quoteModel.getQuotesByUserBookId({
    userId: parsedUserId,
    userBookId: parsedUserBookId,
  });
};

module.exports = {
  createQuote,
  getQuotesByUserId,
  getQuotesByUserBookId,
};
