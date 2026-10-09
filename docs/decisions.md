# Decisions

Product and technical decisions, newest last.

## 2026-10-08 — Rebuild as three standalone apps

The three tools are separate apps, not pages of one site. No landing page,
no cross-links between apps, no crisis footer or badge.

## 2026-10-08 — Stack

Vite + React (JavaScript), react-router for routing, oxlint + Prettier + Vitest.
One repository, a top-level folder per app. Scaffolding first; content and
visual design come later.

## 2026-10-08 — Repo contents

GitHub gets production code only. Local review tooling, machine-local files,
and artifacts stay out of the repo (root .gitignore). Code is committed after
it passes its checks.

## 2026-10-08 — Landing, then the service

Each app opens on its own landing page; the service itself is one route
deeper (framework: /evaluate, resources: /browse, services: /directory).
There is no shared landing page and no cross-links between apps.
