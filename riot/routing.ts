/**
 * Riot API routing values.
 * Source: https://developer.riotgames.com/docs/valorant (Regional and platform routing).
 */

/** Regional routing values, used by account-v1. */
export const REGIONAL_ROUTES = ["americas", "asia", "europe"] as const;
export type RegionalRoute = (typeof REGIONAL_ROUTES)[number];

/** Platform (shard) routing values, used by the VALORANT APIs. */
export const PLATFORM_ROUTES = ["ap", "br", "eu", "kr", "latam", "na", "esports"] as const;
export type PlatformRoute = (typeof PLATFORM_ROUTES)[number];

/** Shards a player account can be active on. Returned by account-v1 active-shards for game "val". */
export type ValShard = Exclude<PlatformRoute, "esports">;

export type Route = RegionalRoute | PlatformRoute;

export function isRegionalRoute(value: string): value is RegionalRoute {
  return (REGIONAL_ROUTES as readonly string[]).includes(value);
}

export function isPlatformRoute(value: string): value is PlatformRoute {
  return (PLATFORM_ROUTES as readonly string[]).includes(value);
}

/** Nearest regional route for a VALORANT shard, for account-v1 lookups. */
export function regionalRouteForShard(shard: ValShard): RegionalRoute {
  switch (shard) {
    case "na":
    case "br":
    case "latam":
      return "americas";
    case "eu":
      return "europe";
    case "ap":
    case "kr":
      return "asia";
  }
}

export function hostFor(route: Route): string {
  return `https://${route}.api.riotgames.com`;
}
