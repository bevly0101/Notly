-- ============================================================
-- NOTLY — Supabase Database Init
-- Versão: 1.0
-- Descrição: Script completo de inicialização do banco Supabase
-- Uso: Colar no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- 2. Enums
CREATE TYPE provider_type AS ENUM ('groq', 'openai', 'gemini', 'claude');
CREATE TYPE block_type AS ENUM ('paragraph', 'heading', 'bullet_list', 'ordered_list', 'todo_list', 'code_block', 'blockquote', 'image', 'video', 'chart', 'page_reference', 'divider', 'callout', 'toggle', 'table', 'embed');
CREATE TYPE sync_action AS ENUM ('create', 'update', 'soft_delete', 'restore');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'conflict', 'error');

-- 3. Tabelas

CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Meu Workspace',
  icon        TEXT DEFAULT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_deleted_at ON workspaces(deleted_at);

CREATE TABLE pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
  path          LTREE,
  title         TEXT NOT NULL DEFAULT 'Sem título',
  icon          TEXT DEFAULT NULL,
  cover_image   TEXT DEFAULT NULL,
  is_favorite   BOOLEAN DEFAULT FALSE,
  sort_order    INT DEFAULT 0,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_pages_workspace_id ON pages(workspace_id);
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_pages_path ON pages USING GIST(path);
CREATE INDEX idx_pages_deleted_at ON pages(deleted_at);

CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type        block_type NOT NULL DEFAULT 'paragraph',
  content     JSONB DEFAULT NULL,
  attrs       JSONB DEFAULT NULL,
  parent_id   UUID REFERENCES blocks(id) ON DELETE SET NULL,
  sort_order  INT DEFAULT 0,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_blocks_page_id ON blocks(page_id);
CREATE INDEX idx_blocks_parent_id ON blocks(parent_id);
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_blocks_deleted_at ON blocks(deleted_at);

CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      provider_type NOT NULL,
  label         TEXT NOT NULL,
  key_hash      TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  model         TEXT NOT NULL,
  temperature   REAL DEFAULT 0.7,
  is_active     BOOLEAN DEFAULT TRUE,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE UNIQUE INDEX idx_api_keys_user_provider ON api_keys(user_id, provider) WHERE deleted_at IS NULL;

CREATE TABLE sync_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT NOT NULL,
  record_id     UUID NOT NULL,
  action        sync_action NOT NULL,
  actor_id      UUID REFERENCES auth.users(id),
  snapshot      JSONB,
  sync_status   sync_status DEFAULT 'synced',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_log_table_record ON sync_log(table_name, record_id);
CREATE INDEX idx_sync_log_sync_status ON sync_log(sync_status);
CREATE INDEX idx_sync_log_created_at ON sync_log(created_at);

-- 4. Triggers

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE OR REPLACE FUNCTION fn_sync_enqueue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_action sync_action;
  v_snapshot JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_snapshot := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      v_action := 'soft_delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'restore';
    ELSE
      v_action := 'update';
    END IF;
    v_snapshot := to_jsonb(NEW);
  END IF;

  INSERT INTO sync_log (table_name, record_id, action, actor_id, snapshot)
  VALUES (TG_TABLE_NAME, NEW.id, v_action, auth.uid(), v_snapshot);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workspaces_sync AFTER INSERT OR UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION fn_sync_enqueue();
CREATE TRIGGER trg_pages_sync AFTER INSERT OR UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION fn_sync_enqueue();
CREATE TRIGGER trg_blocks_sync AFTER INSERT OR UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION fn_sync_enqueue();
CREATE TRIGGER trg_api_keys_sync AFTER INSERT OR UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION fn_sync_enqueue();

CREATE OR REPLACE FUNCTION fn_page_path_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := text2ltree(NEW.id::text);
  ELSE
    SELECT path || text2ltree(NEW.id::text) INTO NEW.path
    FROM pages WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pages_path BEFORE INSERT OR UPDATE OF parent_id ON pages FOR EACH ROW EXECUTE FUNCTION fn_page_path_update();

