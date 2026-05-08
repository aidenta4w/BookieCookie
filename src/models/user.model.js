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

const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, avatar_url, bio, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
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

const updateUserProfile = async ({
  id,
  name,
  bio,
  avatarUrl,
}) => {
  const result = await pool.query(
    `UPDATE users
     SET name = $2,
         bio = $3,
         avatar_url = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, avatar_url, bio, created_at, updated_at`,
    [id, name, bio, avatarUrl]
  );

  return result.rows[0] || null;
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateUserProfile,
};
