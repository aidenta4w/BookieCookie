const TABLE_NAME = "user_books";
const STATUSES = ["plan_to_read", "reading", "finished", "abandoned"];

const { pool } = require("../config/db");

const createUserBook = async ({
  userId,
  bookId,
  status = "plan_to_read",
  rating = null,
  note = null,
  readingYear = null,
  currentPage = 0,
  startDate = null,
  finishDate = null,
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO user_books (
      user_id,
      book_id,
      status,
      rating,
      note,
      reading_year,
      current_page,
      start_date,
      finish_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, user_id, book_id, status, rating, note, reading_year, current_page, start_date, finish_date, created_at, updated_at`,
    [userId, bookId, status, rating, note, readingYear, currentPage, startDate, finishDate]
  );

  return result.rows[0];
};

module.exports = {
  TABLE_NAME,
  STATUSES,
  createUserBook,
};
