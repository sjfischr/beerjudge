create or replace view public.competition_results as
select
  e.competition_id,
  e.id as entry_id,
  e.entry_number,
  e.bjcp_category,
  e.bjcp_subcategory,
  e.bjcp_style_name,
  count(s.id) filter (where s.status = 'submitted') as submitted_scoresheets,
  avg(s.total_score)::numeric(5,2) filter (where s.status = 'submitted') as average_score,
  max(s.total_score) filter (where s.status = 'submitted') as best_score
from public.entries e
left join public.scoresheets s
  on s.entry_id = e.id
group by e.competition_id, e.id;

grant select on public.competition_results to authenticated;
