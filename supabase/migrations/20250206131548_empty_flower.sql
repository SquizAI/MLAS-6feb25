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

-- Create simplified document policies
CREATE POLICY "document_select_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = documents.id
      AND document_shares.shared_with = auth.uid()
      AND (document_shares.expires_at IS NULL OR document_shares.expires_at > now())
    )
  );

CREATE POLICY "document_insert_policy"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "document_update_policy"
  ON documents FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "document_delete_policy"
  ON documents FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create simplified document shares policies
CREATE POLICY "document_shares_select_policy"
  ON document_shares FOR SELECT
  TO authenticated
  USING (
    shared_with = auth.uid() OR
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_shares.document_id
      AND documents.owner_id = auth.uid()
    )
  );

CREATE POLICY "document_shares_insert_policy"
  ON document_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_shares.document_id
      AND documents.owner_id = auth.uid()
    )
  );

-- Add missing indexes for policy performance
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON documents(owner_id);
CREATE INDEX IF NOT EXISTS document_shares_document_id_shared_with_idx ON document_shares(document_id, shared_with);
CREATE INDEX IF NOT EXISTS document_shares_expires_at_idx ON document_shares(expires_at);