const homeModel = require("../models/home.model");

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toDateOnly = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const calculateStreakDays = (activityDates, referenceDate = new Date()) => {
  if (activityDates.length === 0) {
    return 0;
  }

  const activitySet = new Set(
    activityDates.map((date) => toDateOnly(new Date(date)).toISOString())
  );

  let cursor = toDateOnly(new Date(referenceDate));
  let streak = 0;

  while (activitySet.has(cursor.toISOString())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_IN_MS);
  }

  return streak;
};

const calculateMaxStreakDays = (activityDates) => {
  if (activityDates.length === 0) {
    return 0;
  }

  const sortedDays = [...new Set(
    activityDates.map((date) => toDateOnly(new Date(date)).getTime())
  )].sort((a, b) => a - b);

  let maxStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    if (sortedDays[index] - sortedDays[index - 1] === DAY_IN_MS) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }

  return maxStreak;
};

const toWeekdayLabel = (date) => WEEKDAY_LABELS[(date.getUTCDay() + 6) % 7];

const formatMonthShortLabel = (date) => String(date.getUTCDate()).padStart(2, "0");

const toTimelinePoint = (row, labelBuilder) => {
  const date = new Date(row.day_date);

  return {
    label: labelBuilder(date),
    short_label: labelBuilder(date),
    date: row.day_date,
    seconds: Number(row.seconds ?? 0),
    pages_read: Number(row.pages_read ?? 0),
  };
};

const findLatestGoalValue = (goals, goalType, { month = null } = {}) => {
  const matched = goals.find(
    (goal) => goal.goal_type === goalType && goal.month === month
  );

  return matched ? Number(matched.target_value) : 0;
};

const getDashboard = async (userId, requestedYear, requestedAnchorDate) => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const parsedAnchorDate =
    typeof requestedAnchorDate === "string" && requestedAnchorDate.trim()
      ? new Date(requestedAnchorDate)
      : null;
  const hasAnchorDate =
    parsedAnchorDate instanceof Date && !Number.isNaN(parsedAnchorDate.getTime());
  const year =
    Number.isInteger(requestedYear) && requestedYear > 0
      ? requestedYear
      : hasAnchorDate
        ? parsedAnchorDate.getUTCFullYear()
      : currentYear;
  const anchorDate =
    hasAnchorDate
      ? parsedAnchorDate
      : year === currentYear
        ? now
        : new Date(Date.UTC(year, 11, 31));
  const month = anchorDate.getUTCMonth() + 1;

  const [
    currentReading,
    finishedBooks,
    finishedBookCount,
    activityDates,
    currentDate,
    todayReading,
    currentWeeklyReading,
    chartWeeklyReading,
    monthlyReading,
    yearlyQuoteCount,
    yearlyReadingMinutes,
    yearlyActivityRows,
    goals,
  ] = await Promise.all([
    homeModel.getCurrentReadingBooks(userId),
    homeModel.getFinishedBooksInYear(userId, year),
    homeModel.getFinishedBookCountInYear(userId, year),
    homeModel.getReadingActivityDates(userId),
    homeModel.getCurrentDate(),
    homeModel.getTodayReadingStats(userId),
    homeModel.getWeeklyReadingStats(userId, now),
    homeModel.getWeeklyReadingStats(userId, anchorDate),
    homeModel.getMonthlyReadingStats(userId, anchorDate),
    homeModel.getYearlyQuoteCount(userId, year),
    homeModel.getYearlyReadingMinutes(userId, year),
    homeModel.getYearlyActivityLevels(userId, year),
    homeModel.getReadingGoals(userId, year, month),
  ]);

  const yearlyBookGoal = findLatestGoalValue(goals, "books");
  const monthlyHoursGoal = findLatestGoalValue(goals, "hours", { month });
  const todaySeconds = Number(todayReading?.seconds ?? 0);
  const goalSeconds = monthlyHoursGoal > 0
    ? Math.max(60, Math.round((monthlyHoursGoal * 3600) / 30))
    : 0;
  const weeklyStats = currentWeeklyReading.map((row) => {
    const date = new Date(row.day_date);

    return {
      label: toWeekdayLabel(date),
      short_label: toWeekdayLabel(date).slice(0, 2),
      date: row.day_date,
      seconds: Number(row.seconds ?? 0),
      pages_read: Number(row.pages_read ?? 0),
    };
  });
  const chartWeeklyStats = chartWeeklyReading.map((row) => {
    const date = new Date(row.day_date);

    return {
      label: toWeekdayLabel(date),
      short_label: toWeekdayLabel(date).slice(0, 2),
      date: row.day_date,
      seconds: Number(row.seconds ?? 0),
      pages_read: Number(row.pages_read ?? 0),
    };
  });
  const monthlyStats = monthlyReading.map((row) =>
    toTimelinePoint(row, formatMonthShortLabel)
  );
  const yearlyActivityLevels = yearlyActivityRows.map((row) => Number(row.level ?? 0));
  const activeDays = yearlyActivityRows.filter((row) => Number(row.level ?? 0) > 0).length;
  const elapsedDays = Math.max(
    1,
    Math.floor(
      (Date.UTC(
        anchorDate.getUTCFullYear(),
        anchorDate.getUTCMonth(),
        anchorDate.getUTCDate()
      ) -
        Date.UTC(year, 0, 1)) /
        DAY_IN_MS
    ) + 1
  );

  return {
    currentReading: currentReading.map((book) => ({
      id: book.id,
      book_id: book.book_id,
      title: book.title,
      author: book.author,
      cover_image_url: book.cover_image_url,
      start_date: book.start_date,
      updated_at: book.updated_at,
    })),
    streak: {
      days: calculateStreakDays(activityDates, currentDate ?? now),
      max_days: calculateMaxStreakDays(activityDates),
      activity_count: activityDates.length,
    },
    finishedInYear: finishedBooks,
    statistics: {
      today: {
        seconds: todaySeconds,
        pages_read: Number(todayReading?.pages_read ?? 0),
        goal_seconds: goalSeconds,
        progress: goalSeconds > 0 ? Math.min(todaySeconds / goalSeconds, 1) : 0,
      },
      week: weeklyStats,
      chart: {
        week: chartWeeklyStats,
        month: monthlyStats,
      },
      year: {
        reading_hours: Math.floor(yearlyReadingMinutes / 3600),
        reading_minutes: Math.floor(yearlyReadingMinutes / 60),
        reading_seconds: yearlyReadingMinutes,
        books_finished: Number(finishedBookCount ?? 0),
        quotes_saved: yearlyQuoteCount,
        current_reading_count: currentReading.length,
        active_days: activeDays,
        completion_rate: Math.min(activeDays / elapsedDays, 1),
        yearly_goal_books: yearlyBookGoal,
        yearly_activity_levels: yearlyActivityLevels,
        highlighted_book_title:
          finishedBooks.length > 0 ? finishedBooks[0].title : null,
      },
    },
    goals: {
      yearly_books: yearlyBookGoal,
      monthly_hours: monthlyHoursGoal,
    },
    year,
  };
};

module.exports = {
  getDashboard,
  updateYearlyBookGoal: async (userId, targetValue, year = new Date().getUTCFullYear()) => {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("Invalid user id");
    }

    const parsedTarget = Number(targetValue);

    if (!Number.isInteger(parsedTarget) || parsedTarget <= 0) {
      throw new Error("Yearly goal must be a positive integer");
    }

    return homeModel.upsertReadingGoal({
      userId,
      goalType: "books",
      targetValue: parsedTarget,
      year,
      month: null,
    });
  },
};
