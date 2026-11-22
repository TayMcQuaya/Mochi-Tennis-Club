# Mochi Tennis Club

A small tennis game with toy poodles. Play against the computer or against a friend.

A game by [taymcquaya](https://x.com/TayMcQuaya).

## What is in here

- `public/index.html` is the whole game in one file.
- `public/manifest.webmanifest` and the `icon-*.png` files let phones add the game to the home screen.
- `src/worker.js` is the small server that connects players. It runs on Cloudflare.
- `wrangler.jsonc` tells Cloudflare how to run it.

## How playing with friends works

- Press "Play with friends", then "Start a club". The page gets a club code in its address.
- "Copy invite link" gives you the link to send around. Everyone who opens it is in the same club.
- Only people in the same club see each other's courts. There are no accounts and nothing is saved on the server.
- The browser remembers the club, so opening the plain address later still lands in it.

## Run it on your own computer

```
npm install
npm run dev
```

Then open the address it prints.

## Put it online

The repo is connected to Cloudflare. Every push to `main` goes live on its own.
To do it by hand instead: `npm run deploy`.
