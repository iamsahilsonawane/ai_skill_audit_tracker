-- Example: enable the "vector" extension.
create extension vector
with
  schema extensions;

create table search_index (
  id text primary key,
  source_type text not null, -- course | document
  source_id uuid not null,

  title text,
  content text,

  metadata jsonb,

  embedding vector(512),
  fts tsvector generated always as (to_tsvector('english', content)) stored,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create an index for the full-text search
create index on search_index using gin(fts);
-- Create an index for the semantic vector search
create index on search_index using hnsw (embedding vector_ip_ops);


create or replace function hybrid_search(
  query_text text,
  query_embedding extensions.vector(512),
  match_count int,
  full_text_weight float = 1,
  semantic_weight float = 1,
  rrf_k int = 50
)
returns setof search_index
language sql
as $$
with full_text as (
  select
    id,
    -- Note: ts_rank_cd is not indexable but will only rank matches of the where clause
    -- which shouldn't be too big
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
  search_index.*
from
  full_text
  full outer join semantic
    on full_text.id = semantic.id
  join search_index
    on coalesce(full_text.id, semantic.id) = search_index.id
order by
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit
  least(match_count, 30)
$$;



-------------------


create or replace function upsert_search_index(
  p_source_type text,
  p_source_id uuid,
  p_title text,
  p_content text,
  p_metadata jsonb
)
returns void
language plpgsql
as $$
declare
  v_id text;
begin

  v_id := p_source_type || '_' || p_source_id;

  insert into search_index (
    id,
    source_type,
    source_id,
    title,
    content,
    metadata,
    fts
  )
  values (
    v_id,
    p_source_type,
    p_source_id,
    p_title,
    p_content,
    p_metadata,
    to_tsvector('english', coalesce(p_title,'') || ' ' || coalesce(p_content,''))
  )
  on conflict (id)
  do update set
    title = excluded.title,
    content = excluded.content,
    metadata = excluded.metadata,
    fts = excluded.fts,
    updated_at = now();

end;
$$;


create or replace function delete_search_index(
  p_source_type text,
  p_source_id uuid
)
returns void
language plpgsql
as $$
declare
  v_id text;
begin

  v_id := p_source_type || '_' || p_source_id;

  delete from search_index
  where id = v_id;

end;
$$;

--------------

create or replace function learning_plan_weeks_search_trigger()
returns trigger
language plpgsql
as $$
begin

  if (tg_op = 'DELETE') then
    perform delete_search_index('learning_plan', old.id);
    return old;
  end if;

  perform upsert_search_index(
    'learning_plan',
    new.id,
    new.title,
    new.description,
    jsonb_build_object(
      'status', new.status
    )
  );

  return new;

end;
$$;

create trigger learning_plan_weeks_search_sync
after insert or update or delete
on learning_plan_weeks
for each row
execute function learning_plan_weeks_search_trigger();

