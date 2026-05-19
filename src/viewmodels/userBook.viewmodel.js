const { pool } = require("../config/db");
const statisticModel = require("../models/statistic.model");
const userBookModel = require("../models/userBook.model");
const { uploadBufferToCloudinary } = require("../config/cloudinary");

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
};

const parseOptionalString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = `${value}`.trim();
  return normalizedValue ? normalizedValue : null;
};

const parseRequiredPositiveInteger = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsedValue;
};

const toDateKey = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return `${value}`.slice(0, 10);
};

const parseOptionalDate = (value, fieldName) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalizedValue = `${value}`.trim();
  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return normalizedValue.slice(0, 10);
};

const resolveFinishedStatDate = (detail) =>
  toDateKey(detail?.finish_date) ?? toDateKey(detail?.updated_at);

const rebuildStatisticDates = async ({ userId, dates, client }) => {
  const uniqueDates = [...new Set(dates.filter(Boolean))];

  for (const statDate of uniqueDates) {
    await statisticModel.rebuildDailyStatistic({
      userId,
      statDate,
      client,
    });
  }
};

const normalizeManualBookPayload = ({
  user_id,
  title,
  author,
  category,
  isbn,
  published_year,
  description,
  status,
  rating,
  start_date,
  finish_date,
}) => {
  const userId = Number(user_id);
  const normalizedTitle = `${title ?? ""}`.trim();
  const normalizedAuthor = `${author ?? ""}`.trim();
  const normalizedCategory = parseOptionalString(category);
  const normalizedIsbn = parseOptionalString(isbn);
  const normalizedDescription = parseOptionalString(description);
  const parsedPublishedYear = parseOptionalNumber(published_year);
  const normalizedStatus = `${status ?? "plan_to_read"}`.trim() || "plan_to_read";
  const parsedRating = parseOptionalNumber(rating);
  const parsedStartDate = parseOptionalDate(start_date, "start date");
  const parsedFinishDate = parseOptionalDate(finish_date, "finish date");

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user id");
  }

  if (!normalizedTitle) {
    throw new Error("Title is required");
  }

  if (!userBookModel.STATUSES.includes(normalizedStatus)) {
    throw new Error("Invalid status");
  }

  if (
    parsedRating !== null &&
    (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5)
  ) {
    throw new Error("Rating must be between 1 and 5");
  }

  if (
    parsedPublishedYear !== null &&
    (!Number.isInteger(parsedPublishedYear) || parsedPublishedYear <= 0)
  ) {
    throw new Error("Published year must be a positive integer");
  }

  if (
    parsedStartDate !== null &&
    parsedFinishDate !== null &&
    new Date(parsedFinishDate) <= new Date(parsedStartDate)
  ) {
    throw new Error("Finish date must be after start date");
  }

  return {
    userId,
    normalizedTitle,
    normalizedAuthor,
    normalizedCategory,
    normalizedIsbn,
    normalizedDescription,
    publishedYear: parsedPublishedYear,
    normalizedStatus,
    parsedRating,
    startDate: parsedStartDate,
    finishDate: parsedFinishDate,
  };
};

const toBookPayload = (userBook) => ({
  id: userBook.id,
  title: userBook.title,
  author: userBook.author,
  category: userBook.category,
  isbn: userBook.isbn,
  published_year: userBook.published_year,
  description: userBook.description,
  cover_image_url: userBook.cover_image_url,
  created_at: userBook.created_at,
});

