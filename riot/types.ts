/**
 * Response types for the Riot account-v1 and VALORANT APIs.
 * Transcribed from the official API reference (https://developer.riotgames.com/apis).
 * Optional fields are optional in Riot's reference; comments repeat Riot's notes.
 */

// ---------------------------------------------------------------- account-v1

export interface AccountDto {
  /** Encrypted PUUID. Exact length of 78 characters. */
  puuid: string;
  /** May be excluded if the account has no gameName. */
  gameName?: string;
  /** May be excluded if the account has no tagLine. */
  tagLine?: string;
}

export interface ActiveShardDto {
  puuid: string;
  game: string;
  /** One of ap, br, eu, kr, latam, na for VALORANT. */
  activeShard: string;
}

// ------------------------------------------------------------ val-content-v1

export type LocalizedNamesDto = Record<string, string>;

export interface ContentItemDto {
  name: string;
  /** Excluded from the response when a locale is set. */
  localizedNames?: LocalizedNamesDto;
  id: string;
  assetName: string;
  /** Only included for maps and game modes. These values are used in the match response. */
  assetPath?: string;
}

export interface ActDto {
  name: string;
  localizedNames?: LocalizedNamesDto;
  id: string;
  isActive: boolean;
  parentId?: string;
  /** "episode" or "act". */
  type?: string;
}

export interface ContentDto {
  version: string;
  characters: ContentItemDto[];
  maps: ContentItemDto[];
  chromas: ContentItemDto[];
  skins: ContentItemDto[];
  skinLevels: ContentItemDto[];
  equips: ContentItemDto[];
  gameModes: ContentItemDto[];
  sprays: ContentItemDto[];
  sprayLevels: ContentItemDto[];
  charms: ContentItemDto[];
  charmLevels: ContentItemDto[];
  playerCards: ContentItemDto[];
  playerTitles: ContentItemDto[];
  acts: ActDto[];
  ceremonies?: ContentItemDto[];
  totems?: ContentItemDto[];
}

// ------------------------------------------------------------- val-status-v1

export interface StatusContentDto {
  locale: string;
  content: string;
}

export interface StatusUpdateDto {
  id: number;
  author: string;
  publish: boolean;
  /** Legal values: riotclient, riotstatus, game. */
  publish_locations: string[];
  translations: StatusContentDto[];
  created_at: string;
  updated_at: string;
}

export interface StatusDto {
  id: number;
  /** Legal values: scheduled, in_progress, complete. */
  maintenance_status: string;
  /** Legal values: info, warning, critical. */
  incident_severity: string;
  titles: StatusContentDto[];
  updates: StatusUpdateDto[];
  created_at: string;
  archive_at: string;
  updated_at: string;
  /** Legal values: windows, macos, android, ios, ps4, xbone, switch. */
  platforms: string[];
}

export interface PlatformDataDto {
  id: string;
  name: string;
  locales: string[];
  maintenances: StatusDto[];
  incidents: StatusDto[];
}

// ------------------------------------------------------------- val-ranked-v1

export interface LeaderboardPlayerDto {
  /** Omitted if the player has been anonymized. */
  puuid?: string;
  gameName?: string;
  tagLine?: string;
  leaderboardRank: number;
  rankedRating: number;
  numberOfWins: number;
  competitiveTier?: number;
  prefix?: string;
  premierRosterType: string;
}

export interface TierDetailDto {
  rankedRatingThreshold: number;
  startingPage: number;
  startingIndex: number;
}

export interface LeaderboardDto {
  shard: string;
  /** Act ids come from val-content-v1. */
  actId: string;
  totalPlayers: number;
  players: LeaderboardPlayerDto[];
  immortalStartingPage?: number;
  immortalStartingIndex?: number;
  topTierRRThreshold?: number;
  tierDetails?: Record<string, TierDetailDto>;
  startIndex?: number;
  query?: string;
}

// -------------------------------------------------------------- val-match-v1

export interface MatchlistEntryDto {
  matchId: string;
  gameStartTimeMillis: number;
  queueId: string;
}

export interface MatchlistDto {
  puuid: string;
  history: MatchlistEntryDto[];
}

export interface RecentMatchesDto {
  currentTime: number;
  matchIds: string[];
}

export interface MatchInfoDto {
  matchId: string;
  mapId: string;
  gameVersion: string;
  gameLengthMillis?: number;
  region: string;
  gameStartMillis: number;
  provisioningFlowId: string;
  isCompleted: boolean;
  customGameName: string;
  queueId: string;
  gameMode: string;
  isRanked: boolean;
  seasonId: string;
  premierMatchInfo: Record<string, unknown>;
}

export interface AbilityCastsDto {
  grenadeCasts: number;
  ability1Casts: number;
  ability2Casts: number;
  ultimateCasts: number;
}

export interface PlayerStatsDto {
  score: number;
  roundsPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  playtimeMillis: number;
  abilityCasts?: AbilityCastsDto;
}

export interface MatchPlayerDto {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  partyId: string;
  characterId?: string;
  stats?: PlayerStatsDto;
  competitiveTier: number;
  isObserver: boolean;
  playerCard: string;
  playerTitle: string;
  accountLevel: number;
}

export interface CoachDto {
  puuid: string;
  teamId: string;
}

export interface TeamDto {
  /** Arbitrary string. Red and Blue in bomb modes. The puuid of the player in deathmatch. */
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
  /** Team points scored. Number of kills in deathmatch. */
  numPoints: number;
}

export interface LocationDto {
  x: number;
  y: number;
}

export interface PlayerLocationsDto {
  puuid: string;
  viewRadians: number;
  location: LocationDto;
}

export interface FinishingDamageDto {
  damageType: string;
  damageItem: string;
  isSecondaryFireMode: boolean;
}

export interface KillDto {
  timeSinceGameStartMillis: number;
  timeSinceRoundStartMillis: number;
  /** PUUID */
  killer: string;
  /** PUUID */
  victim: string;
  victimLocation: LocationDto;
  /** PUUIDs */
  assistants: string[];
  playerLocations: PlayerLocationsDto[];
  finishingDamage: FinishingDamageDto;
}

export interface DamageDto {
  /** PUUID */
  receiver: string;
  damage: number;
  legshots: number;
  bodyshots: number;
  headshots: number;
}

export interface EconomyDto {
  loadoutValue: number;
  weapon: string;
  armor: string;
  remaining: number;
  spent: number;
}

export interface AbilityDto {
  grenadeEffects?: string;
  ability1Effects?: string;
  ability2Effects?: string;
  ultimateEffects?: string;
}

export interface PlayerRoundStatsDto {
  puuid: string;
  kills: KillDto[];
  damage: DamageDto[];
  score: number;
  economy: EconomyDto;
  ability: AbilityDto;
}

export interface RoundResultDto {
  roundNum: number;
  roundResult: string;
  roundCeremony: string;
  winningTeam: string;
  winningTeamRole: string;
  /** PUUID */
  bombPlanter?: string;
  /** PUUID */
  bombDefuser?: string;
  plantRoundTime: number;
  plantPlayerLocations?: PlayerLocationsDto[];
  plantLocation: LocationDto;
  plantSite: string;
  defuseRoundTime: number;
  defusePlayerLocations?: PlayerLocationsDto[];
  defuseLocation: LocationDto;
  playerStats: PlayerRoundStatsDto[];
  roundResultCode: string;
}

export interface MatchDto {
  matchInfo: MatchInfoDto;
  players: MatchPlayerDto[];
  coaches: CoachDto[];
  teams?: TeamDto[];
  roundResults?: RoundResultDto[];
}
