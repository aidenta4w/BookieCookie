const TABLE_NAME = "user_books";
const STATUSES = ["plan_to_read", "reading", "finished", "abandoned"];

const { pool } = require("../config/db");

const createUserBook = async ({
  userId,
  title,
  author = "Unknown author",
  category = null,
  isbn = null,
  publishedYear = null,
  description = null,
  coverImageUrl = null,
  status = "plan_to_read",
  rating = null,
  startDate = null,
  finishDate = null,
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO user_books (
      user_id,
      title,
      author,
      category,
      isbn,
      published_year,
      description,
      cover_image_url,
      status,
      rating,
      start_date,
      finish_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING
      id,
      user_id,
      id AS book_id,
      title,
      author,
      category,
      isbn,
      published_year,
      description,
      cover_image_url,
      status,
      rating,
      start_date,
      finish_date,
      created_at,
      updated_at`,
    [
      userId,
      title,
      author,
      category,
      isbn,
      publishedYear,
      description,
      coverImageUrl,
      status,
      rating,
      startDate,
      finishDate,
    ]
  );

  return result.rows[0];
};

const getUserLibrary = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT
        id,
        id AS book_id,
        status,
        rating,
        published_year,
        start_date,
        finish_date,
        created_at,
        updated_at,
        title,
        author,
        cover_image_url
     FROM user_books ub
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
        ub.id AS book_id,
        ub.status,
        ub.rating,
        ub.start_date,
        ub.finish_date,
        ub.created_at,
        ub.updated_at,
        ub.title,
        ub.author,
        ub.category,
        ub.isbn,
        ub.published_year,
        ub.description,
        ub.cover_image_url
     FROM user_books ub
     WHERE ub.id = $1 AND ub.user_id = $2
     LIMIT 1`,
    [userBookId, userId]
  );

  return result.rows[0] ?? null;
};

const updateUserBook = async ({
  userBookId,
  title,
  author = "Unknown author",
  category = null,
  isbn = null,
  publishedYear = null,
  description = null,
  coverImageUrl = null,
  status,
  rating,
  startDate,
  finishDate,
  client = pool,
}) => {
  const result = await client.query(
    `UPDATE user_books
     SET status = $2,
         rating = $3,
         start_date = $4,
         finish_date = $5,
         title = $6,
         author = $7,
         category = $8,
         isbn = $9,
         published_year = $10,
         description = $11,
         cover_image_url = $12
     WHERE id = $1
     RETURNING
       id,
       user_id,
       id AS book_id,
       title,
       author,
       category,
       isbn,
       published_year,
       description,
       cover_image_url,
       status,
       rating,
       start_date,
       finish_date,
       created_at,
       updated_at`,
    [
      userBookId,
      status,
      rating,
      startDate,
      finishDate,
      title,
      author,
      category,
      isbn,
      publishedYear,
      description,
      coverImageUrl,
    ]
  );

  return result.rows[0];
};

const createReadingSession = async ({
  userId,
  userBookId,
  durationSeconds,
  pagesRead = 0,
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO reading_sessions (
      user_id,
      user_book_id,
      duration_seconds,
      pages_read
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, user_book_id, duration_seconds, pages_read, created_at`,
    [userId, userBookId, durationSeconds, pagesRead]
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
        duration_seconds,
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

const deleteUserBook = async ({ userBookId, userId, client = pool }) => {
  const result = await client.query(
    `DELETE FROM user_books
     WHERE id = $1
       AND user_id = $2
     RETURNING id, user_id, status, finish_date, updated_at`,
    [userBookId, userId]
  );

  return result.rows[0] ?? null;
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
  deleteUserBook,
};