-- 5. Stored Procedures (RPC)

-- 5.1. Workspace Procedures

CREATE OR REPLACE FUNCTION workspace_create(
  p_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT 'Meu Workspace',
  p_icon TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_result JSONB;
BEGIN
  v_id := COALESCE(p_id, gen_random_uuid());

  INSERT INTO workspaces (id, user_id, name, icon, metadata)
  VALUES (v_id, auth.uid(), p_name, p_icon, p_metadata)
  ON CONFLICT (id) DO UPDATE SET
    name     = EXCLUDED.name,
    icon     = EXCLUDED.icon,
    metadata = EXCLUDED.metadata
  RETURNING to_jsonb(workspaces.*) - 'user_id' INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION workspace_get(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT to_jsonb(w.*) - 'user_id' INTO v_result
  FROM workspaces w
  WHERE w.id = p_id
    AND w.user_id = auth.uid()
    AND w.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace não encontrado ou sem acesso';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION workspace_update(
  p_id UUID,
  p_name TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE workspaces SET
    name    = COALESCE(p_name, name),
    icon    = COALESCE(p_icon, icon),
    metadata = CASE WHEN p_metadata IS NULL THEN metadata ELSE metadata || p_metadata END
  WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL
  RETURNING to_jsonb(workspaces.*) - 'user_id' INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace não encontrado ou sem acesso';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION workspace_delete(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE workspaces SET deleted_at = now()
  WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace não encontrado ou sem acesso';
  END IF;
END;
$$;

-- 5.2. Page Procedures

CREATE OR REPLACE FUNCTION page_create(
  p_workspace_id UUID,
  p_parent_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT 'Sem título',
  p_icon TEXT DEFAULT NULL,
  p_sort_order INT DEFAULT 0,
  p_metadata JSONB DEFAULT '{}',
  p_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_result JSONB;
BEGIN
  v_id := COALESCE(p_id, gen_random_uuid());

  IF NOT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = p_workspace_id AND user_id = auth.uid() AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Workspace não encontrado ou sem acesso';
  END IF;

  INSERT INTO pages (id, workspace_id, parent_id, title, icon, sort_order, metadata)
  VALUES (v_id, p_workspace_id, p_parent_id, p_title, p_icon, p_sort_order, p_metadata)
  ON CONFLICT (id) DO UPDATE SET
    title      = EXCLUDED.title,
    icon       = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    parent_id  = EXCLUDED.parent_id,
    metadata   = EXCLUDED.metadata
  RETURNING to_jsonb(pages.*) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION page_get_by_workspace(p_workspace_id UUID)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = p_workspace_id AND user_id = auth.uid() AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Workspace não encontrado ou sem acesso';
  END IF;

  SELECT array_agg(to_jsonb(p.*) ORDER BY p.sort_order, p.created_at)
  INTO v_results
  FROM pages p
  WHERE p.workspace_id = p_workspace_id AND p.deleted_at IS NULL;

  RETURN v_results;
END;
$$;

CREATE OR REPLACE FUNCTION page_get_children(p_parent_id UUID)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pages p
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE p.id = p_parent_id AND w.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Página não encontrada ou sem acesso';
  END IF;

  SELECT array_agg(to_jsonb(p.*) ORDER BY p.sort_order)
  INTO v_results
  FROM pages p
  WHERE p.parent_id = p_parent_id AND p.deleted_at IS NULL;

  RETURN v_results;
END;
$$;

CREATE OR REPLACE FUNCTION page_get_ancestors(p_page_id UUID)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB[];
BEGIN
  SELECT array_agg(to_jsonb(p.*) ORDER BY nlevel(p.path))
  INTO v_results
  FROM pages p
  JOIN pages current ON current.path @> p.path
  WHERE current.id = p_page_id AND p.deleted_at IS NULL;

  RETURN v_results;
END;
$$;

CREATE OR REPLACE FUNCTION page_update(
  p_id UUID,
  p_title TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_cover_image TEXT DEFAULT NULL,
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_sort_order INT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE pages SET
    title       = COALESCE(p_title, title),
    icon        = COALESCE(p_icon, icon),
    cover_image = COALESCE(p_cover_image, cover_image),
    is_favorite = COALESCE(p_is_favorite, is_favorite),
    sort_order  = COALESCE(p_sort_order, sort_order),
    parent_id   = COALESCE(p_parent_id, parent_id),
    metadata    = CASE WHEN p_metadata IS NULL THEN metadata ELSE metadata || p_metadata END
  FROM workspaces w
  WHERE pages.id = p_id
    AND pages.workspace_id = w.id
    AND w.user_id = auth.uid()
    AND pages.deleted_at IS NULL
  RETURNING to_jsonb(pages.*) INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Página não encontrada ou sem acesso';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION page_delete(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pages SET deleted_at = now()
  FROM workspaces w
  WHERE pages.id = p_id
    AND pages.workspace_id = w.id
    AND w.user_id = auth.uid()
    AND pages.deleted_at IS NULL;

  UPDATE pages SET deleted_at = now()
  FROM workspaces w
  WHERE pages.path <@ (SELECT path FROM pages WHERE id = p_id)
    AND pages.workspace_id = w.id
    AND w.user_id = auth.uid()
    AND pages.deleted_at IS NULL;
END;
$$;

-- 5.3. Block Procedures

CREATE OR REPLACE FUNCTION block_create(
  p_page_id UUID,
  p_type block_type DEFAULT 'paragraph',
  p_content JSONB DEFAULT NULL,
  p_attrs JSONB DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_sort_order INT DEFAULT 0,
  p_metadata JSONB DEFAULT '{}',
  p_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_result JSONB;
BEGIN
  v_id := COALESCE(p_id, gen_random_uuid());

  IF NOT EXISTS (
    SELECT 1 FROM pages p
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE p.id = p_page_id AND w.user_id = auth.uid() AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Página não encontrada ou sem acesso';
  END IF;

  INSERT INTO blocks (id, page_id, type, content, attrs, parent_id, sort_order, metadata)
  VALUES (v_id, p_page_id, p_type, p_content, p_attrs, p_parent_id, p_sort_order, p_metadata)
  ON CONFLICT (id) DO UPDATE SET
    type       = EXCLUDED.type,
    content    = EXCLUDED.content,
    attrs      = EXCLUDED.attrs,
    sort_order = EXCLUDED.sort_order,
    parent_id  = EXCLUDED.parent_id,
    metadata   = EXCLUDED.metadata
  RETURNING to_jsonb(blocks.*) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION block_get_by_page(p_page_id UUID)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB[];
BEGIN
  SELECT array_agg(to_jsonb(b.*) ORDER BY b.sort_order)
  INTO v_results
  FROM blocks b
  JOIN pages p ON p.id = b.page_id
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE b.page_id = p_page_id
    AND w.user_id = auth.uid()
    AND b.deleted_at IS NULL;

  RETURN v_results;
END;
$$;

CREATE OR REPLACE FUNCTION block_update(
  p_id UUID,
  p_type block_type DEFAULT NULL,
  p_content JSONB DEFAULT NULL,
  p_attrs JSONB DEFAULT NULL,
  p_sort_order INT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE blocks SET
    type       = COALESCE(p_type, type),
    content    = COALESCE(p_content, content),
    attrs      = COALESCE(p_attrs, attrs),
    sort_order = COALESCE(p_sort_order, sort_order),
    parent_id  = COALESCE(p_parent_id, parent_id),
    metadata   = CASE WHEN p_metadata IS NULL THEN metadata ELSE metadata || p_metadata END
  FROM pages p
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE blocks.id = p_id
    AND blocks.page_id = p.id
    AND w.user_id = auth.uid()
    AND blocks.deleted_at IS NULL
  RETURNING to_jsonb(blocks.*) INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bloco não encontrado ou sem acesso';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION block_reorder(
  p_blocks JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blocks SET sort_order = (elem->>'sort_order')::INT
  FROM jsonb_array_elements(p_blocks) AS elem
  JOIN pages p ON p.id = blocks.page_id
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE blocks.id = (elem->>'id')::UUID
    AND w.user_id = auth.uid()
    AND blocks.deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION block_delete(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blocks SET deleted_at = now()
  FROM pages p
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE blocks.id = p_id
    AND blocks.page_id = p.id
    AND w.user_id = auth.uid()
    AND blocks.deleted_at IS NULL;
END;
$$;

-- 5.4. Sync Procedures

CREATE OR REPLACE FUNCTION sync_pull(p_since TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspaces JSONB;
  v_pages JSONB;
  v_blocks JSONB;
  v_deleted JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(w.*)), '[]'::jsonb)
  INTO v_workspaces
  FROM workspaces w
  WHERE w.user_id = auth.uid()
    AND w.updated_at > p_since
    AND w.deleted_at IS NULL;

  SELECT COALESCE(jsonb_agg(to_jsonb(p.*)), '[]'::jsonb)
  INTO v_pages
  FROM pages p
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE w.user_id = auth.uid()
    AND p.updated_at > p_since
    AND p.deleted_at IS NULL;

  SELECT COALESCE(jsonb_agg(to_jsonb(b.*)), '[]'::jsonb)
  INTO v_blocks
  FROM blocks b
  JOIN pages p ON p.id = b.page_id
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE w.user_id = auth.uid()
    AND b.updated_at > p_since
    AND b.deleted_at IS NULL;

  SELECT COALESCE(jsonb_agg(sub.doc), '[]'::jsonb)
  INTO v_deleted
  FROM (
    SELECT jsonb_build_object('table_name', 'workspaces', 'record_id', w.id) AS doc
    FROM workspaces w
    WHERE w.user_id = auth.uid()
      AND w.deleted_at IS NOT NULL
      AND w.updated_at > p_since
    UNION ALL
    SELECT jsonb_build_object('table_name', 'pages', 'record_id', p.id)
    FROM pages p
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE w.user_id = auth.uid()
      AND p.deleted_at IS NOT NULL
      AND p.updated_at > p_since
    UNION ALL
    SELECT jsonb_build_object('table_name', 'blocks', 'record_id', b.id)
    FROM blocks b
    JOIN pages p ON p.id = b.page_id
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE w.user_id = auth.uid()
      AND b.deleted_at IS NOT NULL
      AND b.updated_at > p_since
  ) sub;

  RETURN jsonb_build_object(
    'workspaces', v_workspaces,
    'pages', v_pages,
    'blocks', v_blocks,
    'deleted', v_deleted
  );
END;
$$;

-- 6. RLS

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log   ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspaces_owner ON workspaces FOR ALL USING (user_id = auth.uid());
CREATE POLICY pages_owner ON pages FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
CREATE POLICY blocks_owner ON blocks FOR ALL USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON w.id = p.workspace_id WHERE w.user_id = auth.uid()));
CREATE POLICY api_keys_owner ON api_keys FOR ALL USING (user_id = auth.uid());
CREATE POLICY sync_log_read ON sync_log FOR SELECT USING (actor_id = auth.uid());

-- 7. Auth — user_profiles + trigger

CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT DEFAULT NULL,
  preferences  JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id) VALUES (NEW.id);
  INSERT INTO workspaces (user_id, name) VALUES (NEW.id, 'Meu Workspace');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_create_profile ON auth.users;
CREATE TRIGGER trg_auth_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_create_profile();

-- 8. Realtime

ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE pages;
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
