insert into search_index (
  id,
  source_type,
  source_id,
  title,
  content,
  metadata
)
select
  'learning_plan_' || id as id,
  'learning_plan' as source_type,
  id as source_id,
  title,
  description as content,
  jsonb_build_object(
    'status', 'upcoming'
  ) as metadata
from learning_plan_weeks
on conflict (id) do nothing;