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
      start_date DATE,
      finish_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT user_books_unique_user_book UNIQUE (user_id, book_id)
    );

    CREATE TABLE IF NOT EXISTS reading_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
      duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
      pages_read INTEGER NOT NULL DEFAULT 0 CHECK (pages_read >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
      content TEXT,
      page_number INTEGER CHECK (page_number IS NULL OR page_number > 0),
      note TEXT,
      image_url TEXT,
      ocr_text TEXT,
      ocr_status VARCHAR(20) NOT NULL DEFAULT 'manual'
        CHECK (ocr_status IN ('manual', 'pending', 'processed', 'failed')),
      ocr_confidence NUMERIC(5,2)
        CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 100)),
      ocr_processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT quotes_content_or_image_required
        CHECK (
          NULLIF(BTRIM(COALESCE(content, '')), '') IS NOT NULL
          OR NULLIF(BTRIM(COALESCE(image_url, '')), '') IS NOT NULL
        )
    );

    CREATE TABLE IF NOT EXISTS notes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
      content TEXT NOT NULL
        CHECK (NULLIF(BTRIM(COALESCE(content, '')), '') IS NOT NULL),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      icon_url TEXT,
      target_type VARCHAR(50) NOT NULL
        CHECK (target_type IN ('reading_hours', 'books_finished', 'streak_days', 'quotes_saved')),
      target_value INTEGER NOT NULL CHECK (target_value > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT achievements_unique_target UNIQUE (target_type, target_value)
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      achieved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT user_achievements_unique_user_achievement UNIQUE (user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS reading_goals (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      goal_type VARCHAR(50) NOT NULL
        CHECK (goal_type IN ('books', 'hours', 'pages', 'quotes')),
      target_value INTEGER NOT NULL CHECK (target_value > 0),
      year INTEGER NOT NULL CHECK (year >= 2000),
      month INTEGER CHECK (month IS NULL OR month BETWEEN 1 AND 12),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_daily_statistics (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stat_date DATE NOT NULL,
      reading_seconds INTEGER NOT NULL DEFAULT 0 CHECK (reading_seconds >= 0),
      pages_read INTEGER NOT NULL DEFAULT 0 CHECK (pages_read >= 0),
      quotes_count INTEGER NOT NULL DEFAULT 0 CHECK (quotes_count >= 0),
      finished_books_count INTEGER NOT NULL DEFAULT 0 CHECK (finished_books_count >= 0),
      activity_level INTEGER NOT NULL DEFAULT 0 CHECK (activity_level BETWEEN 0 AND 4),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT user_daily_statistics_unique_user_date UNIQUE (user_id, stat_date)
    );

    ALTER TABLE quotes
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS ocr_text TEXT,
      ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(20) NOT NULL DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(5,2),
      ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMPTZ;

    ALTER TABLE quotes
      DROP CONSTRAINT IF EXISTS quotes_ocr_status_check;

    ALTER TABLE quotes
      ADD CONSTRAINT quotes_ocr_status_check
      CHECK (ocr_status IN ('manual', 'pending', 'processed', 'failed'));

    ALTER TABLE quotes
      DROP CONSTRAINT IF EXISTS quotes_ocr_confidence_check;

    ALTER TABLE quotes
      ADD CONSTRAINT quotes_ocr_confidence_check
      CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 100));

    ALTER TABLE quotes
      DROP CONSTRAINT IF EXISTS quotes_content_or_image_required;

    ALTER TABLE quotes
      ADD CONSTRAINT quotes_content_or_image_required
      CHECK (
        NULLIF(BTRIM(COALESCE(content, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(image_url, '')), '') IS NOT NULL
      );

    ALTER TABLE user_books
      DROP COLUMN IF EXISTS reading_year;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_books'
          AND column_name = 'note'
      ) THEN
        EXECUTE $migrate$
          INSERT INTO notes (
            user_id,
            user_book_id,
            content,
            created_at,
            updated_at
          )
          SELECT
            ub.user_id,
            ub.id,
            ub.note,
            ub.created_at,
            ub.updated_at
          FROM user_books ub
          WHERE NULLIF(BTRIM(COALESCE(ub.note, '')), '') IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM notes n
              WHERE n.user_book_id = ub.id
                AND n.user_id = ub.user_id
                AND n.content = ub.note
            )
        $migrate$;

        ALTER TABLE user_books
          DROP COLUMN IF EXISTS note;
      END IF;
    END $$;

    ALTER TABLE reading_sessions
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
      ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

    UPDATE reading_sessions
    SET duration_seconds = COALESCE(duration_seconds, duration_minutes * 60)
    WHERE duration_seconds IS NULL
      AND duration_minutes IS NOT NULL;

    ALTER TABLE reading_sessions
      ALTER COLUMN duration_seconds SET NOT NULL;

    ALTER TABLE reading_sessions
      ALTER COLUMN duration_minutes DROP NOT NULL;

    ALTER TABLE user_daily_statistics
      ADD COLUMN IF NOT EXISTS reading_minutes INTEGER,
      ADD COLUMN IF NOT EXISTS reading_seconds INTEGER NOT NULL DEFAULT 0;

    UPDATE user_daily_statistics
    SET reading_seconds = CASE
      WHEN reading_seconds = 0 AND reading_minutes IS NOT NULL
        THEN reading_minutes * 60
      ELSE reading_seconds
    END;

    CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
    CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON user_books(book_id);
    CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(status);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_book_id ON reading_sessions(user_book_id);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON reading_sessions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_user_book_id ON quotes(user_book_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quotes_ocr_status ON quotes(ocr_status);
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user_book_id ON notes(user_book_id);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_achievements_target_type ON achievements(target_type);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
    CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON reading_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_daily_statistics_user_id ON user_daily_statistics(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_daily_statistics_stat_date ON user_daily_statistics(stat_date DESC);
    CREATE INDEX IF NOT EXISTS idx_user_daily_statistics_user_date_level
      ON user_daily_statistics(user_id, stat_date DESC, activity_level);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_goals_unique_scope
      ON reading_goals(user_id, goal_type, year, COALESCE(month, 0));

    INSERT INTO user_daily_statistics (
      user_id,
      stat_date,
      reading_seconds,
      pages_read,
      quotes_count,
      finished_books_count,
      activity_level
    )
    WITH reading_stats AS (
      SELECT
        user_id,
        DATE(created_at) AS stat_date,
        COALESCE(SUM(duration_seconds), 0)::INT AS reading_seconds,
        COALESCE(SUM(pages_read), 0)::INT AS pages_read
      FROM reading_sessions
      GROUP BY user_id, DATE(created_at)
    ),
    quote_stats AS (
      SELECT
        user_id,
        DATE(created_at) AS stat_date,
        COUNT(*)::INT AS quotes_count
      FROM quotes
      GROUP BY user_id, DATE(created_at)
    ),
    finished_stats AS (
      SELECT
        user_id,
        COALESCE(finish_date, DATE(updated_at)) AS stat_date,
        COUNT(*)::INT AS finished_books_count
      FROM user_books
      WHERE status = 'finished'
      GROUP BY user_id, COALESCE(finish_date, DATE(updated_at))
    ),
    merged AS (
      SELECT
        COALESCE(r.user_id, q.user_id, f.user_id) AS user_id,
        COALESCE(r.stat_date, q.stat_date, f.stat_date) AS stat_date,
        COALESCE(r.reading_seconds, 0) AS reading_seconds,
        COALESCE(r.pages_read, 0) AS pages_read,
        COALESCE(q.quotes_count, 0) AS quotes_count,
        COALESCE(f.finished_books_count, 0) AS finished_books_count
      FROM reading_stats r
      FULL OUTER JOIN quote_stats q
        ON q.user_id = r.user_id
       AND q.stat_date = r.stat_date
      FULL OUTER JOIN finished_stats f
        ON f.user_id = COALESCE(r.user_id, q.user_id)
       AND f.stat_date = COALESCE(r.stat_date, q.stat_date)
    )
    SELECT
      user_id,
      stat_date,
      reading_seconds,
      pages_read,
      quotes_count,
      finished_books_count,
      CASE
        WHEN reading_seconds >= 7200 THEN 4
        WHEN reading_seconds >= 3600 THEN 3
        WHEN reading_seconds >= 1200 THEN 2
        WHEN reading_seconds > 0 OR quotes_count > 0 OR finished_books_count > 0 THEN 1
        ELSE 0
      END AS activity_level
    FROM merged
    WHERE user_id IS NOT NULL
      AND stat_date IS NOT NULL
      AND (
        reading_seconds > 0
        OR pages_read > 0
        OR quotes_count > 0
        OR finished_books_count > 0
      )
    ON CONFLICT (user_id, stat_date) DO UPDATE
    SET reading_seconds = EXCLUDED.reading_seconds,
        pages_read = EXCLUDED.pages_read,
        quotes_count = EXCLUDED.quotes_count,
        finished_books_count = EXCLUDED.finished_books_count,
        activity_level = EXCLUDED.activity_level,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO achievements (name, description, icon_url, target_type, target_value)
    VALUES
      ('100 Reading Hours', 'Spend 100 focused hours reading across your library.', 'schedule', 'reading_hours', 100),
      ('10 Books Finished', 'Finish 10 books and build a full year of completed reads.', 'book', 'books_finished', 10),
      ('7-Day Streak', 'Read every day for a full week without breaking the chain.', 'fire', 'streak_days', 7),
      ('50 Quotes Saved', 'Save 50 favorite quotes or highlights from your books.', 'quote', 'quotes_saved', 50)
    ON CONFLICT (target_type, target_value) DO NOTHING;

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

    DROP TRIGGER IF EXISTS set_user_daily_statistics_updated_at ON user_daily_statistics;
    CREATE TRIGGER set_user_daily_statistics_updated_at
    BEFORE UPDATE ON user_daily_statistics
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS set_notes_updated_at ON notes;
    CREATE TRIGGER set_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
};

module.exports = {
  initSchema,
};
