const { pool } = require("../config/db");

const createNote = async ({
  userId,
  userBookId,
  content,
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO notes (
      user_id,
      user_book_id,
      content
    )
    VALUES ($1, $2, $3)
    RETURNING id, user_id, user_book_id, content, created_at, updated_at`,
    [userId, userBookId, content]
  );

  return result.rows[0];
};

const getNotesByUserId = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT
        n.id,
        n.user_id,
        n.user_book_id,
        n.content,
        n.created_at,
        n.updated_at,
        ub.title,
        ub.author,
        ub.cover_image_url
     FROM notes n
     INNER JOIN user_books ub ON ub.id = n.user_book_id
     WHERE n.user_id = $1
     ORDER BY n.updated_at DESC, n.id DESC`,
    [userId]
  );

  return result.rows;
};

const getNotesByUserBookId = async ({ userId, userBookId, client = pool }) => {
  const result = await client.query(
    `SELECT
        id,
        user_id,
        user_book_id,
        content,
        created_at,
        updated_at
     FROM notes
     WHERE user_id = $1
       AND user_book_id = $2
     ORDER BY updated_at DESC, id DESC`,
    [userId, userBookId]
  );

  return result.rows;
};

const getNoteById = async ({ noteId, userId, client = pool }) => {
  const result = await client.query(
    `SELECT
        id,
        user_id,
        user_book_id,
        content,
        created_at,
        updated_at
     FROM notes
     WHERE id = $1
       AND user_id = $2
     LIMIT 1`,
    [noteId, userId]
  );

  return result.rows[0] ?? null;
};

const updateNote = async ({ noteId, userId, content, client = pool }) => {
  const result = await client.query(
    `UPDATE notes
     SET content = $3
     WHERE id = $1
       AND user_id = $2
     RETURNING id, user_id, user_book_id, content, created_at, updated_at`,
    [noteId, userId, content]
  );

  return result.rows[0] ?? null;
};

const deleteNote = async ({ noteId, userId, client = pool }) => {
  const result = await client.query(
    `DELETE FROM notes
     WHERE id = $1
       AND user_id = $2
     RETURNING id`,
    [noteId, userId]
  );

  return result.rows[0] ?? null;
};

module.exports = {
  createNote,
  getNotesByUserId,
  getNotesByUserBookId,
  getNoteById,
  updateNote,
  deleteNote,
};