const createManualBook = async (payload, coverFile) => {
  const {
    userId,
    normalizedTitle,
    normalizedAuthor,
    normalizedCategory,
    normalizedIsbn,
    normalizedDescription,
    publishedYear,
    normalizedStatus,
    parsedRating,
    startDate,
    finishDate,
  } = normalizeManualBookPayload(payload);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let coverImageUrl = null;

    if (coverFile?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(coverFile.buffer, {
        originalFilename: coverFile.originalname,
        folder: "bookiecookie/manual-books",
      });
      coverImageUrl = uploadResult.secure_url;
    }

    const userBook = await userBookModel.createUserBook({
      userId,
      title: normalizedTitle,
      author: normalizedAuthor || "Unknown author",
      category: normalizedCategory,
      isbn: normalizedIsbn,
      publishedYear,
      description: normalizedDescription,
      coverImageUrl,
      status: normalizedStatus,
      rating: parsedRating,
      startDate,
      finishDate,
      client,
    });

    if (normalizedStatus === "finished") {
      await rebuildStatisticDates({
        userId,
        dates: [resolveFinishedStatDate(userBook)],
        client,
      });
    }

    await client.query("COMMIT");

    return {
      book: toBookPayload(userBook),
      user_book: userBook,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getUserLibrary = async (userIdParam) => {
  const userId = Number(userIdParam);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user id");
  }

  return userBookModel.getUserLibrary(userId);
};

const getUserBookDetail = async ({ userBookId, userId }) => {
  const parsedUserBookId = Number(userBookId);
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserBookId) || parsedUserBookId <= 0) {
    throw new Error("Invalid user book id");
  }

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new Error("Invalid user id");
  }

  const detail = await userBookModel.getUserBookDetail({
    userBookId: parsedUserBookId,
    userId: parsedUserId,
  });

  if (!detail) {
    throw new Error("Book detail not found");
  }

  return detail;
};

