create or replace function get_projects_with_tasks()
returns json
language sql
security definer
as $$
  select
    coalesce(
      json_agg(
        json_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'category', p.category,
          'color', p.color,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'scheduledDay', p.scheduled_day,
          'tasks', (
            select
              coalesce(
                json_agg(
                  json_build_object(
                    'id', t.id,
                    'title', t.title,
                    'description', t.description,
                    'completed', t.completed,
                    'due_date', t.due_date,
                    'scheduled_date', t.scheduled_date,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at,
                    'project_id', t.project_id
                  ) order by t.created_at asc
                ),
                '[]'::json
              )
            from vibe_tasks as t
            where t.project_id = p.id
          )
        ) order by p.created_at desc
      ),
      '[]'::json
    )
  from vibe_projects as p
  where p.user_id = auth.uid();
$$;
