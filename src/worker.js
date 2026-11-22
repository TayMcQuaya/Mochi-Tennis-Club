// Mochi Tennis Club: the small server that connects players.
//
// The game page itself is served from /public. This file only handles /ws.
// Every club (the code in an invite link) gets its own room. A room keeps one
// small bag of data per player ("presence": name, court, position, score) and
// passes every change on to the others in the same club. It never looks inside
// the game data and it saves nothing to disk.

import { DurableObject } from 'cloudflare:workers';

const CLUB = /^[a-z0-9]{8,24}$/;      // club code from the invite link
const PEER = /^[a-z0-9]{8,16}$/;      // a player's id, made up by their browser
const MAX_PLAYERS = 12;               // per club
const MAX_MESSAGE = 4096;             // characters in one message
const MAX_PRESENCE = 8192;            // characters of one player's data
const MAX_KEYS = 24;
const MAX_PER_SECOND = 90;            // messages from one player

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/ws') return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const club = url.searchParams.get('club') || '', peer = url.searchParams.get('peer') || '';
    if (!CLUB.test(club) || !PEER.test(peer)) return new Response('Bad club or player id', { status: 400 });
    return env.ROOM.get(env.ROOM.idFromName(club)).fetch(request);
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.rate = new Map();            // socket -> [second, count]; fine to lose when the room goes to sleep
    // answer the page's keep-alive without waking the room up
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request) {
    const peer = new URL(request.url).searchParams.get('peer');
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {       // the same player coming back (a reconnect): the old line goes
      if (this.who(ws).id === peer) { this.drop(ws); try { ws.close(4001, 'replaced'); } catch (e) {} }
    }
    if (this.ctx.getWebSockets().filter(ws => this.who(ws).id !== peer).length >= MAX_PLAYERS) return new Response('Club is full', { status: 503 });

    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id: peer, p: {} });
    const peers = [];
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === server) continue;
      const a = this.who(ws); if (a.id && a.id !== peer && !a.gone) peers.push([a.id, a.p]);
    }
    server.send(JSON.stringify({ t: 'hi', id: peer, peers }));
    return new Response(null, { status: 101, webSocket: client });
  }

  who(ws) { return ws.deserializeAttachment() || { id: '', p: {} }; }

  send(from, text) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === from) continue;
      try { ws.send(text); } catch (e) {}
    }
  }

  drop(ws) {                          // tell the others once that this player left
    const a = this.who(ws); if (!a.id || a.gone) return;
    a.gone = true; try { ws.serializeAttachment(a); } catch (e) {}
    this.send(ws, JSON.stringify({ t: 'bye', id: a.id }));
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== 'string' || message.length > MAX_MESSAGE) return;
    const sec = Math.floor(Date.now() / 1000), r = this.rate.get(ws);
    if (r && r[0] === sec) { if (++r[1] > MAX_PER_SECOND) { try { ws.close(4008, 'too many messages'); } catch (e) {} return; } }
    else this.rate.set(ws, [sec, 1]);

    let msg; try { msg = JSON.parse(message); } catch (e) { return; }
    if (!msg || msg.t !== 'p' || !msg.d || typeof msg.d !== 'object' || Array.isArray(msg.d)) return;
    const a = this.who(ws); if (!a.id || a.gone) return;
    const next = msg.f ? {} : { ...a.p }, patch = {};
    for (const k of Object.keys(msg.d)) {
      if (k.length > 12 || k === '__proto__') continue;
      const v = msg.d[k];
      if (v === null || v === undefined) { delete next[k]; patch[k] = null; } else { next[k] = v; patch[k] = v; }
    }
    if (Object.keys(next).length > MAX_KEYS || JSON.stringify(next).length > MAX_PRESENCE) return;
    a.p = next; ws.serializeAttachment(a);
    this.send(ws, JSON.stringify(msg.f ? { t: 'p', id: a.id, d: next, f: 1 } : { t: 'p', id: a.id, d: patch }));
  }

  async webSocketClose(ws, code) {
    this.rate.delete(ws); this.drop(ws);
    try { ws.close(code >= 1000 && code <= 4999 && ![1004, 1005, 1006, 1015].includes(code) ? code : 1000); } catch (e) {}
  }

  async webSocketError(ws) { this.rate.delete(ws); this.drop(ws); }
}
