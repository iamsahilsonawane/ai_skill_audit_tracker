-- ============================================================
-- Backfill existing rows
-- ============================================================

insert into search_index (
  id,
  source_type,
  source_id,
  title,
  content,
  metadata
)
select
  'project_' || id as id,
  'project' as source_type,
  id as source_id,
  title,
  description as content,
  jsonb_build_object(
    'status', status
  ) as metadata
from projects
on conflict (id) do nothing;

---

insert into search_index (
  id,
  source_type,
  source_id,
  title,
  content,
  metadata
)
select
  'skill_' || id as id,
  'skill' as source_type,
  id as source_id,
  name as title,
  name as content,
  jsonb_build_object(
    'category', category
  ) as metadata
from skills
on conflict (id) do nothing;

---

insert into search_index (
  id,
  source_type,
  source_id,
  title,
  content,
  metadata
)
select
  'resource_' || id as id,
  'resource' as source_type,
  id as source_id,
  title,
  title as content,
  jsonb_build_object(
    'resource_type', resource_type,
    'url', url
  ) as metadata
from resources
on conflict (id) do nothing;


-- ============================================================
-- Trigger functions
-- ============================================================

create or replace function projects_search_trigger()
returns trigger
language plpgsql
as $$
begin

  if (tg_op = 'DELETE') then
    perform delete_search_index('project', old.id);
    return old;
  end if;

  perform upsert_search_index(
    'project',
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

create trigger projects_search_sync
after insert or update or delete
on projects
for each row
execute function projects_search_trigger();

---

create or replace function skills_search_trigger()
returns trigger
language plpgsql
as $$
begin

  if (tg_op = 'DELETE') then
    perform delete_search_index('skill', old.id);
    return old;
  end if;

  perform upsert_search_index(
    'skill',
    new.id,
    new.name,
    new.name,
    jsonb_build_object(
      'category', new.category
    )
  );

  return new;

end;
$$;

create trigger skills_search_sync
after insert or update or delete
on skills
for each row
execute function skills_search_trigger();

---

create or replace function resources_search_trigger()
returns trigger
language plpgsql
as $$
begin

  if (tg_op = 'DELETE') then
    perform delete_search_index('resource', old.id);
    return old;
  end if;

  perform upsert_search_index(
    'resource',
    new.id,
    new.title,
    new.title,
    jsonb_build_object(
      'resource_type', new.resource_type,
      'url', new.url
    )
  );

  return new;

end;
$$;

create trigger resources_search_sync
after insert or update or delete
on resources
for each row
execute function resources_search_trigger();
