const { pool } = require("../config/db");

const createQuote = async ({
  userId,
  userBookId,
  content,
  pageNumber = null,
  note = null,
  imageUrl = null,
  ocrText = null,
  ocrStatus = "manual",
  ocrConfidence = null,
  client = pool,
}) => {
  const ocrProcessedAt = ocrStatus === "processed" ? new Date() : null;

  const result = await client.query(
    `INSERT INTO quotes (
      user_id,
      user_book_id,
      content,
      page_number,
      note,
      image_url,
      ocr_text,
      ocr_status,
      ocr_confidence,
      ocr_processed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id,
      user_id,
      user_book_id,
      content,
      page_number,
      note,
      image_url,
      ocr_text,
      ocr_status,
      ocr_confidence,
      ocr_processed_at,
      created_at`,
    [
      userId,
      userBookId,
      content,
      pageNumber,
      note,
      imageUrl,
      ocrText,
      ocrStatus,
      ocrConfidence,
      ocrProcessedAt,
    ]
  );

  return result.rows[0];
};

const getQuotesByUserId = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT
        q.id,
        q.user_id,
        q.user_book_id,
        q.content,
        q.page_number,
        q.note,
        q.image_url,
        q.ocr_text,
        q.ocr_status,
        q.ocr_confidence,
        q.ocr_processed_at,
        q.created_at,
        b.title,
        b.author,
        b.cover_image_url
     FROM quotes q
     INNER JOIN user_books ub ON ub.id = q.user_book_id
     INNER JOIN books b ON b.id = ub.book_id
     WHERE q.user_id = $1
     ORDER BY q.created_at DESC, q.id DESC`,
    [userId]
  );

  return result.rows;
};

const getQuotesByUserBookId = async ({ userId, userBookId, client = pool }) => {
  const result = await client.query(
    `SELECT
        id,
        user_id,
        user_book_id,
        content,
        page_number,
        note,
        image_url,
        ocr_text,
        ocr_status,
        ocr_confidence,
        ocr_processed_at,
        created_at
     FROM quotes
     WHERE user_id = $1
       AND user_book_id = $2
     ORDER BY created_at DESC, id DESC`,
    [userId, userBookId]
  );

  return result.rows;
};

module.exports = {
  createQuote,
  getQuotesByUserId,
  getQuotesByUserBookId,
};
