const { pool } = require("../config/db");
const achievementModel = require("../models/achievement.model");
const homeViewModel = require("./home.viewmodel");

const parsePositiveInteger = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsedValue;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

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

const toProgressValue = (overview, targetType) => {
  switch (targetType) {
    case "reading_hours":
      return Number(overview.reading_hours ?? 0);
    case "books_finished":
      return Number(overview.books_finished ?? 0);
    case "streak_days":
      return Number(overview.streak_days ?? 0);
    case "quotes_saved":
      return Number(overview.quotes_saved ?? 0);
    default:
      return 0;
  }
};

const buildOverview = (dashboard) => {
  const yearStats = dashboard?.statistics?.year ?? {};

  return {
    year: Number(dashboard?.year ?? new Date().getUTCFullYear()),
    reading_hours: Number(yearStats.reading_hours ?? 0),
    books_finished: Number(yearStats.books_finished ?? 0),
    streak_days: Number(dashboard?.streak?.days ?? 0),
    quotes_saved: Number(yearStats.quotes_saved ?? 0),
    current_reading_count: Number(yearStats.current_reading_count ?? 0),
    active_days: Number(yearStats.active_days ?? 0),
    completion_rate: Number(yearStats.completion_rate ?? 0),
    yearly_activity_levels: Array.isArray(yearStats.yearly_activity_levels)
      ? yearStats.yearly_activity_levels.map((item) => Number(item ?? 0))
      : [],
    highlighted_book_title: yearStats.highlighted_book_title ?? null,
  };
};

const getUserChallengeProgress = async (userIdParam, requestedYear) => {
  const userId = parsePositiveInteger(userIdParam, "user id");
  const year =
    requestedYear === undefined || requestedYear === null || requestedYear === ""
      ? undefined
      : parsePositiveInteger(requestedYear, "year");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const [dashboard, achievements, existingUserAchievements] = await Promise.all(
      [
        homeViewModel.getDashboard(userId, year),
        achievementModel.getAchievements(client),
        achievementModel.getUserAchievements(userId, client),
      ]
    );

    const overview = buildOverview(dashboard);
    const resolvedYear = Number(overview.year);
    const [
      directReadingSeconds,
      directBooksFinished,
      directQuotesSaved,
      activityDates,
    ] = await Promise.all([
      achievementModel.getYearlyReadingSeconds(userId, resolvedYear, client),
      achievementModel.getYearlyBooksFinished(userId, resolvedYear, client),
      achievementModel.getYearlyQuotesSaved(userId, resolvedYear, client),
      achievementModel.getActivityDates(userId, client),
    ]);

    const challengeOverview = {
      ...overview,
      reading_hours: Math.floor(directReadingSeconds / 3600),
      books_finished: directBooksFinished,
      streak_days: calculateStreakDays(activityDates),
      quotes_saved: directQuotesSaved,
    };
    const unlockedIds = achievements
      .filter(
        (achievement) =>
          toProgressValue(challengeOverview, achievement.target_type) >=
          Number(achievement.target_value ?? 0)
      )
      .map((achievement) => Number(achievement.id));

    const insertedUserAchievements = await achievementModel.insertUserAchievements({
      userId,
      achievementIds: unlockedIds,
      client,
    });

    await client.query("COMMIT");

    const userAchievements = [
      ...existingUserAchievements,
      ...insertedUserAchievements,
    ];
    const unlockedByAchievementId = new Map(
      userAchievements.map((item) => [Number(item.achievement_id), item])
    );

    return {
      overview: challengeOverview,
      userAchievements,
      achievements: achievements.map((achievement) => {
        const unlockedEntry = unlockedByAchievementId.get(Number(achievement.id));

        return {
          ...achievement,
          progress_value: toProgressValue(
            challengeOverview,
            achievement.target_type
          ),
          is_unlocked: Boolean(unlockedEntry),
          achieved_at: unlockedEntry?.achieved_at ?? null,
        };
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getUserChallengeProgress,
};
