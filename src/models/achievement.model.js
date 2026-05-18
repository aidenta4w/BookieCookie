const { pool } = require("../config/db");

const getAchievements = async (client = pool) => {
  const result = await client.query(
    `SELECT
        id,
        name,
        description,
        icon_url,
        target_type,
        target_value,
        created_at
     FROM achievements
     ORDER BY target_value ASC, id ASC`
  );

  return result.rows;
};

const getYearlyReadingSeconds = async (userId, year, client = pool) => {
  const result = await client.query(
    `SELECT COALESCE(
        SUM(COALESCE(duration_seconds, duration_minutes * 60, 0)),
        0
      )::BIGINT AS total_seconds
     FROM reading_sessions
     WHERE user_id = $1
       AND created_at >= MAKE_DATE($2, 1, 1)
       AND created_at < MAKE_DATE($2 + 1, 1, 1)`,
    [userId, year]
  );

  return Number(result.rows[0]?.total_seconds ?? 0);
};

const getYearlyBooksFinished = async (userId, year, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*)::INT AS total_books
     FROM user_books
     WHERE user_id = $1
       AND status = 'finished'
       AND COALESCE(
         EXTRACT(YEAR FROM finish_date)::INT,
         EXTRACT(YEAR FROM updated_at)::INT
       ) = $2`,
    [userId, year]
  );

  return Number(result.rows[0]?.total_books ?? 0);
};

const getYearlyQuotesSaved = async (userId, year, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*)::INT AS total_quotes
     FROM quotes
     WHERE user_id = $1
       AND created_at >= MAKE_DATE($2, 1, 1)
       AND created_at < MAKE_DATE($2 + 1, 1, 1)`,
    [userId, year]
  );

  return Number(result.rows[0]?.total_quotes ?? 0);
};

const getActivityDates = async (userId, client = pool) => {
  const result = await client.query(
    `WITH activity_days AS (
       SELECT DATE(created_at) AS activity_date
       FROM reading_sessions
       WHERE user_id = $1
         AND COALESCE(duration_seconds, duration_minutes * 60, 0) > 120
       UNION
       SELECT DATE(created_at) AS activity_date
       FROM quotes
       WHERE user_id = $1
       UNION
       SELECT COALESCE(finish_date, DATE(updated_at)) AS activity_date
       FROM user_books
       WHERE user_id = $1
         AND status = 'finished'
     )
     SELECT activity_date
     FROM activity_days
     WHERE activity_date IS NOT NULL
     ORDER BY activity_date DESC`,
    [userId]
  );

  return result.rows.map((row) => row.activity_date);
};

const getUserAchievements = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT
        id,
        user_id,
        achievement_id,
        achieved_at
     FROM user_achievements
     WHERE user_id = $1
     ORDER BY achieved_at ASC, id ASC`,
    [userId]
  );

  return result.rows;
};

const insertUserAchievements = async ({
  userId,
  achievementIds,
  client = pool,
}) => {
  if (!Array.isArray(achievementIds) || achievementIds.length === 0) {
    return [];
  }

  const result = await client.query(
    `INSERT INTO user_achievements (user_id, achievement_id)
     SELECT $1, UNNEST($2::BIGINT[])
     ON CONFLICT (user_id, achievement_id) DO NOTHING
     RETURNING id, user_id, achievement_id, achieved_at`,
    [userId, achievementIds]
  );

  return result.rows;
};

module.exports = {
  getAchievements,
  getYearlyReadingSeconds,
  getYearlyBooksFinished,
  getYearlyQuotesSaved,
  getActivityDates,
  getUserAchievements,
  insertUserAchievements,
};
