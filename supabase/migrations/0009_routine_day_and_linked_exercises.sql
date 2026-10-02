alter table routines
  add column day_of_week smallint check (day_of_week between 0 and 6);

update routines
set day_of_week = case
  when name ilike '%lunes%' then 0
  when name ilike '%martes%' then 1
  when name ilike '%miercoles%' or name ilike '%miércoles%' then 2
  when name ilike '%jueves%' then 3
  when name ilike '%viernes%' then 4
  when name ilike '%sabado%' or name ilike '%sábado%' then 5
  when name ilike '%domingo%' then 6
  else null
end
where day_of_week is null;

alter table routine_exercises
  add column linked_to_previous boolean not null default false;
