
create type public.app_role as enum ('admin','red_team','blue_team','member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Analyst',
  team_focus text not null default 'Unassigned',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "team reads profiles" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "team reads roles" on public.user_roles for select to authenticated using (true);
create policy "admin grants roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin revokes roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.audit_log (
  id bigserial primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "admins read audit" on public.audit_log for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(actor, action, entity, entity_id, details)
  values (auth.uid(), tg_op, tg_table_name, (case when tg_op='DELETE' then old.id else new.id end)::text,
          case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  hostname text not null,
  ip_address text,
  environment text not null default 'Lab' check (environment in ('Lab','Development','Production')),
  owner_name text,
  os text,
  services text,
  tags text[] not null default '{}',
  authorized boolean not null default false,
  permitted_methods text,
  archived boolean not null default false,
  is_sample boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.validate_asset()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.authorized and new.environment = 'Production' then
    raise exception 'Production assets cannot be authorized for offensive testing';
  end if;
  return new;
end $$;
create trigger assets_validate before insert or update on public.assets for each row execute function public.validate_asset();
create trigger assets_touch before update on public.assets for each row execute function public.touch_updated_at();
create trigger assets_audit after insert or update or delete on public.assets for each row execute function public.audit_trigger();

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid default auth.uid(),
  scope text not null,
  authorization_note text not null,
  asset_ids uuid[] not null default '{}',
  start_date date not null default current_date,
  status text not null default 'Planned' check (status in ('Planned','Active','Completed','Cancelled')),
  progress int not null default 0 check (progress between 0 and 100),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.validate_assessment_scope()
returns trigger language plpgsql set search_path = public as $$
declare bad int;
begin
  if array_length(new.asset_ids,1) is null then
    raise exception 'An assessment needs at least one authorized target';
  end if;
  select count(*) into bad from unnest(new.asset_ids) a(id)
    where not exists (select 1 from public.assets s where s.id = a.id and s.authorized and not s.archived);
  if bad > 0 then
    raise exception 'Scope violation: % target(s) are not authorized lab assets', bad;
  end if;
  return new;
end $$;
create trigger assessments_scope before insert or update on public.assessments for each row execute function public.validate_assessment_scope();
create trigger assessments_audit after insert or update or delete on public.assessments for each row execute function public.audit_trigger();

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text not null check (severity in ('Critical','High','Medium','Low','Info')),
  category text,
  asset_id uuid references public.assets(id) on delete set null,
  assessment_id uuid references public.assessments(id) on delete set null,
  cvss numeric(3,1) check (cvss between 0 and 10),
  steps text,
  evidence text,
  impact text,
  recommendation text,
  status text not null default 'Discovered' check (status in ('Discovered','Triaged','Assigned','Fix in Progress','Ready for Verification','Verified Fixed','Accepted Risk','False Positive')),
  assignee_id uuid,
  verified_at timestamptz,
  is_sample boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.findings(status);
create trigger findings_touch before update on public.findings for each row execute function public.touch_updated_at();
create trigger findings_audit after insert or update or delete on public.findings for each row execute function public.audit_trigger();

create table public.detection_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  field text not null check (field in ('event_type','source','message','severity')),
  operator text not null check (operator in ('equals','contains')),
  value text not null,
  threshold int not null default 1 check (threshold >= 1),
  window_minutes int not null default 5 check (window_minutes between 1 and 1440),
  severity text not null check (severity in ('Critical','High','Medium','Low')),
  recommendation text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create trigger rules_audit after insert or update or delete on public.detection_rules for each row execute function public.audit_trigger();

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  source text not null,
  event_type text not null,
  severity text not null default 'Low' check (severity in ('Critical','High','Medium','Low','Info')),
  asset_id uuid references public.assets(id) on delete set null,
  message text not null,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.security_events(occurred_at desc);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.detection_rules(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  severity text not null,
  reason text not null,
  event_ids uuid[] not null default '{}',
  hit_count int not null default 1,
  status text not null default 'New' check (status in ('New','Investigating','Resolved','False Positive')),
  assignee_id uuid,
  notes text,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  finding_id uuid references public.findings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger alerts_touch before update on public.alerts for each row execute function public.touch_updated_at();

create or replace function public.alert_timestamps()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status <> 'New' and new.acknowledged_at is null then new.acknowledged_at = now(); end if;
  if new.status in ('Resolved','False Positive') and new.resolved_at is null then new.resolved_at = now(); end if;
  if new.status in ('New','Investigating') then new.resolved_at = null; end if;
  return new;
end $$;
create trigger alerts_ts before update on public.alerts for each row execute function public.alert_timestamps();

create or replace function public.event_matches(r public.detection_rules, e public.security_events)
returns boolean language sql immutable as $$
  select case r.field
    when 'event_type' then case r.operator when 'equals' then lower(e.event_type)=lower(r.value) else e.event_type ilike '%'||r.value||'%' end
    when 'source' then case r.operator when 'equals' then lower(e.source)=lower(r.value) else e.source ilike '%'||r.value||'%' end
    when 'severity' then case r.operator when 'equals' then lower(e.severity)=lower(r.value) else e.severity ilike '%'||r.value||'%' end
    else case r.operator when 'equals' then lower(e.message)=lower(r.value) else e.message ilike '%'||r.value||'%' end
  end
$$;

create or replace function public.process_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.detection_rules; matched uuid[]; existing uuid;
begin
  for r in select * from public.detection_rules where enabled loop
    if public.event_matches(r, new) then
      select array_agg(e.id order by e.occurred_at) into matched from public.security_events e
        where public.event_matches(r, e)
          and e.asset_id is not distinct from new.asset_id
          and e.occurred_at > new.occurred_at - make_interval(mins => r.window_minutes)
          and e.occurred_at <= new.occurred_at;
      if coalesce(array_length(matched,1),0) >= r.threshold then
        select id into existing from public.alerts
          where rule_id = r.id and asset_id is not distinct from new.asset_id and status in ('New','Investigating')
          limit 1;
        if existing is not null then
          update public.alerts set event_ids = (select array_agg(distinct x) from unnest(event_ids || matched) x),
            hit_count = hit_count + 1 where id = existing;
        else
          insert into public.alerts(rule_id, asset_id, title, severity, reason, event_ids)
          values (r.id, new.asset_id, r.name, r.severity,
            format('Rule "%s" matched: %s %s "%s" occurred %s time(s) within %s min (threshold %s)',
              r.name, r.field, r.operator, r.value, array_length(matched,1), r.window_minutes, r.threshold),
            matched);
        end if;
      end if;
    end if;
  end loop;
  return new;
end $$;
create trigger events_detect after insert on public.security_events for each row execute function public.process_event();

create or replace function public.test_rule(_field text, _operator text, _value text)
returns setof public.security_events language sql stable security invoker set search_path = public as $$
  select e.* from public.security_events e
  where public.event_matches(row(null,'t',null,_field,_operator,_value,1,5,'Low',null,true,now())::public.detection_rules, e)
  order by e.occurred_at desc limit 50
$$;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text not null,
  status text not null default 'Open' check (status in ('Open','Contained','Eradicated','Recovered','Closed')),
  summary text,
  timeline text,
  root_cause text,
  lessons text,
  alert_ids uuid[] not null default '{}',
  owner_id uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger incidents_touch before update on public.incidents for each row execute function public.touch_updated_at();
create trigger incidents_audit after insert or update or delete on public.incidents for each row execute function public.audit_trigger();

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null,
  size_bytes bigint not null check (size_bytes <= 10485760),
  mime_type text,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  finding_id uuid references public.findings(id) on delete set null,
  incident_id uuid references public.incidents(id) on delete set null,
  description text,
  uploaded_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create trigger evidence_audit after insert or update or delete on public.evidence for each row execute function public.audit_trigger();

create table public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'To Do' check (status in ('Backlog','To Do','In Progress','Review','Done')),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  assignee_id uuid,
  due_date date,
  finding_id uuid references public.findings(id) on delete set null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tasks_touch before update on public.team_tasks for each row execute function public.touch_updated_at();

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.team_tasks(id) on delete cascade,
  author_id uuid not null default auth.uid(),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('scenario','lesson')),
  item_key text not null,
  completed boolean not null default false,
  score int,
  hints_used int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, kind, item_key)
);

