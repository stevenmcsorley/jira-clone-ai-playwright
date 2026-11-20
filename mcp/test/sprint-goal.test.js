import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'
import { collectTools } from '../codemode.js'

const tool = () => collectTools(async () => ({})).get('create_sprint')

test('create_sprint accepts a short goal and no goal', () => {
  const schema = z.object(tool().schema)
  assert.equal(schema.safeParse({ projectId: 1, name: 'S1', goal: 'Ship the new onboarding flow' }).success, true)
  assert.equal(schema.safeParse({ projectId: 1, name: 'S1' }).success, true)
  assert.equal(schema.safeParse({ projectId: 1, name: 'S1', goal: 'x'.repeat(200) }).success, true)
})

test('create_sprint rejects goals over 200 characters', () => {
  const schema = z.object(tool().schema)
  const result = schema.safeParse({ projectId: 1, name: 'S1', goal: 'x'.repeat(201) })
  assert.equal(result.success, false)
})

test('the goal guidance is visible to clients (field description and tool description)', () => {
  const t = tool()
  assert.match(t.description, /ONE short sentence/)
  assert.match(t.schema.goal.description ?? '', /200 characters/)
})
