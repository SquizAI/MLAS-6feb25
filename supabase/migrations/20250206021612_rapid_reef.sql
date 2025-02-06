/*
  # Fix Document Policies Recursion

  1. Changes
    - Fix infinite recursion in document policies
    - Simplify policy conditions
    - Add proper indexes
    - Optimize query performance

  2. Security
    - Maintain proper access control
    - Prevent policy recursion
*/

-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "document_select_policy" ON documents;
  DROP POLICY IF EXISTS "document_insert_policy" ON documents;
  DROP POLICY IF EXISTS "document_update_policy" ON documents;
  DROP POLICY IF EXISTS "document_delete_policy" ON documents;
  DROP POLICY IF EXISTS "document_shares_select_policy" ON document_shares;
  DROP POLICY IF EXISTS "document_shares_insert_policy" ON document_shares;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create materialized view for document access
CREATE MATERIALIZED VIEW IF NOT EXISTS document_access AS
SELECT DISTINCT
  d.id as document_id,
  d.owner_id,
  ds.shared_with,
  ds.permission,
  ds.expires_at
FROM documents d
LEFT JOIN document_shares ds ON d.id = ds.document_id
WHERE ds.expires_at IS NULL OR ds.expires_at > now();

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS document_access_idx 
ON document_access(document_id, COALESCE(shared_with, owner_id));

-- Recreate document policies using materialized view
CREATE POLICY "document_select_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT document_id
      FROM document_access
      WHERE shared_with = auth.uid()
    )
  );

CREATE POLICY "document_insert_policy"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "document_update_policy"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT document_id
      FROM document_access
      WHERE shared_with = auth.uid()
      AND permission = 'edit'
    )
  );

CREATE POLICY "document_delete_policy"
  ON documents FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Document shares policies
CREATE POLICY "document_shares_select_policy"
  ON document_shares FOR SELECT
  TO authenticated
  USING (
    shared_with = auth.uid() OR
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "document_shares_insert_policy"
  ON document_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

-- Create function to refresh access view
CREATE OR REPLACE FUNCTION refresh_document_access()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY document_access;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized view
CREATE TRIGGER refresh_document_access_on_share
  AFTER INSERT OR UPDATE OR DELETE ON document_shares
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_document_access();

CREATE TRIGGER refresh_document_access_on_document
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_document_access();

-- Refresh view initially
REFRESH MATERIALIZED VIEW document_access;