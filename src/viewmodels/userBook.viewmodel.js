const { pool } = require("../config/db");
const bookModel = require("../models/book.model");
const userBookModel = require("../models/userBook.model");
const { uploadBufferToCloudinary } = require("../config/cloudinary");

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
  const userId = Number(user_id);
  const normalizedTitle = `${title ?? ""}`.trim();
  const normalizedAuthor = `${author ?? ""}`.trim();
  const normalizedStatus = `${status ?? "plan_to_read"}`.trim() || "plan_to_read";
  const normalizedNote = `${note ?? ""}`.trim();
  const parsedRating =
    rating === null || rating === undefined || rating === ""
      ? null
      : Number(rating);
  const parsedReadingYear =
    reading_year === null || reading_year === undefined || reading_year === ""
      ? null
      : Number(reading_year);

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
      startDate: start_date || null,
      finishDate: finish_date || null,
      client,
    });

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

module.exports = {
  createManualBook,
};
