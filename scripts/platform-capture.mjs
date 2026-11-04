/* Wave 982: capture real platform components in GitHub Actions only.
 * Copy this file to the pinned platform web tree as e2e/marketing-capture.mjs.
 * Run after that tree has been built. No backend, live account or live data is used.
 * Existing generated fixtures supply the data. Small specialist projections
 * below adapt those synthetic records to the actual specialist response shapes.
 * Public captions must say that these are platform previews with example data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  WEB, CHROMIUM_ARGS, chromium, installMocks, makeContext, sessionFor,
  startPreview, stopPreview, settle,
} from './repaint-lib.mjs';

if (process.env.CI !== 'true') throw new Error('Platform captures run in GitHub Actions only.');
if (process.env.IIP_AUTH_JSON) throw new Error('Live authentication is forbidden for marketing captures.');
const sourceSha = process.env.PLATFORM_SOURCE_SHA || '';
if (!/^[a-f0-9]{40}$/i.test(sourceSha)) throw new Error('PLATFORM_SOURCE_SHA must name the pinned full source commit.');
const output = path.resolve(process.env.CAPTURE_OUTPUT || '/tmp/platform-captures');
const dist = path.resolve(process.env.PLATFORM_DIST || path.join(WEB, 'dist'));
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Build the pinned platform in CI before capture.');
fs.mkdirSync(output, { recursive: true });
const photoPath = path.resolve(process.env.CAPTURE_PROPERTY_PHOTO
  || path.join(WEB, 'public', 'marketing', 'w33-home-terrace-1200.webp'));
if (!fs.existsSync(photoPath)) throw new Error('The example property photograph is missing.');
const photo = fs.readFileSync(photoPath);
const photoType = /\.png$/i.test(photoPath) ? 'image/png'
  : /\.jpe?g$/i.test(photoPath) ? 'image/jpeg' : 'image/webp';

const fixtureFiles = [
  'e2e/fixtures/wave496-cards.json',
  'e2e/fixtures/wave800-shoot.json',
  'e2e/fixtures/wave801-shoot.json',
  'e2e/fixtures/wave802-shoot.json',
  'e2e/fixtures/wave784-shoot.json',
  'e2e/fixtures/wave779-tenants.json',
  'e2e/fixtures/wave891-sourcer.json',
];
const read = (file) => JSON.parse(fs.readFileSync(path.join(WEB, file), 'utf8'));
const [cards, queues, contacts, reports, leases, tenants, sourcer] = fixtureFiles.map(read);
if (cards._synthetic !== true || !Array.isArray(cards.results) || !cards.results.length) {
  throw new Error('The source card fixture must explicitly identify its data as synthetic.');
}

/* No contact detail from a fixture is needed in a public product preview.
 * Use reserved example addresses and omit phone numbers. Structural IDs and
 * the generated financial examples remain unchanged, not product promises.
 */
function publicExample(value, key = '') {
  if (/email/i.test(key) && typeof value === 'string' && value) return 'demo@example.invalid';
  if (/phone|mobile_number/i.test(key) && typeof value === 'string') return '';
  if (/registered_provider_name|rp_name/i.test(key)) return null;
  if (Array.isArray(value)) return value.map((v) => publicExample(v));
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, publicExample(v, k)]),
  );
  return value;
}

const examples = cards.results.slice(0, 3).map((row, i) => ({
  ...publicExample(row),
  title: `Example home ${i + 1}`,
  address_line: `Example property ${i + 1}`,
  address_canonical: null,
  attribution: null,
  agent_name: '',
  agent_email: '',
  agent_phone: '',
  registered_provider_name: null,
}));
const stock = examples.map((row) => ({
  id: row.id, title: row.title, address_line: row.address_line,
  city: row.city, region: row.region, postcode: row.postcode,
  bedrooms: row.bedrooms, refurb_status: row.refurb_status,
  lease_status: row.lease_status, image_urls: row.image_urls,
  accessibility_tags: row.accessibility_tags || [], attribution: null,
}));
const snapshotAt = '2026-10-19T10:00:00';
const demoSession = (role) => ({ ...sessionFor(role), full_name: 'Demo account' });
const reply = (route, body, status = 200, headers = {}) => route.fulfill({
  status, contentType: 'application/json',
  headers: { 'access-control-expose-headers': 'X-Total-Count', ...headers },
  body: JSON.stringify(publicExample(body)),
});
const paged = (route, value) => reply(route, value.body, value.status || 200,
  value.total == null ? {} : { 'X-Total-Count': String(value.total) });
