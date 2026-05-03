const { pool } = require("../config/db");

const TABLE_NAME = "books";

const createBook = async ({
  title,
  author = "Unknown author",
  coverImageUrl = null,
  client = pool,
}) => {
  const result = await client.query(
    `INSERT INTO books (title, author, cover_image_url)
     VALUES ($1, $2, $3)
     RETURNING id, title, author, category, isbn, published_year, description, cover_image_url, created_at`,
    [title, author, coverImageUrl]
  );

  return result.rows[0];
};

module.exports = {
  TABLE_NAME,
  createBook,
};
