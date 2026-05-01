const { pool } = require("../config/db");

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, name, email, password_hash, avatar_url, bio, created_at, updated_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
};

const createUser = async ({
  name,
  email,
  passwordHash,
  avatarUrl = null,
  bio = null,
}) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, avatar_url, bio)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, avatar_url, bio, created_at, updated_at`,
    [name, email.toLowerCase(), passwordHash, avatarUrl, bio]
  );

  return result.rows[0];
};

module.exports = {
  findByEmail,
  createUser,
};
