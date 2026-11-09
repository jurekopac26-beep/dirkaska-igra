// proto: lets the repo's tools import 'playwright' from the global install and answers Killar's files with the prototype's changes (in memory only)
import { register } from 'node:module';
register('./hooks.mjs', import.meta.url);
