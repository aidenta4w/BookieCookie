const { pool } = require("../config/db");

const getCurrentReadingBooks = async (userId) => {
  const result = await pool.query(
    `SELECT
        ub.id,
        b.id AS book_id,
        b.title,
        b.author,
        b.cover_image_url,
        ub.start_date,
        ub.updated_at
     FROM user_books ub
     INNER JOIN books b ON b.id = ub.book_id
     WHERE ub.user_id = $1
       AND ub.status = 'reading'
     ORDER BY ub.updated_at DESC
     LIMIT 10`,
    [userId]
  );

  return result.rows;
};

const getFinishedBooksInYear = async (userId, year) => {
  const result = await pool.query(
    `SELECT
        ub.id,
        b.id AS book_id,
        b.title,
        b.author,
        b.cover_image_url,
        ub.finish_date,
        ub.rating
     FROM user_books ub
     INNER JOIN books b ON b.id = ub.book_id
     WHERE ub.user_id = $1
       AND ub.status = 'finished'
       AND (
         ub.reading_year = $2
         OR EXTRACT(YEAR FROM ub.finish_date) = $2
       )
     ORDER BY ub.finish_date DESC NULLS LAST, ub.updated_at DESC
     LIMIT 12`,
    [userId, year]
  );

  return result.rows;
};

const getReadingActivityDates = async (userId) => {
  const result = await pool.query(
    `SELECT DISTINCT DATE(updated_at) AS activity_date
     FROM user_books
     WHERE user_id = $1
       AND status IN ('reading', 'finished')
     ORDER BY activity_date DESC`,
    [userId]
  );

  return result.rows.map((row) => row.activity_date);
};

module.exports = {
  getCurrentReadingBooks,
  getFinishedBooksInYear,
  getReadingActivityDates,
};
