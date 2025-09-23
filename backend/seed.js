const { Client } = require('pg')

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://jira_clone:secret@localhost:5432/jira_clone'
})

async function seed() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Insert seed users
    await client.query(`
      INSERT INTO users (email, name, password) VALUES
      ('john@example.com', 'John Doe', '$2b$10$hash1'),
      ('jane@example.com', 'Jane Smith', '$2b$10$hash2'),
      ('mike@example.com', 'Mike Johnson', '$2b$10$hash3')
      ON CONFLICT (email) DO NOTHING;
    `)

    // Insert seed project
    await client.query(`
      INSERT INTO projects (name, key, description, "leadId") VALUES
      ('Jira Clone', 'JC', 'A modern project management tool', 1)
      ON CONFLICT (key) DO NOTHING;
    `)

    // Insert seed issues
    await client.query(`
      INSERT INTO issues (title, description, status, priority, type, "projectId", "assigneeId", "reporterId", estimate, labels) VALUES
      ('Set up project structure', 'Create the initial project structure', 'done', 'high', 'task', 1, 1, 1, 5, '{}'),
      ('Design authentication system', 'Create login and signup functionality', 'in_progress', 'high', 'story', 1, 2, 1, 8, '{}'),
      ('Implement drag and drop', 'Allow users to drag issues between columns', 'todo', 'medium', 'story', 1, 1, 1, 3, '{}'),
      ('Fix mobile responsiveness', 'Issue cards not displaying correctly on mobile', 'todo', 'low', 'bug', 1, 2, 2, 2, '{}')
      ON CONFLICT DO NOTHING;
    `)

    console.log('Database seeded successfully!')

  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await client.end()
  }
}

seed()