do $$ declare t text; begin
  foreach t in array array['assets','assessments','findings','detection_rules','security_events','alerts','incidents','evidence','team_tasks','task_comments'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "team read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "team insert" on public.%I for insert to authenticated with check (true)', t);
    execute format('create policy "team update" on public.%I for update to authenticated using (true)', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

grant select, insert, update, delete on public.progress to authenticated;
grant all on public.progress to service_role;
alter table public.progress enable row level security;
create policy "team reads progress" on public.progress for select to authenticated using (true);
create policy "own progress insert" on public.progress for insert to authenticated with check (auth.uid() = user_id);
create policy "own progress update" on public.progress for update to authenticated using (auth.uid() = user_id);

create policy "team read evidence files" on storage.objects for select to authenticated using (bucket_id = 'evidence');
create policy "team upload evidence files" on storage.objects for insert to authenticated with check (bucket_id = 'evidence');

insert into public.assets (id, hostname, ip_address, environment, owner_name, os, services, tags, authorized, permitted_methods, is_sample) values
 ('11111111-0000-0000-0000-000000000001','dvwa.lab.local','10.10.0.11','Lab','Member 2','Ubuntu 22.04','HTTP 80 (Apache, PHP, MySQL)','{web,vulnerable}',true,'Web testing, authenticated scanning',true),
 ('11111111-0000-0000-0000-000000000002','juice-shop.lab.local','10.10.0.12','Lab','Member 2','Debian 12','HTTP 3000 (Node.js)','{web,owasp}',true,'Web testing',true),
 ('11111111-0000-0000-0000-000000000003','metasploitable.lab.local','10.10.0.20','Lab','Member 1','Ubuntu 8.04','SSH 22, FTP 21, HTTP 80, SMB 445','{legacy,network}',true,'Service enumeration, version checks',true),
 ('11111111-0000-0000-0000-000000000004','siem.lab.local','10.10.0.5','Development','Member 3','Ubuntu 22.04','HTTPS 443','{blue,monitoring}',false,null,true);

insert into public.detection_rules (name, description, field, operator, value, threshold, window_minutes, severity, recommendation) values
 ('Repeated failed logins','5+ failed logins on one asset in 5 minutes suggests brute force.','event_type','equals','auth_failure',5,5,'High','Enable account lockout and rate limiting; review source IPs.'),
 ('SQL injection pattern','Request contains a classic SQLi token.','message','contains',''' OR 1=1',1,5,'Critical','Use parameterized queries; add WAF rule.'),
 ('Unexpected server errors','3+ HTTP 500 errors within 10 minutes.','event_type','equals','http_500',3,10,'Medium','Check application logs; errors may reveal stack traces.'),
 ('Access-control violation','Request to admin path by non-admin user.','event_type','equals','access_denied',1,5,'High','Verify server-side authorization on every endpoint.');

insert into public.security_events (occurred_at, source, event_type, severity, asset_id, message) select now() - (n||' seconds')::interval * 30, 'apache', 'auth_failure', 'Medium', '11111111-0000-0000-0000-000000000001', 'Failed login for user admin from 10.10.0.99 [synthetic training event]' from generate_series(6,1,-1) n;
insert into public.security_events (occurred_at, source, event_type, severity, asset_id, message) values
 (now() - interval '20 minutes','apache','http_request','Info','11111111-0000-0000-0000-000000000001','GET /vulnerabilities/sqli/?id='' OR 1=1-- [synthetic training event]'),
 (now() - interval '15 minutes','node','access_denied','Medium','11111111-0000-0000-0000-000000000002','User jim requested /rest/admin/application-configuration (403) [synthetic training event]'),
 (now() - interval '40 minutes','sshd','auth_success','Info','11111111-0000-0000-0000-000000000003','Accepted password for msfadmin [synthetic training event]');

insert into public.findings (title, severity, category, asset_id, cvss, steps, evidence, impact, recommendation, status, is_sample) values
 ('SQL injection in id parameter','Critical','Injection','11111111-0000-0000-0000-000000000001',9.8,'1. Open /vulnerabilities/sqli  2. Submit id='' OR 1=1--','All user rows returned in response','Full database read access','Use prepared statements and least-privilege DB user','Triaged',true),
 ('Reflected XSS in search','High','XSS','11111111-0000-0000-0000-000000000002',6.1,'Search for <script>alert(1)</script>','Script executes in browser','Session theft via crafted link','Context-aware output encoding, CSP','Fix in Progress',true),
 ('Anonymous FTP enabled','Medium','Misconfiguration','11111111-0000-0000-0000-000000000003',5.3,'Connect with ftp anonymous','Login accepted','Unauthenticated file access','Disable anonymous FTP','Verified Fixed',true);
update public.findings set verified_at = now() where status = 'Verified Fixed';

insert into public.team_tasks (title, description, status, priority, due_date) values
 ('Fix SQLi on DVWA','Apply parameterized queries and retest.','In Progress','Urgent', current_date + 3),
 ('Tune brute-force rule','Validate threshold against lab traffic.','To Do','High', current_date + 5),
 ('Write incident playbook','Draft containment steps for web compromise.','Backlog','Medium', null);
