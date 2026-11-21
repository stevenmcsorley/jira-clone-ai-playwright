---
version: 1
slug: "frontend-src-components-layout-layout-tsx"
primary_target: "frontend/src/components/Layout/Layout.tsx"
related_targets: []
---

# Surface brief: Ossicone app (Operate)

Visitor mode: Operate. One developer and the agents around them plan sprints, work the board, and read reports, for hours at a stretch.

## Direction contract

THESIS: Ossicone is a workbench, not a Jira skin. Work you own sits in front of you; everything else is one tab away in a two-level structure (workspace: Today, Projects, Agents; project: Board, Backlog, Issues, Insights, Docs, Settings). Refuses the category default of a pale-blue sidebar app with a coloured square for every issue type.
OWN-WORLD: Warm graphite (#121211 page, #1a1a18 panels, hairline #2a2a27 rules) with one amber signal (#e0a43a) for what is yours, in progress, or primary; text in warm off-white (#efede5). A light theme is kept: warm paper (#f7f6f2) with brass (#8a5a00). Geist, tabular figures, mono only for issue keys and the timer. Flat panels, no gradients, no shadows, 8px radii, 1px rules, monochrome line icons, monochrome issue-type glyphs (only a bug carries red). The mark is two knobbed ossicones.
STORY: Open Today, see active sprints and the work that is yours, step into a project, work the Board by dragging cards, plan in the Backlog, read Insights.
FIRST VIEWPORT: Today: ruled top bar (mark, three text tabs, search, create, bell, theme, avatar), title and one-line purpose, an Active sprints panel (key, name and goal, X of Y done, days left), then In progress, Waiting for review, From Skylark and Up next as ruled lists with an issue key, title, priority and project.
FORM: Workbench (the owner chose "a different world" with dark graphite and one amber accent; seed: none (pinned) "dark graphite with one amber accent").
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
