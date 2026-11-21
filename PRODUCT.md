# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One developer (the owner) and the small team and AI agents around them. They plan sprints, work an issue board and read progress reports. Agents act through the MCP server and the API: they read the backlog, create and update issues, and pick up tickets that Skylark opens from errors.

## Product Purpose
Ossicone is a self-hosted project tracker in the Jira mould, made small: projects with an issue board, backlog and sprints, time tracking, reports, a wiki and a repository view. It exists so one person can plan and track work, and let agents do part of it, without a heavy hosted tool. Success is: you open it, see what is yours and what is next, move work forward, and trust the numbers.

## Positioning
- Self-hosted and small, with no per-seat pricing or configuration maze.
- Agent-native: an MCP server (including a low-token Code Mode endpoint) lets agents plan and update work.
- Connected to Skylark: tickets opened from Skylark errors arrive here, labelled "skylark".

## Operating Context
Live at https://ossicone.halfagiraf.com on a Raspberry Pi, deployed on push to the `ossicone` branch. NestJS and PostgreSQL backend, React 19 and Tailwind 4 frontend, with a light and a dark theme and a toggle.

## Capabilities and Constraints
Projects, issues (story, task, bug, epic; statuses todo, in progress, code review, done), a drag-and-drop Kanban board with a Move-to menu for touch, backlog with sprint planning, sprint history, reports (burndown, burnup, velocity, cumulative flow, cycle time), time tracking with an estimate and an active timer, comments, attachments, issue links, subtasks, a wiki, a repository view, search, workspaces with members and invites, API tokens and OAuth for MCP. No invented numbers: every figure shown must come from real data.

## Brand Commitments
Must stay exactly as it works today: the drag-and-drop board, and the reports. The new look (chosen by the owner, "a different world" from Skylark): dark graphite with one amber signal, with a light theme kept and the theme toggle kept. Monochrome icons; no emoji.

## Evidence on Hand
Real data exists only in the local review rig (`/home/dev/opencode/ossicone-review-rig`). No customers, testimonials or benchmarks exist and none may be invented.

## Product Principles
1. Show what is yours and what is next before anything else.
2. The board and the reports are the heart; nothing may make them harder to use.
3. Dense and calm: a tool used for hours, not a landing page.
4. Humans and agents are both first-class; show which is which where the data allows.
