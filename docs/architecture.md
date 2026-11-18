# Freewrite Architecture

## Overview

Freewrite is a monorepo organized into apps and packages.

## Packages

### `@freewrite/core`
Pure TypeScript data model, Zod validation schemas, and serialization utilities. No React, no browser APIs.

- **Models**: `Project`, `Actor`, `Conversation`, `Node` (union type), `Connection`, `Variable`
- **Validation**: `validateProject()` — returns structured errors and warnings
- **Serialization**: `serialize()`, `deserialize()`, `createEmptyProject()`

### `@freewrite/ui`
Shared UI primitives — populated in Milestone 2+.

## Apps

### `apps/web`
React 18 + Vite + Tailwind CSS v3 browser application.

- **State**: Zustand (`projectStore`)
- **Storage**: File System Access API (with `<input type="file">` fallback) + IndexedDB cache
- **Layout**: AppShell → TopBar + Sidebar + CanvasArea + Inspector + BottomBar

### `apps/server`
Node.js skeleton for Milestone 4 (Yjs + Hocuspocus real-time collaboration).

## Project File Format

```json
{
  "format": "freewrite",
  "schemaVersion": "1.0.0",
  "project": { "id": "uuid", "name": "...", ... },
  "actors": [...],
  "conversations": [...],
  "variables": [...],
  "items": [],
  "locations": [],
  "metadata": { "applicationVersion": "0.1.0", "exportSettings": {} }
}
```

## Milestones

| Milestone | Scope |
|-----------|-------|
| 1 (current) | Monorepo scaffold, core data model, app shell, file I/O |
| 2 | React Flow canvas, node CRUD, conversation editing |
| 3 | Actor/variable management, import/export (Articy, CSV) |
| 4 | Real-time collaboration (Yjs + Hocuspocus) |