const updateManualBook = async (userBookIdParam, payload, coverFile) => {
  const parsedUserBookId = Number(userBookIdParam);

  if (!Number.isInteger(parsedUserBookId) || parsedUserBookId <= 0) {
    throw new Error("Invalid user book id");
  }

  const {
    userId,
    normalizedTitle,
    normalizedAuthor,
    normalizedCategory,
    normalizedIsbn,
    normalizedDescription,
    publishedYear,
    normalizedStatus,
    parsedRating,
    startDate,
    finishDate,
  } = normalizeManualBookPayload(payload);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingDetail = await userBookModel.getUserBookDetail({
      userBookId: parsedUserBookId,
      userId,
      client,
    });

    if (!existingDetail) {
      throw new Error("Book detail not found");
    }

    let coverImageUrl = existingDetail.cover_image_url ?? null;

    if (coverFile?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(coverFile.buffer, {
        originalFilename: coverFile.originalname,
        folder: "bookiecookie/manual-books",
      });
      coverImageUrl = uploadResult.secure_url;
    }

    const updatedBook = await userBookModel.updateUserBook({
      userBookId: parsedUserBookId,
      title: normalizedTitle,
      author: normalizedAuthor || "Unknown author",
      category:
        payload?.category === undefined
          ? existingDetail.category
          : normalizedCategory,
      isbn:
        payload?.isbn === undefined
          ? existingDetail.isbn
          : normalizedIsbn,
      publishedYear:
        payload?.published_year === undefined
          ? existingDetail.published_year
          : publishedYear,
      description:
        payload?.description === undefined
          ? existingDetail.description
          : normalizedDescription,
      coverImageUrl,
      status: normalizedStatus,
      rating: parsedRating,
      startDate,
      finishDate,
      client,
    });

    await rebuildStatisticDates({
      userId,
      dates: [
        resolveFinishedStatDate(existingDetail),
        resolveFinishedStatDate(updatedBook),
      ],
      client,
    });

    const updatedDetail = await userBookModel.getUserBookDetail({
      userBookId: parsedUserBookId,
      userId,
      client,
    });

    await client.query("COMMIT");

    return updatedDetail;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const startReadingBook = async (userBookIdParam, userIdParam) => {
  const parsedUserBookId = Number(userBookIdParam);
  const parsedUserId = Number(userIdParam);

  if (!Number.isInteger(parsedUserBookId) || parsedUserBookId <= 0) {
    throw new Error("Invalid user book id");
  }

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new Error("Invalid user id");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingDetail = await userBookModel.getUserBookDetail({
      userBookId: parsedUserBookId,
      userId: parsedUserId,
      client,
    });

    if (!existingDetail) {
      throw new Error("Book detail not found");
    }

    await userBookModel.updateUserBook({
      userBookId: parsedUserBookId,
      title: existingDetail.title,
      author: existingDetail.author,
      category: existingDetail.category,
      isbn: existingDetail.isbn,
      publishedYear: existingDetail.published_year,
      description: existingDetail.description,
      coverImageUrl: existingDetail.cover_image_url,
      status: "reading",
      rating: existingDetail.rating,
      startDate: existingDetail.start_date || new Date().toISOString().split("T")[0],
      finishDate: existingDetail.finish_date,
      client,
    });

    const updatedDetail = await userBookModel.getUserBookDetail({
      userBookId: parsedUserBookId,
      userId: parsedUserId,
      client,
    });

    await client.query("COMMIT");

    return updatedDetail;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const saveReadingSession = async (userBookIdParam, payload) => {
  const parsedUserBookId = parseRequiredPositiveInteger(
    userBookIdParam,
    "user book id"
  );
  const parsedUserId = parseRequiredPositiveInteger(payload?.user_id, "user id");
  const rawDurationSeconds =
    payload?.duration_seconds ??
    (payload?.duration_minutes == null ? null : Number(payload.duration_minutes) * 60);
  const parsedDurationSeconds = parseRequiredPositiveInteger(
    rawDurationSeconds,
    "duration seconds"
  );
  const parsedPagesRead = payload?.pages_read === undefined || payload?.pages_read === null || payload?.pages_read === ""
    ? 0
    : Number(payload.pages_read);

  if (!Number.isInteger(parsedPagesRead) || parsedPagesRead < 0) {
    throw new Error("Invalid pages read");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingDetail = await userBookModel.getUserBookDetail({
      userBookId: parsedUserBookId,
      userId: parsedUserId,
      client,
    });

    if (!existingDetail) {
      throw new Error("Book detail not found");
    }

    const session = await userBookModel.createReadingSession({
      userId: parsedUserId,
      userBookId: parsedUserBookId,
      durationSeconds: parsedDurationSeconds,
      pagesRead: parsedPagesRead,
      client,
    });

    await rebuildStatisticDates({
      userId: parsedUserId,
      dates: [toDateKey(session.created_at)],
      client,
    });

    if (existingDetail.status !== "reading") {
      await userBookModel.updateUserBook({
        userBookId: parsedUserBookId,
        title: existingDetail.title,
        author: existingDetail.author,
        category: existingDetail.category,
        isbn: existingDetail.isbn,
        publishedYear: existingDetail.published_year,
        description: existingDetail.description,
        coverImageUrl: existingDetail.cover_image_url,
        status: "reading",
        rating: existingDetail.rating,
        startDate:
          existingDetail.start_date || new Date().toISOString().split("T")[0],
        finishDate: existingDetail.finish_date,
        client,
      });
    }

    await client.query("COMMIT");

    return session;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getReadingSessions = async (userBookIdParam, userIdParam) => {
  const parsedUserBookId = parseRequiredPositiveInteger(
    userBookIdParam,
    "user book id"
  );
  const parsedUserId = parseRequiredPositiveInteger(userIdParam, "user id");

  return userBookModel.getReadingSessionsByUserBook({
    userBookId: parsedUserBookId,
    userId: parsedUserId,
  });
};

const deleteUserBook = async (userBookIdParam, userIdParam) => {
  const parsedUserBookId = parseRequiredPositiveInteger(
    userBookIdParam,
    "user book id"
  );
  const parsedUserId = parseRequiredPositiveInteger(userIdParam, "user id");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingDetail = await userBookModel.getUserBookDetail({
      userBookId: parsedUserBookId,
      userId: parsedUserId,
      client,
    });

    if (!existingDetail) {
      throw new Error("Book detail not found");
    }

    const deletedBook = await userBookModel.deleteUserBook({
      userBookId: parsedUserBookId,
      userId: parsedUserId,
      client,
    });

    if (!deletedBook) {
      throw new Error("Book detail not found");
    }

    await rebuildStatisticDates({
      userId: parsedUserId,
      dates: [
        resolveFinishedStatDate(existingDetail),
        toDateKey(new Date()),
      ],
      client,
    });

    await client.query("COMMIT");

    return deletedBook;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createManualBook,
  getUserLibrary,
  getUserBookDetail,
  updateManualBook,
  startReadingBook,
  saveReadingSession,
  getReadingSessions,
  deleteUserBook,
};