const sortedKey = (pathname, search) => {
  const pairs = [...new URLSearchParams(search)].sort(([a, av], [b, bv]) =>
    a.localeCompare(b) || av.localeCompare(bv));
  const query = new URLSearchParams(pairs).toString();
  return `${pathname}${query ? `?${query}` : ''}`;
};

/* These are existing published UI routes, not invented product mockups.
 * The visible-record selector makes a blank queue fail capture.
 */
const targets = [
  { key: 'investor', role: 'investor', route: '/investor/search', ready: '[data-testid="launch-panel"]', record: '[data-testid="location-input"]' },
  { key: 'resident', role: 'seeker', route: '/seeker/matches', ready: '.seeker-match-card', record: '.seeker-match-card' },
  { key: 'care-provider', role: 'care_provider', route: '/care_provider/requirements', ready: '[data-testid="care-requirements-form"]', record: '[data-testid="care-area-list"]' },
  { key: 'housing-association', role: 'housing_association', route: '/housing_association', ready: 'h1', record: '[data-region="cards"] article' },
  { key: 'local-authority', role: 'local_authority', route: '/local_authority', ready: 'h1', record: '[data-region="cards"] article' },
  { key: 'co-sourcer', role: 'deal_sourcer', route: '/sourcer', ready: '[data-testid="sourcer-stock"][data-loaded="true"]', record: '[data-property]' },
  { key: 'housing-provider', role: 'housing_provider', route: '/housing_provider', ready: 'h1', record: '[data-region="cards"] article' },
  { key: 'estate-agent', role: 'estate_agent', route: '/agent', ready: '.agent-dash__row', record: '.agent-dash__row' },
  { key: 'contractor', role: 'contractor', route: '/contractor', ready: 'tbody tr', record: 'tbody tr' },
  { key: 'valuer', role: 'valuer', route: '/valuer', ready: 'tbody tr', record: 'tbody tr' },
  { key: 'viewer', role: 'viewer', route: '/viewer', ready: 'tbody tr', record: 'tbody tr' },
  { key: 'management-agent', role: 'management_agent', route: '/management_agent/properties', ready: '[data-testid="managed-row"]', record: '[data-testid="managed-row"]' },
  { key: 'management-agent-dashboard', role: 'management_agent', route: '/management_agent', ready: '[data-testid="ma-dashboard"]' },
  { key: 'management-agent-contacts', role: 'management_agent', route: '/management_agent/properties/contacts', ready: '[data-testid="contact-name"]', record: '[data-testid="contact-name"]' },
  { key: 'management-agent-calendar', role: 'management_agent', route: '/management_agent/calendar', ready: '[data-testid="cal-controls"]' },
  { key: 'management-agent-maintenance', role: 'management_agent', route: '/management_agent/properties/maintenance', ready: '[data-testid="mnt-row"]', record: '[data-testid="mnt-row"]' },
  { key: 'management-agent-compliance', role: 'management_agent', route: '/management_agent/properties/compliance', ready: '[data-testid="cmp-row"]', record: '[data-testid="cmp-row"]' },
];

