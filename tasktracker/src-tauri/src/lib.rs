use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create_initial_tables",
    sql: "CREATE TABLE IF NOT EXISTS quests (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            notes TEXT,
            rarity TEXT NOT NULL DEFAULT 'common',
            col TEXT NOT NULL DEFAULT 'backlog',
            tags TEXT NOT NULL DEFAULT '[]',
            due_date TEXT,
            avatar TEXT,
            subtasks TEXT NOT NULL DEFAULT '[]',
            xp INTEGER NOT NULL DEFAULT 5,
            created_at TEXT NOT NULL,
            completed_at TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0
          );
          CREATE TABLE IF NOT EXISTS player_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            level INTEGER NOT NULL DEFAULT 1,
            xp INTEGER NOT NULL DEFAULT 0,
            streak INTEGER NOT NULL DEFAULT 0,
            last_active_date TEXT NOT NULL DEFAULT ''
          );
          INSERT OR IGNORE INTO player_stats (id, level, xp, streak, last_active_date)
            VALUES (1, 1, 0, 0, '');",
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:tasks.db", migrations)
        .build(),
    )
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
