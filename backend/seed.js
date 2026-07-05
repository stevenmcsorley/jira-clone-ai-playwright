const { Client } = require('pg')
const bcrypt = require('bcrypt')

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ossicone.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ossicone'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin'

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://ossicone:secret@localhost:5432/ossicone'
})

async function seed() {
  try {
    await client.connect()
    console.log('Connected to database')

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

    const adminResult = await client.query(
      `INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin'
       RETURNING id`,
      [ADMIN_EMAIL, ADMIN_NAME, passwordHash]
    )
    const adminId = adminResult.rows[0].id

    // Default workspace with the admin as owner
    let wsResult = await client.query(`SELECT id FROM workspaces ORDER BY id LIMIT 1`)
    if (wsResult.rows.length === 0) {
      wsResult = await client.query(
        `INSERT INTO workspaces (name) VALUES ('halfagiraf') RETURNING id`
      )
    }
    const workspaceId = wsResult.rows[0].id
    await client.query(
      `INSERT INTO workspace_members ("workspaceId", "userId", role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT ("workspaceId", "userId") DO UPDATE SET role = 'owner'`,
      [workspaceId, adminId]
    )

    await client.query(
      `INSERT INTO projects (name, key, description, "leadId", "workspaceId") VALUES
       ('Ossicone', 'OSS', 'Improve and extend the Ossicone project tracker', $1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [adminId, workspaceId]
    )

    const projectResult = await client.query(`SELECT id FROM projects WHERE key = 'OSS'`)
    const projectId = projectResult.rows[0].id

    const issueCount = await client.query(
      `SELECT COUNT(*)::int AS count FROM issues WHERE "projectId" = $1`,
      [projectId]
    )
    if (issueCount.rows[0].count === 0) {
      await client.query(
        `INSERT INTO issues (title, description, status, priority, type, "projectId", "assigneeId", "reporterId", estimate, labels, position) VALUES
         ('Real authentication', 'Login with email/password, JWT sessions, admin user management', 'done', 'high', 'story', $1, $2, $2, 8, '{auth}', 0),
         ('MCP server for Claude', 'Expose projects, sprints and issues as MCP tools so Claude can plan and track work', 'todo', 'high', 'story', $1, $2, $2, 13, '{mcp,ai}', 1),
         ('Deploy to the Pi', 'Production build behind nginx + Cloudflare tunnel at ossicone.halfagiraf.com', 'todo', 'medium', 'task', $1, $2, $2, 5, '{infra}', 2)`,
        [projectId, adminId]
      )
    }

    console.log('Database seeded successfully!')
    console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
    if (!process.env.ADMIN_PASSWORD) {
      console.log('(Set ADMIN_EMAIL / ADMIN_PASSWORD env vars to override, and change the password after first login.)')
    }
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

seed()
