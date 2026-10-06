/**
 * Typed wrappers for the Riot endpoints Valtrices cares about.
 * Paths and routing per https://developer.riotgames.com/apis.
 */
import type { RiotClient, RiotResponse } from "./client.ts";
import type { PlatformRoute, RegionalRoute } from "./routing.ts";
import type {
  AccountDto,
  ActiveShardDto,
  ContentDto,
  LeaderboardDto,
  MatchDto,
  MatchlistDto,
  PlatformDataDto,
  RecentMatchesDto,
} from "./types.ts";

export interface RiotId {
  gameName: string;
  tagLine: string;
}

/** Parses "GameName#TagLine". The tag is everything after the last '#'. */
export function parseRiotId(input: string): RiotId {
  const idx = input.lastIndexOf("#");
  if (idx <= 0 || idx === input.length - 1) {
    throw new Error(`Invalid Riot ID "${input}". Expected the form GameName#TagLine.`);
  }
  return { gameName: input.slice(0, idx).trim(), tagLine: input.slice(idx + 1).trim() };
}

/** Queue ids accepted by val-match-v1 recent-matches, per the API reference. */
export const VAL_QUEUES = [
  "competitive",
  "unrated",
  "spikerush",
  "tournamentmode",
  "deathmatch",
  "onefa",
  "ggteam",
  "hurm",
  "swiftplay",
] as const;
export type ValQueue = (typeof VAL_QUEUES)[number];

// ---------------------------------------------------------------- account-v1
// Regional routing: americas, asia, europe.

export function accountByRiotId(
  client: RiotClient,
  region: RegionalRoute,
  id: RiotId,
): Promise<RiotResponse<AccountDto>> {
  const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(id.gameName)}/${encodeURIComponent(id.tagLine)}`;
  return client.get<AccountDto>(region, path);
}

export function accountByPuuid(
  client: RiotClient,
  region: RegionalRoute,
  puuid: string,
): Promise<RiotResponse<AccountDto>> {
  return client.get<AccountDto>(region, `/riot/account/v1/accounts/by-puuid/${puuid}`);
}

/** Which VALORANT shard the account is active on. */
export function activeValShard(
  client: RiotClient,
  region: RegionalRoute,
  puuid: string,
): Promise<RiotResponse<ActiveShardDto>> {
  return client.get<ActiveShardDto>(
    region,
    `/riot/account/v1/active-shards/by-game/val/by-puuid/${puuid}`,
  );
}

// ---------------------------------------------------- VALORANT, platform routing

export function valContent(
  client: RiotClient,
  shard: PlatformRoute,
  locale?: string,
): Promise<RiotResponse<ContentDto>> {
  return client.get<ContentDto>(shard, "/val/content/v1/contents", { locale });
}

export function valPlatformStatus(
  client: RiotClient,
  shard: PlatformRoute,
): Promise<RiotResponse<PlatformDataDto>> {
  return client.get<PlatformDataDto>(shard, "/val/status/v1/platform-data");
}

export function valLeaderboard(
  client: RiotClient,
  shard: PlatformRoute,
  actId: string,
  options: { size?: number; startIndex?: number } = {},
): Promise<RiotResponse<LeaderboardDto>> {
  return client.get<LeaderboardDto>(shard, `/val/ranked/v1/leaderboards/by-act/${actId}`, {
    size: options.size,
    startIndex: options.startIndex,
  });
}

export function valMatchlist(
  client: RiotClient,
  shard: PlatformRoute,
  puuid: string,
): Promise<RiotResponse<MatchlistDto>> {
  return client.get<MatchlistDto>(shard, `/val/match/v1/matchlists/by-puuid/${puuid}`);
}

export function valMatch(
  client: RiotClient,
  shard: PlatformRoute,
  matchId: string,
): Promise<RiotResponse<MatchDto>> {
  return client.get<MatchDto>(shard, `/val/match/v1/matches/${matchId}`);
}

export function valRecentMatches(
  client: RiotClient,
  shard: PlatformRoute,
  queue: ValQueue,
): Promise<RiotResponse<RecentMatchesDto>> {
  return client.get<RecentMatchesDto>(shard, `/val/match/v1/recent-matches/by-queue/${queue}`);
}
