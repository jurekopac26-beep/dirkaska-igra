// The Playwright the browser tests and tools use, found the way require finds it: the repo's node_modules (npm ci, package.json's
// version: the one the references were made with) or else NODE_PATH (the cloud session's global install, without node_modules).
// A plain ESM `import 'playwright'` ignores NODE_PATH and fails with ERR_MODULE_NOT_FOUND there.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const playwright = require('playwright');
export const { chromium, firefox, webkit, devices } = playwright;
// where it was found (for pwNote: is it package.json's version?)
export const resolvePlaywright = (p = 'playwright') => require.resolve(p);
