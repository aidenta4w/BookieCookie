const { pool } = require("../config/db");

const TABLE_NAME = "books";

const createBook = async ({
  title,
  author = "Unknown author",
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO books (title, author)
     VALUES ($1, $2)
     RETURNING id, title, author, category, isbn, published_year, description, cover_image_url, created_at`,
    [title, author]
  );

  return result.rows[0];
};

module.exports = {
  TABLE_NAME,
  createBook,
};
