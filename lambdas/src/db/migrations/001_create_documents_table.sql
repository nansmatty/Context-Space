create extension if not exists "uuid-ossp";

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  user_id varchar(64) not null,
  workspace_id varchar(64) not null,
  s3_key text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  status varchar(30) not null default 'uploaded',
  chunk_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_workspace_id on documents (workspace_id);
create index if not exists idx_documents_user_id on documents (user_id);
create index if not exists idx_documents_status on documents (status);