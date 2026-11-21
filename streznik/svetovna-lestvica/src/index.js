// Svetovna lestvica, the Worker (README.md here): the requests (streznik.js) and the daily clean-up (pospravi.js, wrangler.toml crons).
import { obdelaj } from './streznik.js';
import { pospravi } from './pospravi.js';

export default {
  fetch: (req, env, ctx) => obdelaj(req, env, ctx),
  scheduled: (ev, env, ctx) => { ctx.waitUntil(pospravi(env, ev.scheduledTime)); },
};
