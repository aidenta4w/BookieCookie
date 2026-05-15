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
        ub.updated_at,
        ub.rating
     FROM user_books ub
     INNER JOIN books b ON b.id = ub.book_id
     WHERE ub.user_id = $1
       AND ub.status = 'finished'
       AND COALESCE(
         ub.reading_year,
         EXTRACT(YEAR FROM ub.finish_date)::INT,
         EXTRACT(YEAR FROM ub.updated_at)::INT
       ) = $2
     ORDER BY COALESCE(ub.finish_date, DATE(ub.updated_at)) DESC, ub.updated_at DESC
     LIMIT 12`,
    [userId, year]
  );

  return result.rows;
};

const getFinishedBookCountInYear = async (userId, year) => {
  const result = await pool.query(
    `SELECT COUNT(*)::INT AS finished_count
     FROM user_books ub
     WHERE ub.user_id = $1
       AND ub.status = 'finished'
       AND COALESCE(
         ub.reading_year,
         EXTRACT(YEAR FROM ub.finish_date)::INT,
         EXTRACT(YEAR FROM ub.updated_at)::INT
       ) = $2`,
    [userId, year]
  );

  return result.rows[0]?.finished_count ?? 0;
};

const getReadingActivityDates = async (userId) => {
  const result = await pool.query(
    `SELECT activity_date
     FROM (
       SELECT DISTINCT DATE(created_at) AS activity_date
       FROM reading_sessions
       WHERE user_id = $1

       UNION

       SELECT DISTINCT DATE(created_at) AS activity_date
       FROM quotes
       WHERE user_id = $1

       UNION

       SELECT DISTINCT COALESCE(finish_date, DATE(updated_at)) AS activity_date
       FROM user_books
       WHERE user_id = $1
         AND status = 'finished'
     ) activity_days
     WHERE activity_date IS NOT NULL
     ORDER BY activity_date DESC`,
    [userId]
  );

  return result.rows.map((row) => row.activity_date);
};

const getTodayReadingStats = async (userId) => {
  const result = await pool.query(
    `SELECT
        COALESCE(SUM(duration_minutes), 0)::INT AS minutes,
        COALESCE(SUM(pages_read), 0)::INT AS pages_read
     FROM reading_sessions
     WHERE user_id = $1
       AND created_at >= CURRENT_DATE
       AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
    [userId]
  );

  return result.rows[0];
};

const getWeeklyReadingStats = async (userId) => {
  const result = await pool.query(
    `WITH week_days AS (
       SELECT generate_series(
         date_trunc('week', CURRENT_DATE)::DATE,
         (date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '6 day')::DATE,
         INTERVAL '1 day'
       )::DATE AS day_date
     )
     SELECT
       wd.day_date,
       COALESCE(SUM(rs.duration_minutes), 0)::INT AS minutes,
       COALESCE(SUM(rs.pages_read), 0)::INT AS pages_read
     FROM week_days wd
     LEFT JOIN reading_sessions rs
       ON rs.user_id = $1
      AND rs.created_at >= wd.day_date
      AND rs.created_at < wd.day_date + INTERVAL '1 day'
     GROUP BY wd.day_date
     ORDER BY wd.day_date ASC`,
    [userId]
  );

  return result.rows;
};

const getMonthlyReadingStats = async (userId) => {
  const result = await pool.query(
    `WITH month_days AS (
       SELECT generate_series(
         date_trunc('month', CURRENT_DATE)::DATE,
         (
           date_trunc('month', CURRENT_DATE)
           + INTERVAL '1 month'
           - INTERVAL '1 day'
         )::DATE,
         INTERVAL '1 day'
       )::DATE AS day_date
     )
     SELECT
       md.day_date,
       COALESCE(SUM(rs.duration_minutes), 0)::INT AS minutes,
       COALESCE(SUM(rs.pages_read), 0)::INT AS pages_read
     FROM month_days md
     LEFT JOIN reading_sessions rs
       ON rs.user_id = $1
      AND rs.created_at >= md.day_date
      AND rs.created_at < md.day_date + INTERVAL '1 day'
     GROUP BY md.day_date
     ORDER BY md.day_date ASC`,
    [userId]
  );

  return result.rows;
};

