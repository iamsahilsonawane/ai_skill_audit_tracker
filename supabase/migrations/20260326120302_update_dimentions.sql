-- Example: enable the "vector" extension.
create extension vector
with
  schema extensions;

-- gte-small produces 384-dimensional vectors; fix the column and function that were created with 512

-- drop the hnsw index before altering the column type
drop index if exists search_index_embedding_idx;

-- alter the embedding column to the correct dimension
alter table search_index
  alter column embedding type extensions.vector(384)
  using embedding::text::extensions.vector(384);

-- replace hybrid_search with the correct embedding dimension
create or replace function hybrid_search(
  query_text text,
  query_embedding extensions.vector(384),
  match_count int,
  full_text_weight float = 1,
  semantic_weight float = 1,
  rrf_k int = 50
)
returns table (
  id text,
  source_type text,
  source_id uuid,
  title text,
  content text,
  metadata jsonb,
  fts tsvector,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
set search_path = public, extensions
as $$
with full_text as (
  select
    id,
    row_number() over(order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from
    search_index
  where
    fts @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(match_count, 30) * 2
),
semantic as (
  select
    id,
    row_number() over (order by embedding <#> query_embedding) as rank_ix
  from
    search_index
  order by rank_ix
  limit least(match_count, 30) * 2
)
select
  si.id,
  si.source_type,
  si.source_id,
  si.title,
  si.content,
  si.metadata,
  si.fts,
  si.created_at,
  si.updated_at
from
  full_text
  full outer join semantic
    on full_text.id = semantic.id
  join search_index si
    on coalesce(full_text.id, semantic.id) = si.id
order by
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit
  least(match_count, 30)
$$;