async function installExamples(ctx, target, seen, blockedWrites, failedApi) {
  const queueReads = queues.states.busy;
  const queuePaths = new Set(Object.keys(queueReads).map((key) => key.split('?')[0]));
  const reportByPath = Object.fromEntries(reports.registry.body.map((entry) => [entry.json_path, reports.rows[entry.key]]));
  await ctx.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const p = url.pathname.replace(/^\/api/, '');
    const method = request.method();
    seen.add(`${method} ${p}`);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !p.startsWith('/investors/me/feed/search')) {
      blockedWrites.add(`${method} ${p}`);
      return reply(route, { detail: 'The screenshot preview is read only.' }, 405);
    }
    if (p === '/auth/me') return reply(route, demoSession(target.role));
    if (p === '/tutorials/progress') return reply(route, {
      role: target.role, invite: false, stage: null, step: 0,
      completed_stages: [], started_at: null, completed_at: null, dismissed_at: snapshotAt,
    });
    if (p === '/seekers/me/profile') return reply(route, {
      consent_to_match: true, preferred_regions: [], cohort_tags: [], full_name: 'Demo resident',
    });
    if (p === '/seekers/me/matches') return reply(route, examples.slice(0, 2).map((row, i) => ({
      id: row.id, deal_id: row.id, title: row.title, address_line: row.address_line,
      region: row.region, postcode: row.postcode, bedrooms: row.bedrooms,
      bathrooms: row.bathrooms, receptions: row.receptions, property_type: row.property_type,
      score: 60 + i, reason: 'Example match for demonstration', available_now: false,
      description: 'Example property record', monthly_rent_sl: null,
    })));
    if (p.startsWith('/stock/')) return reply(route, stock, 200, { 'X-Total-Count': String(stock.length) });
    if (p === '/care_provider/requirement') return reply(route, { requirement: {
      areas: [{ name: 'Nottingham', kind: 'exact', code: null }],
      property_types: ['terraced'], use_types: [], beds_min: 3, beds_max: null,
      features: ['garden'], note: '',
    } });
    if (p === '/care_provider/requirement/matches') return reply(route, { matches: stock, total: stock.length });
    if (p === '/contractor/jobs') return reply(route, examples.map((row) => ({
      id: row.id, title: row.title, address_line: row.address_line,
      scope_summary: 'Example refurbishment scope', refurb_status: 'scoping',
    })));
    if (p === '/contractor/quotes' || p === '/valuer/submissions' || p === '/viewer/reports') return reply(route, []);
    if (p === '/valuer/queue') return reply(route, examples.map((row) => ({
      id: row.id, title: row.title, address_line: row.address_line,
      ai_valuation: row.ai_valuation, purchase_price: row.purchase_price, refurb_estimate: row.refurb_estimate,
    })));
    if (p === '/viewer/assignments') return reply(route, examples.map((row) => ({
      id: row.id, deal_id: row.id, location: row.address_line,
      // Same synthetic viewing fee as e2e/wave848-shoot.mjs, never a quoted rate.
      fee_offered: 60, urgency: 'normal', status: 'assigned',
    })));
    if (p === '/agent/listings') return reply(route, examples.map((row) => ({
      id: row.id, address_line: row.address_line, postcode: row.postcode,
      bedrooms: row.bedrooms, bathrooms: row.bathrooms, property_type: row.property_type,
      asking_price_gbp: row.purchase_price, status: 'pending', created_at: snapshotAt,
    })));
    if (p === '/sourcer/properties') return reply(route, sourcer.stock);
    if (p === '/sourcer/profile') return reply(route, sourcer.profile);
    if (p === '/sourcer/account') return reply(route, sourcer.account);
    if (p === '/sourcer/agreement') return reply(route, sourcer.agreement);

    if (target.key === 'management-agent-contacts') {
      if (p === '/agency/agencies') return reply(route, contacts.agencies.owner);
      if (p === '/agency/contacts') return paged(route, contacts.contacts.list);
      if (p === '/agency/contacts/types') return reply(route, contacts.contacts.types);
      if (p === '/agency/contacts/facets') return reply(route, contacts.contacts.facets);
    }
    if (['management-agent-maintenance', 'management-agent-compliance'].includes(target.key) && queuePaths.has(p)) {
      const got = queueReads[sortedKey(p, url.search)];
      if (!got) {
        failedApi.add(sortedKey(p, url.search));
        return reply(route, { detail: 'No generated example response was recorded for this read.' }, 500);
      }
      return paged(route, got);
    }
    if (p === '/leases/register') return reply(route, leases.register);
    if (p === '/agency/tenants') return reply(route, tenants.off);
    if (p === '/agency/reports') return paged(route, reports.registry);
    if (reportByPath[p]) return paged(route, reportByPath[p]);
    return route.fallback();
  });
  // The harness normally substitutes a geometric image for external listing
  // photos. Use one existing owned marketing photograph as an explicitly
  // illustrative example instead. Real app icons and character images stay.
  await ctx.route('**/*', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    const tile = /\/\d{1,2}\/\d+\/\d+(@\dx)?\.(png|jpe?g|webp|pbf|mvt)(\?|$)/.test(url.pathname + url.search);
    const listingPhoto = url.pathname.startsWith('/static-images')
      || url.pathname.startsWith('/api/images/')
      || (!local && request.resourceType() === 'image' && !tile);
    if (listingPhoto) return route.fulfill({ status: 200, contentType: photoType, body: photo });
    return route.fallback();
  });
}

