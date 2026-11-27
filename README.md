# Freewrite

Free and open-source narrative design application for game developers & writers.
Freewrite aim at providing a platform for our teams to collaborate on dialogue and game design, which will impact the workflow this tool builds on:
Inspired (& integrated) with: Pixel Crusher's Dialogue System for Unity, Articy:Draft, Drafft2, Crowdin, and more.

## How to use?

To use the tool, simply click [here](https://loupystudio-software.github.io/Freewrite/)!

Alternatively, if you wanna use it locally (or host a collab server), simply download the [latest version](https://github.com/Loupystudio-software/Freewrite/archive/refs/heads/main.zip), and start the app through start.bat or start.sh.
To collaborate, open port 1234 on the server's router (user who will host the files) and join through the address provided in the shell.
If the page fails to load, try reloading it (F5) once.
A room will keep the changes it has, and overwrite any project you have open when joining it, so save beforehand!
If you have any other issue, join our Discord to discuss it, or open an issue on the github repo.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Project

- `apps/web` — Browser application (React + Vite)
- `apps/server` — Collaboration server (Node.js + Hocuspocus, Milestone 4)
- `packages/core` — Core data model, validation, serialization
- `packages/ui` — Shared UI primitives

## Want to help?

You are free to post issues you may find, or ideas you may have in the issue tracker.
You are free to tackle any open issue and provide a PR. If it suits the direction of the tool, we'll be more than happy to integrate the changes in the next build!
