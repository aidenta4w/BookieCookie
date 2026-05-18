const { pool } = require("../config/db");
const noteModel = require("../models/note.model");
const userBookModel = require("../models/userBook.model");

const parseRequiredPositiveInteger = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsedValue;
};

const normalizeContent = (value) => {
  const content = `${value ?? ""}`.trim();

  if (!content) {
    throw new Error("Note content is required");
  }

  return content;
};

const createNote = async (payload) => {
  const userId = parseRequiredPositiveInteger(payload?.user_id, "user id");
  const userBookId = parseRequiredPositiveInteger(
    payload?.user_book_id,
    "user book id"
  );
  const content = normalizeContent(payload?.content);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingDetail = await userBookModel.getUserBookDetail({
      userBookId,
      userId,
      client,
    });

    if (!existingDetail) {
      throw new Error("Book detail not found");
    }

    const note = await noteModel.createNote({
      userId,
      userBookId,
      content,
      client,
    });

    await client.query("COMMIT");

    return note;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getNotesByUserId = async (userIdParam) => {
  const userId = parseRequiredPositiveInteger(userIdParam, "user id");
  return noteModel.getNotesByUserId(userId);
};

const getNotesByUserBookId = async ({ userBookId, userId }) => {
  const parsedUserBookId = parseRequiredPositiveInteger(
    userBookId,
    "user book id"
  );
  const parsedUserId = parseRequiredPositiveInteger(userId, "user id");

  return noteModel.getNotesByUserBookId({
    userId: parsedUserId,
    userBookId: parsedUserBookId,
  });
};

const updateNote = async (noteIdParam, payload) => {
  const noteId = parseRequiredPositiveInteger(noteIdParam, "note id");
  const userId = parseRequiredPositiveInteger(payload?.user_id, "user id");
  const content = normalizeContent(payload?.content);

  const updatedNote = await noteModel.updateNote({
    noteId,
    userId,
    content,
  });

  if (!updatedNote) {
    throw new Error("Note not found");
  }

  return updatedNote;
};

const deleteNote = async (noteIdParam, userIdParam) => {
  const noteId = parseRequiredPositiveInteger(noteIdParam, "note id");
  const userId = parseRequiredPositiveInteger(userIdParam, "user id");

  const deletedNote = await noteModel.deleteNote({
    noteId,
    userId,
  });

  if (!deletedNote) {
    throw new Error("Note not found");
  }

  return deletedNote;
};

module.exports = {
  createNote,
  getNotesByUserId,
  getNotesByUserBookId,
  updateNote,
  deleteNote,
};
