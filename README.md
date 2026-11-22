# Mochi Tennis Club

A small tennis game with toy poodles. Play against the computer or against a friend.

**Play it here: https://mochi-tennis-club.taymcquaya.workers.dev**

A game by [taymcquaya](https://x.com/TayMcQuaya).

## How to play with a friend

If you are inviting:

1. Open the game and press "Play with friends".
2. The first time, press "Start a club".
3. Press "Copy invite link" and send the link to your friend.
4. Press "Open a court" and pick a stage.

If you got a link:

1. Open the link.
2. Press "Play with friends".
3. Press "Join" on the court that shows up.

Only people who opened the same invite link see each other's courts. Nobody needs an account. The browser remembers the club, so next time the plain address is enough.

## What is in here

- `public/index.html` is the whole game in one file.
- `public/manifest.webmanifest` and the `icon-*.png` files let phones add the game to the home screen.
- `src/worker.js` is the small server that connects players. It runs on Cloudflare.
- `wrangler.jsonc` tells Cloudflare how to run it.
- `SETUP.md` explains how all of this was set up and how to change it.

## Run it on your own computer

```
npm install
npm run dev
```

Then open the address it prints.

## Put it online

The repo is connected to Cloudflare. Every push to `main` goes live on its own, usually within a minute.
