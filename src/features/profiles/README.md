# Features: Profiles

Unified profile view system for various entities (Clientes, Partes Contrárias, Terceiros, Representantes, Usuários).

## Overview

This feature provides a consistent and configurable UI for displaying entity profiles. It uses a shell component `ProfileShell` that loads a configuration object based on the entity type and renders the appropriate header, sidebar, and tab content.

## Directory Structure

- `components/`: UI components.
  - `profile-layout/`: Core layout components (Header, Sidebar, Tabs).
  - `sections/`: Reusable content sections (InfoCards, RelatedTable, ActivityTimeline, etc.).
- `configs/`: Entity-specific configurations.
- `hooks/`: Data fetching hooks.
- `utils/`: Data adapters and helpers.

## How to add a new profile type

1. Create a config file in `configs/` (e.g., `my-entity-profile.config.ts`).
2. Define the `ProfileConfig` object implementing `ProfileConfig`.
3. Add the fetch logic (if distinctive) to `useProfileData` hook.
4. Add the adapter logic to `profile-adapters.ts`.
5. Use `<ProfileShell entityType="my_entity" entityId={id} />` in your page.

## Data Fetching

Data is fetched via `useProfileData` which orchestrates calling the appropriate Server Actions.
Related entities (e.g. processes) are fetched if configured or needed.
