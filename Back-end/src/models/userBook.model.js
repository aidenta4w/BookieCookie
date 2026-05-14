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
      start_date,
      finish_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, user_id, book_id, status, rating, note, reading_year, start_date, finish_date, created_at, updated_at`,
    [userId, bookId, status, rating, note, readingYear, startDate, finishDate]
  );

  return result.rows[0];
};

const getUserLibrary = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT
        ub.id,
        ub.book_id,
        ub.status,
        ub.rating,
        ub.note,
        ub.reading_year,
        ub.start_date,
        ub.finish_date,
        ub.updated_at,
        b.title,
        b.author,
        b.cover_image_url
     FROM user_books ub
     INNER JOIN books b ON b.id = ub.book_id
     WHERE ub.user_id = $1
     ORDER BY ub.updated_at DESC, ub.id DESC`,
    [userId]
  );

  return result.rows;
};

const getUserBookDetail = async ({ userBookId, userId, client = pool }) => {
  const result = await client.query(
    `SELECT
        ub.id,
        ub.user_id,
        ub.book_id,
        ub.status,
        ub.rating,
        ub.note,
        ub.reading_year,
        ub.start_date,
        ub.finish_date,
        ub.created_at,
        ub.updated_at,
        b.title,
        b.author,
        b.category,
        b.isbn,
        b.published_year,
        b.description,
        b.cover_image_url
     FROM user_books ub
     INNER JOIN books b ON b.id = ub.book_id
     WHERE ub.id = $1 AND ub.user_id = $2
     LIMIT 1`,
    [userBookId, userId]
  );

  return result.rows[0] ?? null;
};

const updateUserBook = async ({
  userBookId,
  status,
  rating,
  note,
  readingYear,
  startDate,
  finishDate,
  client = pool,
}) => {
  const result = await client.query(
    `UPDATE user_books
     SET status = $2,
         rating = $3,
         note = $4,
         reading_year = $5,
         start_date = $6,
         finish_date = $7
     WHERE id = $1
     RETURNING id, user_id, book_id, status, rating, note, reading_year, start_date, finish_date, created_at, updated_at`,
    [userBookId, status, rating, note, readingYear, startDate, finishDate]
  );

  return result.rows[0];
};

const createReadingSession = async ({
  userId,
  userBookId,
  durationMinutes,
  pagesRead = 0,
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO reading_sessions (
      user_id,
      user_book_id,
      duration_minutes,
      pages_read
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, user_book_id, duration_minutes, pages_read, created_at`,
    [userId, userBookId, durationMinutes, pagesRead]
  );

  return result.rows[0];
};

const getReadingSessionsByUserBook = async ({
  userBookId,
  userId,
  client = pool,
}) => {
  const result = await client.query(
    `SELECT
        id,
        user_id,
        user_book_id,
        duration_minutes,
        pages_read,
        created_at
     FROM reading_sessions
     WHERE user_book_id = $1
       AND user_id = $2
     ORDER BY created_at DESC, id DESC`,
    [userBookId, userId]
  );

  return result.rows;
};

module.exports = {
  TABLE_NAME,
  STATUSES,
  createUserBook,
  getUserLibrary,
  getUserBookDetail,
  updateUserBook,
  createReadingSession,
  getReadingSessionsByUserBook,
};
