/**
 * Riot API probe: makes a small set of read-only requests with the development key
 * from .env, prints what each endpoint returned, and writes raw responses to the
 * git-ignored riot-probe-output/ folder for inspection.
 *
 * Usage: pnpm riot:probe [--riot-id "Name#Tag"] [--region europe] [--shard eu]
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { RiotApiError, RiotClient, type RateLimitSnapshot } from "../riot/client.ts";
import {
  accountByRiotId,
  activeValShard,
  parseRiotId,
  valContent,
  valLeaderboard,
  valMatch,
  valMatchlist,
  valPlatformStatus,
  valRecentMatches,
} from "../riot/endpoints.ts";
import {
  isPlatformRoute,
  isRegionalRoute,
  type RegionalRoute,
  type ValShard,
} from "../riot/routing.ts";
import type { MatchDto } from "../riot/types.ts";

interface StepResult {
  step: string;
  endpoint: string;
  route: string;
  status: number | "skipped";
  latencyMs: number | null;
  rateLimit: RateLimitSnapshot | null;
  note: string;
}

interface CallResult<T> {
  data: T;
  status: number;
  latencyMs: number;
  rateLimit: RateLimitSnapshot;
}

const results: StepResult[] = [];
const outDir = join("riot-probe-output", new Date().toISOString().replace(/[:.]/g, "-"));

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function save(name: string, data: unknown): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(data, null, 2));
}

async function run<T>(
  step: string,
  endpoint: string,
  route: string,
  call: () => Promise<CallResult<T>>,
  summarize: (data: T) => string,
): Promise<T | null> {
  try {
    const res = await call();
    save(step, res.data);
    const note = summarize(res.data);
    results.push({
      step,
      endpoint,
      route,
      status: res.status,
      latencyMs: res.latencyMs,
      rateLimit: res.rateLimit,
      note,
    });
    console.log(`  OK   ${res.status}  ${res.latencyMs} ms  ${step}: ${note}`);
    return res.data;
  } catch (err) {
    if (err instanceof RiotApiError) {
      const note = err.riotMessage ?? "(no message)";
      results.push({
        step,
        endpoint,
        route,
        status: err.status,
        latencyMs: err.latencyMs,
        rateLimit: err.rateLimit,
        note,
      });
      console.log(`  FAIL ${err.status}  ${err.latencyMs} ms  ${step}: ${note}`);
    } else {
      const note = err instanceof Error ? err.message : String(err);
      results.push({ step, endpoint, route, status: 0, latencyMs: null, rateLimit: null, note });
      console.log(`  ERR  ---  ${step}: ${note}`);
    }
    return null;
  }
}

function skip(step: string, endpoint: string, route: string, why: string): void {
  results.push({
    step,
    endpoint,
    route,
    status: "skipped",
    latencyMs: null,
    rateLimit: null,
    note: why,
  });
  console.log(`  SKIP      ${step}: ${why}`);
}

const short = (puuid: string) => `${puuid.slice(0, 8)}...`;

function defaultShardFor(region: RegionalRoute): ValShard {
  if (region === "americas") return "na";
  if (region === "asia") return "ap";
  return "eu";
}

function asValShard(value: string | undefined): ValShard | null {
  return value && isPlatformRoute(value) && value !== "esports" ? value : null;
}

async function main(): Promise<void> {
  if (existsSync(".env")) process.loadEnvFile(".env");

  const { values: args } = parseArgs({
    options: {
      "riot-id": { type: "string" },
      region: { type: "string" },
      shard: { type: "string" },
    },
  });

  const apiKey = process.env.RIOT_API_KEY ?? "";
  if (!apiKey) fail("RIOT_API_KEY is not set. Add it to .env (see .env.example).");
  if (!apiKey.startsWith("RGAPI-")) {
    console.warn("  warning: Riot keys normally start with RGAPI-; double-check the value.");
  }

  const riotIdRaw = args["riot-id"] ?? process.env.RIOT_ID ?? "";
  if (!riotIdRaw) fail('No Riot ID. Pass --riot-id "Name#Tag" or set RIOT_ID in .env.');
  const riotId = parseRiotId(riotIdRaw);

  const region = args.region ?? process.env.RIOT_REGION ?? "europe";
  if (!isRegionalRoute(region)) {
    fail(`RIOT_REGION must be americas, asia or europe (got "${region}").`);
  }

  const client = new RiotClient({ apiKey });
  console.log(`\nRiot API probe  region=${region}  riotId=${riotId.gameName}#${riotId.tagLine}\n`);

  // 1. account-v1: Riot ID -> PUUID
  const account = await run(
    "01-account-by-riot-id",
    "/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}",
    region,
    () => accountByRiotId(client, region, riotId),
    (a) => `puuid=${short(a.puuid)} gameName=${a.gameName ?? "?"} tagLine=${a.tagLine ?? "?"}`,
  );
  const puuid = account?.puuid ?? null;

  // 2. account-v1: active VALORANT shard
  let shardFromAccount: ValShard | null = null;
  if (puuid) {
    const active = await run(
      "02-active-shard",
      "/riot/account/v1/active-shards/by-game/val/by-puuid/{puuid}",
      region,
      () => activeValShard(client, region, puuid),
      (s) => `activeShard=${s.activeShard}`,
    );
    shardFromAccount = asValShard(active?.activeShard);
  } else {
    skip(
      "02-active-shard",
      "/riot/account/v1/active-shards/by-game/val/by-puuid/{puuid}",
      region,
      "no PUUID",
    );
  }
  const shard: ValShard = shardFromAccount ?? asValShard(args.shard) ?? defaultShardFor(region);
  if (!shardFromAccount) {
    console.log(`  info  no active shard from Riot, using ${shard} (override with --shard)`);
  }
  console.log(`  info  VALORANT platform route: ${shard}\n`);

  // 3. val-status-v1
  await run(
    "03-platform-status",
    "/val/status/v1/platform-data",
    shard,
    () => valPlatformStatus(client, shard),
    (s) => `name=${s.name} maintenances=${s.maintenances.length} incidents=${s.incidents.length}`,
  );

  // 4. val-content-v1
  const content = await run(
    "04-content",
    "/val/content/v1/contents?locale=en-US",
    shard,
    () => valContent(client, shard, "en-US"),
    (c) => {
      const act = c.acts.find((a) => a.isActive && a.type === "act");
      return `version=${c.version} characters=${c.characters.length} maps=${c.maps.length} acts=${c.acts.length} activeAct=${act?.name ?? "?"}`;
    },
  );
  const activeActId = content?.acts.find((a) => a.isActive && a.type === "act")?.id ?? null;

  // 5. val-ranked-v1
  if (activeActId) {
    await run(
      "05-leaderboard",
      "/val/ranked/v1/leaderboards/by-act/{actId}?size=10",
      shard,
      () => valLeaderboard(client, shard, activeActId, { size: 10, startIndex: 0 }),
      (l) =>
        `totalPlayers=${l.totalPlayers} returned=${l.players.length} top=${l.players[0]?.gameName ?? "anon"}`,
    );
  } else {
    skip(
      "05-leaderboard",
      "/val/ranked/v1/leaderboards/by-act/{actId}",
      shard,
      "no active act id from content",
    );
  }

  // 6. val-match-v1 matchlist
  let matchIdForDetails: string | null = null;
  if (puuid) {
    const list = await run(
      "06-matchlist",
      "/val/match/v1/matchlists/by-puuid/{puuid}",
      shard,
      () => valMatchlist(client, shard, puuid),
      (m) => {
        const byQueue = new Map<string, number>();
        for (const h of m.history) byQueue.set(h.queueId, (byQueue.get(h.queueId) ?? 0) + 1);
        const queues = [...byQueue].map(([q, n]) => `${q}:${n}`).join(",") || "none";
        return `matches=${m.history.length} queues=${queues}`;
      },
    );
    matchIdForDetails =
      list?.history.find((h) => h.queueId === "competitive")?.matchId ??
      list?.history[0]?.matchId ??
      null;
  } else {
    skip("06-matchlist", "/val/match/v1/matchlists/by-puuid/{puuid}", shard, "no PUUID");
  }

  // 7. val-match-v1 match details
  const matchId = matchIdForDetails;
  if (matchId) {
    await run(
      "07-match",
      "/val/match/v1/matches/{matchId}",
      shard,
      () => valMatch(client, shard, matchId),
      (m: MatchDto) => {
        const rounds = m.roundResults ?? [];
        const firstRoundPlayer = rounds[0]?.playerStats[0];
        const map = m.matchInfo.mapId.split("/").pop() ?? m.matchInfo.mapId;
        return `map=${map} queue=${m.matchInfo.queueId} players=${m.players.length} teams=${m.teams?.length ?? 0} rounds=${rounds.length} round0.kills=${firstRoundPlayer?.kills.length ?? "?"} round0.damage=${firstRoundPlayer?.damage.length ?? "?"}`;
      },
    );
  } else {
    skip("07-match", "/val/match/v1/matches/{matchId}", shard, "no match id from matchlist");
  }

  // 8. val-match-v1 recent matches
  await run(
    "08-recent-competitive",
    "/val/match/v1/recent-matches/by-queue/competitive",
    shard,
    () => valRecentMatches(client, shard, "competitive"),
    (r) => `matchIds=${r.matchIds.length}`,
  );

  save("summary", results);
  console.log(`\nRaw responses and summary written to ${outDir}\n`);
  console.log("step                      status   latency   app-rate-limit        note");
  for (const r of results) {
    const lat = r.latencyMs === null ? "-" : `${r.latencyMs}ms`;
    const rl = r.rateLimit
      ? `${r.rateLimit.appCount ?? "?"} / ${r.rateLimit.appLimit ?? "?"}`
      : "-";
    console.log(
      `${r.step.padEnd(25)} ${String(r.status).padEnd(8)} ${lat.padEnd(9)} ${rl.padEnd(21)} ${r.note}`,
    );
  }
}

main().catch((err: unknown) =>
  fail(err instanceof Error ? (err.stack ?? err.message) : String(err)),
);
