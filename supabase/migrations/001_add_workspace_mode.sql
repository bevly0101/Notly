-- Migration: add mode column to workspaces for Local vs Sync
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'sync'
  CHECK (mode IN ('local', 'sync'));

CREATE INDEX IF NOT EXISTS idx_workspaces_mode ON workspaces(mode);
