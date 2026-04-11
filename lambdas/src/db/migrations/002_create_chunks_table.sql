create extension if not exists vector;

create table if not exists chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id varchar(64) not null,
  worksapce_id varchar(64) not null,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists idx_chunks_workspace_id on chunks (worksapce_id);
create index if not exists idx_chunks_user_id on chunks (user_id);
create index if not exists idx_chunks_document_id on chunks (document_id);