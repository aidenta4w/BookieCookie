const { pool } = require("../config/db");

const toIsoDate = (value) => {
  if (!value) {
    throw new Error("Statistic date is required");
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return `${value}`.slice(0, 10);
};

const computeActivityLevel = ({
  readingMinutes,
  quotesCount,
  finishedBooksCount,
}) => {
  if (readingMinutes >= 120) {
    return 4;
  }

  if (readingMinutes >= 60) {
    return 3;
  }

  if (readingMinutes >= 20) {
    return 2;
  }

  if (readingMinutes > 0 || quotesCount > 0 || finishedBooksCount > 0) {
    return 1;
  }

  return 0;
};

const rebuildDailyStatistic = async ({ userId, statDate, client = pool }) => {
  const normalizedDate = toIsoDate(statDate);
  const result = await client.query(
    `WITH reading_stats AS (
       SELECT
         COALESCE(SUM(duration_minutes), 0)::INT AS reading_minutes,
         COALESCE(SUM(pages_read), 0)::INT AS pages_read
       FROM reading_sessions
       WHERE user_id = $1
         AND DATE(created_at) = $2::DATE
     ),
     quote_stats AS (
       SELECT COUNT(*)::INT AS quotes_count
       FROM quotes
       WHERE user_id = $1
         AND DATE(created_at) = $2::DATE
     ),
     finished_stats AS (
       SELECT COUNT(*)::INT AS finished_books_count
       FROM user_books
       WHERE user_id = $1
         AND status = 'finished'
         AND COALESCE(finish_date, DATE(updated_at)) = $2::DATE
     )
     SELECT
       reading_stats.reading_minutes,
       reading_stats.pages_read,
       quote_stats.quotes_count,
       finished_stats.finished_books_count
     FROM reading_stats, quote_stats, finished_stats`,
    [userId, normalizedDate]
  );

  const row = result.rows[0] ?? {};
  const readingMinutes = Number(row.reading_minutes ?? 0);
  const pagesRead = Number(row.pages_read ?? 0);
  const quotesCount = Number(row.quotes_count ?? 0);
  const finishedBooksCount = Number(row.finished_books_count ?? 0);
  const activityLevel = computeActivityLevel({
    readingMinutes,
    quotesCount,
    finishedBooksCount,
  });

  if (
    readingMinutes === 0 &&
    pagesRead === 0 &&
    quotesCount === 0 &&
    finishedBooksCount === 0
  ) {
    await client.query(
      `DELETE FROM user_daily_statistics
       WHERE user_id = $1
         AND stat_date = $2::DATE`,
      [userId, normalizedDate]
    );
    return null;
  }

  const upserted = await client.query(
    `INSERT INTO user_daily_statistics (
       user_id,
       stat_date,
       reading_minutes,
       pages_read,
       quotes_count,
       finished_books_count,
       activity_level
     )
     VALUES ($1, $2::DATE, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, stat_date) DO UPDATE
     SET reading_minutes = EXCLUDED.reading_minutes,
         pages_read = EXCLUDED.pages_read,
         quotes_count = EXCLUDED.quotes_count,
         finished_books_count = EXCLUDED.finished_books_count,
         activity_level = EXCLUDED.activity_level,
         updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      userId,
      normalizedDate,
      readingMinutes,
      pagesRead,
      quotesCount,
      finishedBooksCount,
      activityLevel,
    ]
  );

  return upserted.rows[0] ?? null;
};

module.exports = {
  rebuildDailyStatistic,
};
