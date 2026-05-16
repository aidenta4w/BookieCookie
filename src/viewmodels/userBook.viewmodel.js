const { pool } = require("../config/db");
const bookModel = require("../models/book.model");
const statisticModel = require("../models/statistic.model");
const userBookModel = require("../models/userBook.model");
const { uploadBufferToCloudinary } = require("../config/cloudinary");

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
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
  status,
  rating,
  note,
  reading_year,
  start_date,
  finish_date,
}) => {
  const userId = Number(user_id);
  const normalizedTitle = `${title ?? ""}`.trim();
  const normalizedAuthor = `${author ?? ""}`.trim();
  const normalizedStatus = `${status ?? "plan_to_read"}`.trim() || "plan_to_read";
  const normalizedNote = `${note ?? ""}`.trim();
  const parsedRating = parseOptionalNumber(rating);
  const parsedReadingYear = parseOptionalNumber(reading_year);

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
    parsedReadingYear !== null &&
    (!Number.isInteger(parsedReadingYear) || parsedReadingYear < 0)
  ) {
    throw new Error("Reading year must be a valid number");
  }

  return {
    userId,
    normalizedTitle,
    normalizedAuthor,
    normalizedStatus,
    normalizedNote,
    parsedRating,
    parsedReadingYear,
    startDate: start_date || null,
    finishDate: finish_date || null,
  };
};

const createManualBook = async ({
  user_id,
  title,
  author,
  status,
  rating,
  note,
  reading_year,
  start_date,
  finish_date,
}, coverFile) => {
  const {
    userId,
    normalizedTitle,
    normalizedAuthor,
    normalizedStatus,
    normalizedNote,
    parsedRating,
    parsedReadingYear,
    startDate,
    finishDate,
  } = normalizeManualBookPayload({
    user_id,
    title,
    author,
    status,
    rating,
    note,
    reading_year,
    start_date,
    finish_date,
  });

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

    const book = await bookModel.createBook({
      title: normalizedTitle,
      author: normalizedAuthor || "Unknown author",
      coverImageUrl,
      client,
    });

    const userBook = await userBookModel.createUserBook({
      userId,
      bookId: book.id,
      status: normalizedStatus,
      rating: parsedRating,
      note: normalizedNote || null,
      readingYear: parsedReadingYear,
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
      book,
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
    normalizedStatus,
    normalizedNote,
    parsedRating,
    parsedReadingYear,
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

    await bookModel.updateBook({
      bookId: existingDetail.book_id,
      title: normalizedTitle,
      author: normalizedAuthor || "Unknown author",
      coverImageUrl,
      client,
    });

    const updatedBook = await userBookModel.updateUserBook({
      userBookId: parsedUserBookId,
      status: normalizedStatus,
      rating: parsedRating,
      note: normalizedNote || null,
      readingYear: parsedReadingYear,
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
      status: "reading",
      rating: existingDetail.rating,
      note: existingDetail.note,
      readingYear: existingDetail.reading_year,
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
  const parsedDurationMinutes = parseRequiredPositiveInteger(
    payload?.duration_minutes,
    "duration minutes"
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
      durationMinutes: parsedDurationMinutes,
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
        status: "reading",
        rating: existingDetail.rating,
        note: existingDetail.note,
        readingYear:
          existingDetail.reading_year ?? new Date().getUTCFullYear(),
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

module.exports = {
  createManualBook,
  getUserLibrary,
  getUserBookDetail,
  updateManualBook,
  startReadingBook,
  saveReadingSession,
  getReadingSessions,
};
