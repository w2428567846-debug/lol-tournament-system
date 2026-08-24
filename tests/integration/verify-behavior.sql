\set ON_ERROR_STOP on

create temporary table integration_calls (
  label text primary key,
  account_id uuid,
  payload jsonb
);
grant all on table integration_calls to anon, authenticated, service_role;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'wechat-a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'wechat-b@example.test'),
  ('00000000-0000-0000-0000-000000000003', 'nonparticipant@example.test'),
  ('00000000-0000-0000-0000-000000000004', 'admin@example.test');

update public.accounts
set role = 'ADMIN'
where auth_user_id = '00000000-0000-0000-0000-000000000004';

-- A verified UnionID resolves multiple app-scoped OpenIDs to one account. The
-- shared UnionID is stored once, while every (app_id, openid) pair is persisted.
set role service_role;

insert into integration_calls (label, account_id)
select 'wechat-app-a', public.upsert_verified_wechat_account(
  '00000000-0000-0000-0000-000000000001',
  'app-a',
  'AAA',
  'U123',
  'Player A',
  'https://example.test/a.png'
);

insert into integration_calls (label, account_id)
select 'wechat-app-b-union', public.upsert_verified_wechat_account(
  '00000000-0000-0000-0000-000000000001',
  'app-b',
  'BBB',
  'U123',
  'Player A',
  'https://example.test/a2.png'
);

insert into integration_calls (label, account_id)
select 'wechat-app-b-openid-only', public.upsert_verified_wechat_account(
  '00000000-0000-0000-0000-000000000001',
  'app-b',
  'BBB',
  null,
  'Player A',
  'https://example.test/a3.png'
);

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.upsert_verified_wechat_account(
      '00000000-0000-0000-0000-000000000002',
      'app-c',
      'CCC',
      'U123',
      'Player B',
      null
    );
  exception when others then
    if sqlerrm <> 'WECHAT_IDENTITY_ALREADY_LINKED' then raise; end if;
    rejected := true;
  end;

  if not rejected then
    raise exception 'one verified WeChat identity created multiple accounts';
  end if;
end
$$;

reset role;

do $$
declare
  canonical_account uuid;
begin
  select account_id into canonical_account from integration_calls where label = 'wechat-app-a';

  if canonical_account is distinct from (
    select account_id from integration_calls where label = 'wechat-app-b-union'
  ) or canonical_account is distinct from (
    select account_id from integration_calls where label = 'wechat-app-b-openid-only'
  ) then
    raise exception 'cross-app WeChat identity did not resolve to one account';
  end if;

  if (select count(*) from public.wechat_identities where account_id = canonical_account) <> 2 then
    raise exception 'the second app-scoped OpenID was not persisted';
  end if;

  if not exists (
    select 1 from public.wechat_identities
    where account_id = canonical_account and app_id = 'app-a' and openid = 'AAA' and unionid = 'U123'
  ) or not exists (
    select 1 from public.wechat_identities
    where account_id = canonical_account and app_id = 'app-b' and openid = 'BBB'
  ) then
    raise exception 'persisted WeChat provider identities are incomplete';
  end if;

  if (select count(*) from public.wechat_identities where unionid = 'U123') <> 1 then
    raise exception 'canonical UnionID must be stored exactly once';
  end if;
end
$$;

-- Direct identity reads and trusted linking are impossible from browser roles.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', false);

do $$
declare
  blocked boolean := false;
begin
  begin
    perform openid from public.wechat_identities limit 1;
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'authenticated identity table read unexpectedly succeeded'; end if;
end
$$;

do $$
declare
  blocked boolean := false;
begin
  begin
    perform public.upsert_verified_wechat_account(
      '00000000-0000-0000-0000-000000000003', 'browser-app', 'browser-openid', null, null, null
    );
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'authenticated trusted WeChat upsert unexpectedly succeeded'; end if;
end
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);

insert into public.tournaments (
  id,
  name,
  slug,
  description,
  rules,
  status,
  visibility,
  registration_type,
  registration_start_at,
  registration_end_at,
  player_limit,
  invite_code,
  start_at,
  end_at,
  format,
  default_best_of,
  created_by,
  timezone
) values (
  '10000000-0000-0000-0000-000000000001',
  'Private Integration Cup',
  'private-integration-cup',
  'Private behavior fixture',
  'Integration rules',
  'REGISTRATION',
  'PRIVATE',
  'SOLO',
  now() - interval '1 day',
  now() + interval '1 day',
  16,
  'secret-code',
  now() + interval '2 days',
  now() + interval '3 days',
  'GROUP',
  1,
  (select id from public.accounts where auth_user_id = '00000000-0000-0000-0000-000000000004'),
  'Asia/Shanghai'
), (
  '10000000-0000-0000-0000-000000000002',
  'Public Integration Cup',
  'public-integration-cup',
  'Public behavior fixture',
  'Integration rules',
  'REGISTRATION',
  'PUBLIC',
  'SOLO',
  now() - interval '1 day',
  now() + interval '1 day',
  16,
  null,
  now() + interval '2 days',
  now() + interval '3 days',
  'GROUP',
  1,
  (select id from public.accounts where auth_user_id = '00000000-0000-0000-0000-000000000004'),
  'Asia/Shanghai'
);

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