const getYearlyQuoteCount = async (userId, year) => {
  const result = await pool.query(
    `SELECT COUNT(*)::INT AS quote_count
     FROM quotes
     WHERE user_id = $1
       AND created_at >= MAKE_DATE($2, 1, 1)
       AND created_at < MAKE_DATE($2 + 1, 1, 1)`,
    [userId, year]
  );

  return result.rows[0]?.quote_count ?? 0;
};

const getYearlyReadingMinutes = async (userId, year) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(duration_minutes), 0)::INT AS total_minutes
     FROM reading_sessions
     WHERE user_id = $1
       AND created_at >= MAKE_DATE($2, 1, 1)
       AND created_at < MAKE_DATE($2 + 1, 1, 1)`,
    [userId, year]
  );

  return result.rows[0]?.total_minutes ?? 0;
};

const getYearlyActivityLevels = async (userId, year) => {
  const result = await pool.query(
    `WITH days AS (
       SELECT generate_series(
         MAKE_DATE($2, 1, 1),
         MAKE_DATE($2, 12, 31),
         INTERVAL '1 day'
       )::DATE AS day_date
     ),
     session_activity AS (
       SELECT
         DATE(created_at) AS activity_date,
         COALESCE(SUM(duration_minutes), 0)::INT AS minutes
       FROM reading_sessions
       WHERE user_id = $1
         AND created_at >= MAKE_DATE($2, 1, 1)
         AND created_at < MAKE_DATE($2 + 1, 1, 1)
       GROUP BY DATE(created_at)
     ),
     quote_activity AS (
       SELECT
         DATE(created_at) AS activity_date,
         COUNT(*)::INT AS quotes_count
       FROM quotes
       WHERE user_id = $1
         AND created_at >= MAKE_DATE($2, 1, 1)
         AND created_at < MAKE_DATE($2 + 1, 1, 1)
       GROUP BY DATE(created_at)
     )
     SELECT
       d.day_date,
       COALESCE(sa.minutes, 0) AS minutes,
       COALESCE(qa.quotes_count, 0) AS quotes_count,
       CASE
         WHEN COALESCE(sa.minutes, 0) >= 120 THEN 4
         WHEN COALESCE(sa.minutes, 0) >= 60 THEN 3
         WHEN COALESCE(sa.minutes, 0) >= 20 THEN 2
         WHEN COALESCE(sa.minutes, 0) > 0 OR COALESCE(qa.quotes_count, 0) > 0 THEN 1
         ELSE 0
       END AS level
     FROM days d
     LEFT JOIN session_activity sa ON sa.activity_date = d.day_date
     LEFT JOIN quote_activity qa ON qa.activity_date = d.day_date
     ORDER BY d.day_date ASC`,
    [userId, year]
  );

  return result.rows;
};

const getReadingGoals = async (userId, year, month) => {
  const result = await pool.query(
    `SELECT
        id,
        goal_type,
        target_value,
        year,
        month,
        created_at
     FROM reading_goals
     WHERE user_id = $1
       AND year = $2
       AND (month IS NULL OR month = $3)
     ORDER BY month NULLS FIRST, created_at DESC`,
    [userId, year, month]
  );

  return result.rows;
};

const upsertReadingGoal = async ({
  userId,
  goalType,
  targetValue,
  year,
  month = null,
  client = pool,
}) => {
  const updated = await client.query(
    `UPDATE reading_goals
     SET target_value = $3,
         created_at = NOW()
     WHERE user_id = $1
       AND goal_type = $2
       AND year = $4
       AND (
         (month IS NULL AND $5::INT IS NULL)
         OR month = $5
       )
     RETURNING id, user_id, goal_type, target_value, year, month, created_at`,
    [userId, goalType, targetValue, year, month]
  );

  if (updated.rows[0]) {
    return updated.rows[0];
  }

  const inserted = await client.query(
    `INSERT INTO reading_goals (
      user_id,
      goal_type,
      target_value,
      year,
      month
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, goal_type, target_value, year, month, created_at`,
    [userId, goalType, targetValue, year, month]
  );

  return inserted.rows[0];
};

module.exports = {
  getCurrentReadingBooks,
  getFinishedBooksInYear,
  getFinishedBookCountInYear,
  getReadingActivityDates,
  getTodayReadingStats,
  getWeeklyReadingStats,
  getMonthlyReadingStats,
  getYearlyQuoteCount,
  getYearlyReadingMinutes,
  getYearlyActivityLevels,
  getReadingGoals,
  upsertReadingGoal,
};
