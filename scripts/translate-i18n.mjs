import fs from 'node:fs';

const enJson = fs.readFileSync('artifacts/atlanta-passport/src/i18n/locales/en.json', 'utf8');

const ALL_LANGS = [
  { code: 'es', name: 'Spanish (Spain/Latin America neutral)' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese (Brazilian)' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic (Modern Standard)' },
];

const onlyArg = process.argv[2]; // optional comma list of codes
const langs = onlyArg ? ALL_LANGS.filter(l => onlyArg.split(',').includes(l.code)) : ALL_LANGS;

const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
if (!baseUrl || !apiKey) { console.error('missing env'); process.exit(1); }

async function translate(lang) {
  const sys = `Translate this JSON to ${lang.name}. Output ONLY the JSON. Preserve keys, structure, placeholders ({{count}} etc), symbols (★→←·$). Keep these untranslated: Atlanta Passport, Atlanta, Beltline, Wheelhaus Bikes, WHEELHAUS BIKES, FIFA, Waffle House, Coca-Cola, World Cup, Old Fourth Ward, ATL, TIER, prices ($100). Tone: warm, playful, tourist-friendly.`;
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 16000, system: sys, messages: [{ role: 'user', content: enJson }] }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  JSON.parse(cleaned);
  return cleaned;
}

for (const lang of langs) {
  const t0 = Date.now();
  process.stdout.write(`${lang.code}... `);
  try {
    const json = await translate(lang);
    fs.writeFileSync(`artifacts/atlanta-passport/src/i18n/locales/${lang.code}.json`, json + '\n');
    process.stdout.write(`OK (${json.length}b, ${Date.now()-t0}ms)\n`);
  } catch (e) {
    process.stdout.write(`FAIL: ${e.message}\n`);
  }
}
console.log('done');
