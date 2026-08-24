import { featuredTournament, tournaments as developmentTournaments } from '@/lib/sample-data';
import { canUseDevelopmentFallback } from '@/lib/runtime-mode';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapTournament, mapTournamentDetail } from '@/lib/tournaments/mapper';
import type { Tournament, TournamentDetail } from '@/types';

export async function listTournaments(): Promise<{ tournaments: Tournament[]; isFallback: boolean; configurationMissing: boolean }> {
  if (!isSupabaseConfigured()) {
    return canUseDevelopmentFallback()
      ? { tournaments: developmentTournaments, isFallback: true, configurationMissing: false }
      : { tournaments: [], isFallback: false, configurationMissing: true };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .neq('status', 'DRAFT')
    .eq('visibility', 'PUBLIC')
    .order('start_at', { ascending: true });

  if (error) throw new Error(`TOURNAMENT_LIST_FAILED:${error.message}`);
  return { tournaments: (data ?? []).map((row) => mapTournament(row)), isFallback: false, configurationMissing: false };
}

export async function getTournamentDetail(slug: string): Promise<{ tournament: TournamentDetail | null; isFallback: boolean; configurationMissing: boolean }> {
  if (!isSupabaseConfigured()) {
    if (!canUseDevelopmentFallback()) return { tournament: null, isFallback: false, configurationMissing: true };
    const match = developmentTournaments.find((item) => item.slug === slug);
    return {
      tournament: match ? { ...match, approvedCount: 0, pendingCount: 0, waitlistedCount: 0, participants: [], participantsRestricted: false } : null,
      isFallback: true,
      configurationMissing: false,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('get_tournament_details', { p_slug: slug });
  if (error) throw new Error(`TOURNAMENT_DETAIL_FAILED:${error.message}`);
  return { tournament: data ? mapTournamentDetail(data as Record<string, unknown>) : null, isFallback: false, configurationMissing: false };
}

export async function getFeaturedTournament(): Promise<{ tournament: TournamentDetail | null; isFallback: boolean; configurationMissing: boolean }> {
  const configuredSlug = process.env.NEXT_PUBLIC_FEATURED_TOURNAMENT_SLUG?.trim();
  if (configuredSlug) {
    const result = await getTournamentDetail(configuredSlug);
    if (result.tournament || result.configurationMissing) return result;
  }

  if (!isSupabaseConfigured()) {
    return canUseDevelopmentFallback()
      ? { tournament: { ...featuredTournament, approvedCount: 0, pendingCount: 0, waitlistedCount: 0, participants: [], participantsRestricted: false }, isFallback: true, configurationMissing: false }
      : { tournament: null, isFallback: false, configurationMissing: true };
  }

  const listed = await listTournaments();
  const preferred = listed.tournaments.find((item) => item.status === 'REGISTRATION') ?? listed.tournaments[0];
  if (!preferred) return { tournament: null, isFallback: false, configurationMissing: false };

  const detail = await getTournamentDetail(preferred.slug);
  return detail.tournament
    ? detail
    : { tournament: { ...preferred, approvedCount: 0, pendingCount: 0, waitlistedCount: 0, participants: [], participantsRestricted: false }, isFallback: false, configurationMissing: false };
}
