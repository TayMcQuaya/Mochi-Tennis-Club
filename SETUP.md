# How Mochi Tennis Club is set up

Written on 22 November 2026, the day the game went online.

## The short version

- The code lives on GitHub: https://github.com/TayMcQuaya/Mochi-Tennis-Club
- The game runs on Cloudflare: https://mochi-tennis-club.taymcquaya.workers.dev
- Every push to the `main` branch on GitHub is built and put online by Cloudflare on its own.
- Everything is on free plans. No card is on file anywhere.

## The pieces

### 1. The game (`public/index.html`)

The whole game is one page: drawing, sound, controls, the computer player and the online logic. Cloudflare serves the files in `public/` as they are.

The same page also runs as an artifact inside Claude. There it uses Claude's own connection between players. On its own address it uses the server described below. The page finds out by itself where it is running.

### 2. The server (`src/worker.js`)

A small program that runs on Cloudflare. It does one thing: connect players.

- A browser connects to `/ws` with a club code and a player id.
- Every club code gets its own room (a Cloudflare "Durable Object" called `Room`).
- Each player sends a small bag of data: name, poodle, court, position, score. The room passes every change on to the other players in the same club.
- The room does not know the rules of tennis. All game logic stays in the page.
- Nothing is saved. When the last player leaves, the room is empty again.
- Limits: 12 players per club, 90 messages a second per player, small message sizes.

### 3. Clubs and invite links

- "Start a club" makes a random 10 character code and puts it in the address, like `?club=abc123...`.
- "Copy invite link" copies that address.
- Everyone who opens the link is in the same club and sees the same courts. Someone without the link ends up in no club, or in a different one, and sees nothing.
- The browser remembers the last club, so the plain address works afterwards.
- There are no accounts and no passwords. The club code is the only key, so only share the link with people you want in.

### 4. Home screen on phones

`public/manifest.webmanifest` and the icons let a phone add the game to its home screen. Opened from there it runs full screen.

## How Cloudflare was set up

Done once in the Cloudflare dashboard (dash.cloudflare.com):

1. Workers & Pages, Create application, import from GitHub.
2. Cloudflare's GitHub app was installed on the TayMcQuaya account with access to this one repository only.
3. Settings used:
   - Project name: `mochi-tennis-club` (must be the same as `name` in `wrangler.jsonc`, or the build fails)
   - Branch: `main`
   - Build command: none
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`
4. Cloudflare made an API token for itself called "mochi-tennis-club build token". Leave it alone, the builds need it.

`wrangler.jsonc` holds the rest: where the game files are (`public/`), where the server code is (`src/worker.js`) and that there is one kind of room (`Room`).

## Changing the game

1. Change the files and push to `main`.
2. Cloudflare builds and puts the new version online, usually within a minute.
3. Check the result under Workers & Pages, mochi-tennis-club, in the Cloudflare dashboard. A failed build shows its error there and the old version stays online.

To try changes on your own computer first: `npm install`, then `npm run dev`, then open the address it prints.

## What it costs

Nothing, on Cloudflare's free plan and GitHub's free plan.

The free plan has daily limits. The ones that matter here, as of November 2026:

- 100,000 requests a day to the server. Messages from players count 20 to 1, so that is about 2 million messages a day. Two players in a match send roughly 40 a second, which leaves room for many hours of play every day.
- If a limit is ever reached, the server stops answering until 00:00 UTC. There is no bill.

A cost can only appear if someone upgrades the Cloudflare plan or buys a domain name on purpose.

## If something goes wrong

- "Could not reach the club right now" in the game: the page could not connect to the server. Press "Try again". If it keeps happening for everyone, look at the Cloudflare dashboard for a failed build or a reached daily limit.
- A friend does not see your court: check that they opened your invite link, not the plain address, and that you pressed "Open a court".
- The build fails right after a change to `wrangler.jsonc`: check that `name` is still `mochi-tennis-club`.

## Not built yet

- Doubles.
- A custom address instead of `workers.dev`.
