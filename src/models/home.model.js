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
    `SELECT stat_date AS activity_date
     FROM user_daily_statistics
     WHERE user_id = $1
       AND activity_level > 0
     ORDER BY stat_date DESC`,
    [userId]
  );

  return result.rows.map((row) => row.activity_date);
};

const getCurrentDate = async () => {
  const result = await pool.query(`SELECT CURRENT_DATE::DATE AS today`);
  return result.rows[0]?.today ?? null;
};

const getTodayReadingStats = async (userId) => {
  const result = await pool.query(
    `SELECT
        COALESCE(reading_minutes, 0)::INT AS minutes,
        COALESCE(pages_read, 0)::INT AS pages_read
     FROM user_daily_statistics
     WHERE user_id = $1
       AND stat_date = CURRENT_DATE`,
    [userId]
  );

  return result.rows[0] ?? { minutes: 0, pages_read: 0 };
};

const getWeeklyReadingStats = async (userId, anchorDate) => {
  const result = await pool.query(
    `WITH week_days AS (
       SELECT generate_series(
         date_trunc('week', $2::DATE)::DATE,
         (date_trunc('week', $2::DATE)::DATE + INTERVAL '6 day')::DATE,
         INTERVAL '1 day'
       )::DATE AS day_date
     )
     SELECT
       wd.day_date,
       COALESCE(uds.reading_minutes, 0)::INT AS minutes,
       COALESCE(uds.pages_read, 0)::INT AS pages_read
     FROM week_days wd
     LEFT JOIN user_daily_statistics uds
       ON uds.user_id = $1
      AND uds.stat_date = wd.day_date
     ORDER BY wd.day_date ASC`,
    [userId, anchorDate]
  );

  return result.rows;
};

const getMonthlyReadingStats = async (userId, anchorDate) => {
  const result = await pool.query(
    `WITH month_days AS (
       SELECT generate_series(
         date_trunc('month', $2::DATE)::DATE,
         (
           date_trunc('month', $2::DATE)
           + INTERVAL '1 month'
           - INTERVAL '1 day'
         )::DATE,
         INTERVAL '1 day'
       )::DATE AS day_date
     )
     SELECT
       md.day_date,
       COALESCE(uds.reading_minutes, 0)::INT AS minutes,
       COALESCE(uds.pages_read, 0)::INT AS pages_read
     FROM month_days md
     LEFT JOIN user_daily_statistics uds
       ON uds.user_id = $1
      AND uds.stat_date = md.day_date
     ORDER BY md.day_date ASC`,
    [userId, anchorDate]
  );

  return result.rows;
};

const getYearlyQuoteCount = async (userId, year) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(quotes_count), 0)::INT AS quote_count
     FROM user_daily_statistics
     WHERE user_id = $1
       AND stat_date >= MAKE_DATE($2, 1, 1)
       AND stat_date < MAKE_DATE($2 + 1, 1, 1)`,
    [userId, year]
  );

  return result.rows[0]?.quote_count ?? 0;
};

const getYearlyReadingMinutes = async (userId, year) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(reading_minutes), 0)::INT AS total_minutes
     FROM user_daily_statistics
     WHERE user_id = $1
       AND stat_date >= MAKE_DATE($2, 1, 1)
       AND stat_date < MAKE_DATE($2 + 1, 1, 1)`,
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
     )
     SELECT
       d.day_date,
       COALESCE(uds.reading_minutes, 0) AS minutes,
       COALESCE(uds.quotes_count, 0) AS quotes_count,
       COALESCE(uds.activity_level, 0) AS level
     FROM days d
     LEFT JOIN user_daily_statistics uds
       ON uds.user_id = $1
      AND uds.stat_date = d.day_date
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
  getCurrentDate,
  getTodayReadingStats,
  getWeeklyReadingStats,
  getMonthlyReadingStats,
  getYearlyQuoteCount,
  getYearlyReadingMinutes,
  getYearlyActivityLevels,
  getReadingGoals,
  upsertReadingGoal,
};