insert into integration_calls (label, payload)
select 'registration-response', public.register_for_tournament(
  '10000000-0000-0000-0000-000000000001',
  'PlayerOne',
  'JP1',
  'Emerald IV',
  'MID',
  'SUPPORT',
  'Rift Friends',
  'Ready',
  'secret-code'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  response jsonb;
begin
  select payload into response from integration_calls where label = 'registration-response';
  if response ? 'account_id'
    or response ? 'reviewed_by_account_id'
    or response ? 'game_name_normalized'
    or response ? 'game_tag_normalized'
    or response ? 'created_by'
  then
    raise exception 'registration response exposed an internal identifier or normalized field';
  end if;
end
$$;

-- Approve through the authenticated admin path so reviewer metadata and audit
-- triggers are exercised under the same role used by production.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', false);

update public.tournament_registrations
set status = 'APPROVED', review_note = 'Approved in integration test'
where id = ((select payload ->> 'id' from integration_calls where label = 'registration-response'))::uuid;

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- Anonymous and authenticated nonparticipants get counts but no private roster.
set role anon;
insert into integration_calls (label, payload)
select 'private-anon', public.get_tournament_details('private-integration-cup');
insert into integration_calls (label, payload)
select 'public-anon', public.get_tournament_details('public-integration-cup');

do $$
declare
  blocked boolean := false;
begin
  begin
    perform created_by from public.tournaments limit 1;
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'anonymous creator account ID read unexpectedly succeeded'; end if;
end
$$;

reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', false);
insert into integration_calls (label, payload)
select 'private-nonparticipant', public.get_tournament_details('private-integration-cup');

do $$
begin
  if (select count(*) from public.tournament_registrations) <> 0 then
    raise exception 'authenticated nonparticipant read private registration rows';
  end if;
end
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
insert into integration_calls (label, payload)
select 'private-participant', public.get_tournament_details('private-integration-cup');

do $$
begin
  if (select count(*) from public.tournament_registrations) <> 1 then
    raise exception 'registered participant lost access to their own registration';
  end if;
end
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', false);
insert into integration_calls (label, payload)
select 'private-admin', public.get_tournament_details('private-integration-cup');

insert into integration_calls (label, payload)
select 'admin-review-metadata', public.get_admin_registration_review_metadata(
  ((select payload ->> 'id' from integration_calls where label = 'registration-response'))::uuid
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  anon_private jsonb;
  public_preview jsonb;
  nonparticipant jsonb;
  participant jsonb;
  admin_detail jsonb;
  review_metadata jsonb;
  admin_account uuid;
begin
  select payload into anon_private from integration_calls where label = 'private-anon';
  select payload into public_preview from integration_calls where label = 'public-anon';
  select payload into nonparticipant from integration_calls where label = 'private-nonparticipant';
  select payload into participant from integration_calls where label = 'private-participant';
  select payload into admin_detail from integration_calls where label = 'private-admin';
  select payload into review_metadata from integration_calls where label = 'admin-review-metadata';
  select id into admin_account from public.accounts where auth_user_id = '00000000-0000-0000-0000-000000000004';

  if not (anon_private ->> 'participants_restricted')::boolean
    or jsonb_array_length(anon_private -> 'participants') <> 0
    or (anon_private ->> 'approved_count')::integer <> 1
  then
    raise exception 'anonymous private tournament response is incorrect';
  end if;

  if not (nonparticipant ->> 'participants_restricted')::boolean
    or jsonb_array_length(nonparticipant -> 'participants') <> 0
    or (nonparticipant ->> 'approved_count')::integer <> 1
  then
    raise exception 'authenticated nonparticipant saw private participant data';
  end if;

  if (participant ->> 'participants_restricted')::boolean
    or jsonb_array_length(participant -> 'participants') <> 1
  then
    raise exception 'registered participant cannot see private participant data';
  end if;

  if (admin_detail ->> 'participants_restricted')::boolean
    or jsonb_array_length(admin_detail -> 'participants') <> 1
  then
    raise exception 'admin cannot see private participant data';
  end if;

  if (public_preview ->> 'participants_restricted')::boolean then
    raise exception 'public tournament preview was unexpectedly restricted';
  end if;

  if anon_private ? 'created_by'
    or nonparticipant ? 'created_by'
    or participant ? 'created_by'
    or admin_detail ? 'created_by'
    or public_preview ? 'created_by'
  then
    raise exception 'tournament detail response exposed created_by';
  end if;

  if (review_metadata ->> 'reviewed_by_account_id')::uuid is distinct from admin_account then
    raise exception 'admin review metadata did not preserve reviewer identity';
  end if;
end
$$;

-- The admin-only RPC enforces role membership, and the underlying reviewer UUID
-- column remains unavailable even to authenticated table clients.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', false);

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.get_admin_registration_review_metadata(
      ((select payload ->> 'id' from integration_calls where label = 'registration-response'))::uuid
    );
  exception when others then
    if sqlerrm <> 'ADMIN_REQUIRED' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'nonadmin read admin review metadata'; end if;
end
$$;

do $$
declare
  blocked boolean := false;
begin
  begin
    perform reviewed_by_account_id from public.tournament_registrations limit 1;
  exception when insufficient_privilege then
    blocked := true;
  end;
  if not blocked then raise exception 'reviewer UUID column was directly readable'; end if;
end
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
insert into integration_calls (label, payload)
select 'own-review-history', public.get_my_registration_review_history(
  ((select payload ->> 'id' from integration_calls where label = 'registration-response'))::uuid
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  history jsonb;
begin
  select payload into history from integration_calls where label = 'own-review-history';
  if jsonb_array_length(history) <> 1
    or history -> 0 ? 'actor_account_id'
    or history -> 0 ? 'reviewed_by_account_id'
  then
    raise exception 'safe own-review history response is incorrect';
  end if;
end
$$;

select 'integration behavior verification passed' as result;
