const { pool } = require("../config/db");

const initSchema = async () => {
  await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      isbn VARCHAR(32) UNIQUE,
      published_year INTEGER,
      description TEXT,
      cover_image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_books (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL CHECK (status IN ('plan_to_read', 'reading', 'finished', 'abandoned')),
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      note TEXT,
      reading_year INTEGER,
      start_date DATE,
      finish_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT user_books_unique_user_book UNIQUE (user_id, book_id)
    );

    CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
    CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON user_books(book_id);
    CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(status);

    DROP TRIGGER IF EXISTS set_users_updated_at ON users;
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS set_user_books_updated_at ON user_books;
    CREATE TRIGGER set_user_books_updated_at
    BEFORE UPDATE ON user_books
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
};

module.exports = {
  initSchema,
};
