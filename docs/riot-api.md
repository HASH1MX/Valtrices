# Riot Games API: foundation notes

Status: client layer and probe script written; live findings pending the first run with a
development key. Source of truth is Riot's official developer portal, linked at the end.

## 1. Keys and what they can access

| Key type    | How to get it                               | VALORANT access per Riot                                                           |
| ----------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Development | Portal dashboard, regenerate every 24 hours | Riot states personal and development keys "do not have access to the VALORANT API" |
| Personal    | Application on the portal                   | Not offered for VALORANT; applications requesting VALORANT are not approved        |
| Production  | Product pitch, verified website, review     | Required for `val-match-v1`; the only path to match history and match details      |

Riot also requires every VALORANT product to let players opt in through Riot Sign On (RSO)
before showing their data. RSO itself is only available to production keys.

The probe below records what a development key can actually reach today. Expectation going
in: `account-v1` works, `val-content-v1` and `val-status-v1` may work because they carry no
player data, and `val-match-v1` returns 403.

## 2. Security model in this repo

- The key lives only in the git-ignored `.env` as `RIOT_API_KEY`. It has no `VITE_` prefix,
  so Vite can never bundle it into the desktop app.
- `riot/` is a runtime-neutral client (fetch only, no Node or browser specifics). Today it is
  driven by `scripts/riot-probe.ts` on Node. In the product it must run server-side, since a
  Riot key embedded in a shipped binary can be extracted and would violate Riot's terms.
- The key is sent in the `X-Riot-Token` header, never in a URL, and the client never logs it.
- Probe output goes to `riot-probe-output/`, which is git-ignored because raw responses
  contain player identifiers.

## 3. Routing

| Routing type | Values                                | Used by                                                            |
| ------------ | ------------------------------------- | ------------------------------------------------------------------ |
| Regional     | `americas`, `asia`, `europe`          | `account-v1`                                                       |
| Platform     | `ap`, `br`, `eu`, `kr`, `latam`, `na` | `val-content-v1`, `val-status-v1`, `val-ranked-v1`, `val-match-v1` |

Host pattern: `https://{route}.api.riotgames.com`. The account endpoints work from any regional
route. `active-shards/by-game/val` tells you which platform route a player's data lives on.

## 4. Endpoints wired in `riot/endpoints.ts`

| Function            | Endpoint                                                           | Returns                                      |
| ------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `accountByRiotId`   | `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`    | `puuid`, `gameName`, `tagLine`               |
| `accountByPuuid`    | `GET /riot/account/v1/accounts/by-puuid/{puuid}`                   | same                                         |
| `activeValShard`    | `GET /riot/account/v1/active-shards/by-game/val/by-puuid/{puuid}`  | `activeShard`                                |
| `valPlatformStatus` | `GET /val/status/v1/platform-data`                                 | maintenances, incidents                      |
| `valContent`        | `GET /val/content/v1/contents?locale=`                             | agents, maps, modes, acts, cosmetics catalog |
| `valLeaderboard`    | `GET /val/ranked/v1/leaderboards/by-act/{actId}?size=&startIndex=` | ranked leaderboard for an act                |
| `valMatchlist`      | `GET /val/match/v1/matchlists/by-puuid/{puuid}`                    | match ids with start time and queue          |
| `valMatch`          | `GET /val/match/v1/matches/{matchId}`                              | full match: players, teams, rounds           |
| `valRecentMatches`  | `GET /val/match/v1/recent-matches/by-queue/{queue}`                | recent match ids for a queue, region-wide    |

Console variants (`val-console-match-v1`, `val-console-ranked-v1`) exist and are not wired.

## 5. What a match contains (from the official DTOs)

- **Match info**: map, game version, length, start time, queue, mode, ranked flag, season,
  completion flag, provisioning flow, premier info.
- **Per player**: PUUID, Riot ID, team, party, agent, competitive tier, account level, card,
  title, and totals: score, rounds played, kills, deaths, assists, playtime, ability casts.
- **Teams**: id, won, rounds played, rounds won, points.
- **Per round**: result, ceremony, winning team and role, planter, defuser, plant and defuse
  times, sites and locations, player positions at plant and defuse.
- **Per player per round**: score, economy (loadout value, weapon, armor, spent, remaining),
  ability effects, every kill with timestamps, killer, victim, assistants, victim location,
  all player positions at the kill, and finishing damage (type, item, secondary fire), plus
  damage dealt per receiver split into head, body and leg shots.

Not in the official API: per-round MMR or rank rating changes, peak rank, agent pick history
beyond individual matches, and any live or in-progress match data.

## 6. Rate limits and errors

Every response carries `X-App-Rate-Limit`, `X-App-Rate-Limit-Count`, `X-Method-Rate-Limit`
and `X-Method-Rate-Limit-Count`. A 429 adds `Retry-After` and `X-Rate-Limit-Type`. The client
honours `Retry-After` and retries 429, 502, 503 and 504 up to two times.

| Status | Meaning                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| 401    | Key missing or invalid. Observed: an invalid key returns 401 with message "Forbidden" and no rate-limit headers |
| 403    | Key expired, or the endpoint is not allowed for the key type                                                    |
| 404    | Resource not found (unknown Riot ID, PUUID or match id)                                                         |
| 429    | Rate limited                                                                                                    |

The development key's limits are reported in the headers and recorded by the probe.

## 7. Running the probe

```bash
pnpm riot:probe
```

Reads `RIOT_API_KEY`, `RIOT_ID` and `RIOT_REGION` from `.env`. Flags `--riot-id`, `--region`
and `--shard` override them. It calls the endpoints in section 4 in order, continues past
failures, prints a summary table, and writes raw JSON to `riot-probe-output/<timestamp>/`.

## 8. Findings

Pending the first run. To be filled with the probe's summary table: which endpoints returned
200 with a development key, which returned 403, observed rate-limit headers, and any
differences between the live responses and the transcribed types.

## Sources

- VALORANT docs on the developer portal: https://developer.riotgames.com/docs/valorant
- VALORANT API launch and policies: https://www.riotgames.com/en/DevRel/valorant-api-launch
- Portal docs (keys, rate limits, response codes): https://developer.riotgames.com/docs/portal
- API reference: https://developer.riotgames.com/apis