const manifest = {
  schemaVersion: 1, sourceSha, capturedAt: new Date().toISOString(),
  provenance: 'Actual platform UI rendered from a pinned source build with synthetic demonstration data. No live account or backend.',
  fixtureFiles: fixtureFiles.map((file) => ({ file,
    sha256: createHash('sha256').update(fs.readFileSync(path.join(WEB, file))).digest('hex') })),
  fixtureAdaptations: ['Synthetic card projections for specialist queues and stock',
    'Example resident match scores and care requirements', 'Reserved email addresses and omitted phone numbers',
    'Tutorial invitation dismissed for an unobstructed product view',
    'Existing owned marketing photograph illustrates example listings'],
  examplePhoto: { file: path.basename(photoPath), sha256: createHash('sha256').update(photo).digest('hex') },
  screenshots: [], failures: [],
};
const widths = process.env.CAPTURE_MOBILE === '1' ? [[1300, 820], [390, 844]] : [[1300, 820]];
let server;
let browser;
try {
  server = await startPreview(4982, dist);
  browser = await chromium.launch({ args: CHROMIUM_ARGS,
    ...(process.env.IIP_CHROMIUM ? { executablePath: process.env.IIP_CHROMIUM } : {}) });
  for (const target of targets) {
    for (const [width, height] of widths) {
      const unmocked = new Set();
      const seen = new Set();
      const blockedWrites = new Set();
      const failedApi = new Set();
      const errors = [];
      const ctx = await makeContext(browser, target.role, width, height, demoSession(target.role));
      const row = { ...target, width, height, sourceSha, file: `${target.key}-${width}.png` };
      try {
        await installMocks(ctx, unmocked, { role: target.role });
        await installExamples(ctx, target, seen, blockedWrites, failedApi);
        const page = await ctx.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${server.base}${target.route}`, { waitUntil: 'domcontentloaded' });
        await page.locator(target.ready).first().waitFor({ timeout: 30000 });
        await settle(page);
        if (new URL(page.url()).pathname !== target.route.split('?')[0]) throw new Error(`Unexpected redirect to ${new URL(page.url()).pathname}`);
        if (target.record) await page.locator(target.record).first().waitFor({ timeout: 15000 });
        if (await page.locator('[role="dialog"]:visible').count()) throw new Error('A dialog covers the product screen.');
        const body = await page.locator('body').innerText();
        if (/Something went wrong|An unexpected error occurred/.test(body)) throw new Error('The product error boundary is visible.');
        if (errors.length) throw new Error(errors.join('\n'));
        if (failedApi.size) throw new Error(`Missing generated API examples: ${[...failedApi].join(', ')}`);
        if (blockedWrites.size) throw new Error(`Unexpected write request: ${[...blockedWrites].join(', ')}`);
        row.headings = await page.locator('h1, h2').allTextContents();
        row.overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        if (row.overflow) throw new Error('The page overflows its viewport.');
        await page.screenshot({ path: path.join(output, row.file), fullPage: false });
        row.sha256 = createHash('sha256').update(fs.readFileSync(path.join(output, row.file))).digest('hex');
        row.status = 'captured';
        console.log(`Captured ${row.file}: ${target.role} ${target.route}`);
      } catch (error) {
        row.status = 'failed';
        row.error = String(error.message || error);
        manifest.failures.push({ key: target.key, width, error: row.error });
        console.error(`Capture failed for ${target.key}: ${row.error}`);
      } finally {
        row.knownMockedApi = [...seen].filter((item) => ![...unmocked].some((missing) => item.endsWith(missing.replace(/\?$/, '')))).sort();
        row.fallbackEmptyApi = [...unmocked].sort();
        row.blockedWrites = [...blockedWrites].sort();
        row.missingGeneratedApi = [...failedApi].sort();
        row.pageErrors = errors;
        manifest.screenshots.push(row);
        await ctx.close();
        fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      }
    }
  }
} finally {
  if (browser) await browser.close();
  stopPreview(server);
  fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
if (manifest.failures.length) process.exitCode = 1;
