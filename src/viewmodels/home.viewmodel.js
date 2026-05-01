const homeModel = require("../models/home.model");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const calculateStreakDays = (activityDates) => {
  if (activityDates.length === 0) {
    return 0;
  }

  const activitySet = new Set(
    activityDates.map((date) => toDateOnly(new Date(date)).toISOString())
  );

  let cursor = toDateOnly(new Date());
  let streak = 0;

  while (activitySet.has(cursor.toISOString())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_IN_MS);
  }

  return streak;
};

const getDashboard = async (userId) => {
  const year = new Date().getUTCFullYear();

  const [currentReading, finishedBooks, activityDates] = await Promise.all([
    homeModel.getCurrentReadingBooks(userId),
    homeModel.getFinishedBooksInYear(userId, year),
    homeModel.getReadingActivityDates(userId),
  ]);

  return {
    currentReading: currentReading.map((book) => ({
      id: book.id,
      book_id: book.book_id,
      title: book.title,
      author: book.author,
      cover_image_url: book.cover_image_url,
      current_page: book.current_page,
      progress_percent: Math.max(0, Math.min(book.current_page, 100)),
      start_date: book.start_date,
      updated_at: book.updated_at,
    })),
    streak: {
      days: calculateStreakDays(activityDates),
      activity_count: activityDates.length,
    },
    finishedInYear: finishedBooks,
    year,
  };
};

module.exports = {
  getDashboard,
};
