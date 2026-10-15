-- Safe to run repeatedly in Supabase SQL Editor. This query only reads metadata.
-- Expect eight PASS rows for the initial foundation. No customer data is returned.
-- This is a setup check, not a replacement for the full SQL regression tests.
with expected_tables (table_name, policy_name, columns_signature) as (
  values
    ('services', 'services_active_read',
     'id:text,name:text,active:bool,created_at:timestamptz'),
    ('customer_profiles', 'customers_read_self',
     'user_id:uuid,full_name:text,phone:text,created_at:timestamptz'),
    ('providers', 'providers_read_self',
     'id:uuid,user_id:uuid,public_id:text,display_name:text,business_name:text,approval_status:text,created_at:timestamptz'),
    ('provider_services', 'provider_services_read_self',
     'provider_id:uuid,service_id:text'),
    ('route_blocks', 'routes_read_assigned',
     'id:uuid,service_id:text,service_date:date,area_label:text,country_code:text,postal_code:text,provider_id:uuid,status:text,accepted_at:timestamptz,created_at:timestamptz'),
    ('bookings', 'bookings_read_participant',
     'id:uuid,public_code:text,customer_id:uuid,service_id:text,service_date:date,requested_window:text,address:text,country_code:text,postal_code:text,property_notes:text,gate_code:text,route_block_id:uuid,route_position:int2,status:text,quoted_total_cents:int4,currency:text,arrived_at:timestamptz,completed_at:timestamptz,created_at:timestamptz'),
    ('booking_photos', 'photos_read_participant',
     'id:uuid,booking_id:uuid,uploaded_by:uuid,kind:text,object_path:text,content_type:text,size_bytes:int4,created_at:timestamptz')
), table_checks as (
  select
    e.table_name,
    c.oid is not null as table_exists,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    not exists (
      select 1 from unnest(string_to_array(e.columns_signature, ',')) as expected(signature)
      where not exists (
        select 1 from information_schema.columns col
        where col.table_schema = 'public' and col.table_name = e.table_name
          and col.column_name || ':' || col.udt_name = expected.signature
      )
    ) as columns_match,
    (
      select count(*) = 1 and bool_and(p.policyname = e.policy_name and p.cmd = 'SELECT')
      from pg_policies p where p.schemaname = 'public' and p.tablename = e.table_name
    ) as read_policy_present,
    coalesce(
      has_table_privilege('authenticated', c.oid, 'SELECT')
      and has_table_privilege('anon', c.oid, 'SELECT') = (e.table_name = 'services')
      and not has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      and not has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
      false
    ) as api_grants_match
  from expected_tables e
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relnamespace = n.oid and c.relname = e.table_name and c.relkind = 'r'
), results as (
  select
    'public.' || table_name as item,
    case when table_exists and rls_enabled and columns_match and read_policy_present and api_grants_match
      then 'PASS' else 'CHECK' end as result,
    case when not table_exists then 'Table is missing'
      else concat_ws('; ',
        case when not rls_enabled then 'RLS is disabled' end,
        case when not columns_match then 'Expected columns or types are missing' end,
        case when not read_policy_present then 'Expected read policy is missing or extra policies exist' end,
        case when not api_grants_match then 'API grants differ from the locked foundation' end
      )
    end as details
  from table_checks
  union all
  select 'storage.blokpakt-evidence',
    case when
      exists (
        select 1 from storage.buckets b
        where b.id = 'blokpakt-evidence' and not b.public and b.file_size_limit = 1000000
          and b.allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']
          and cardinality(b.allowed_mime_types) = 3
      )
      and exists (
        select 1 from pg_policies p
        where p.schemaname = 'storage' and p.tablename = 'objects'
          and p.policyname = 'blokpakt_evidence_locked_until_api'
          and p.permissive = 'RESTRICTIVE' and p.cmd = 'ALL'
          and p.roles @> array['anon', 'authenticated']::name[]
      )
      and exists (
        select 1 from pg_tables t
        where t.schemaname = 'storage' and t.tablename = 'objects' and t.rowsecurity
      )
      then 'PASS' else 'CHECK' end,
    'Expected: private bucket, 1 MB limit, JPEG/PNG/WebP, and initial API lock'
)
select item, result, details from results order by item;
