-- D1 数据库表结构
CREATE TABLE IF NOT EXISTS user_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  level INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_checkin_date TEXT,
  total_checkins INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS training_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  module TEXT NOT NULL,
  lesson_index INTEGER DEFAULT 1,
  exercise_answer TEXT,
  completed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weapons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  definition TEXT,
  module TEXT NOT NULL,
  lesson_index INTEGER DEFAULT 1,
  acquired_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT
);

-- 初始化用户
INSERT OR IGNORE INTO user_state (id, level, streak_days, total_checkins)
VALUES (1, 0, 0, 0);
