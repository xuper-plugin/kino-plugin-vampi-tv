// @ts-check
/// <reference path="./kino.d.ts" />
// Vampi TV: M3U lists as channels in Kino's En vivo tab. Kino itself downloads and parses each list: its groups become
// categories, and a channel's code (the key of favorites and recents) comes from its tvg-id, or from its address and name,
// never from its line number. So this file only says where the lists are: the included public list, and the ones the person
// writes in the settings. Read it top to bottom: 1. texts  2. lists  3. the exports  4. settings status.

// ---- 1. texts ----------------------------------------------------------------------------------------------------

const TEXTS = {
  es: {
    noList: "No hay ninguna lista: enciende «Usar la lista incluida» o escribe la dirección de una lista.",
    checking: "Comprobando…",
    listOk: "{host}: {channels} canales en {groups} grupos",
    listOkRepeated: "{host}: {channels} canales en {groups} grupos ({repeated} repiten su tvg-id)",
    notM3u: "{host}: no parece una lista M3U",
    timeout: "{host}: no respondió a tiempo",
    network: "{host}: no se pudo conectar",
    status: "{host}: respondió {status}",
    tooLarge: "{host}: la lista es muy grande; Kino lee hasta sus primeros 20 MB",
    failed: "{host}: no se pudo leer",
    summary: "{n} lista(s): {lines}",
    onlyChannels: "Vampi TV solo tiene canales en vivo: ábrelos en la pestaña En vivo.",
  },
  en: {
    noList: "There is no list: turn on “Use the included list” or write the address of a list.",
    checking: "Checking…",
    listOk: "{host}: {channels} channels in {groups} groups",
    listOkRepeated: "{host}: {channels} channels in {groups} groups ({repeated} repeat their tvg-id)",
    notM3u: "{host}: does not look like an M3U list",
    timeout: "{host}: did not answer in time",
    network: "{host}: could not connect",
    status: "{host}: answered {status}",
    tooLarge: "{host}: the list is very large; Kino reads its first 20 MB",
    failed: "{host}: could not be read",
    summary: "{n} list(s): {lines}",
    onlyChannels: "Vampi TV only has live channels: open them in the Live tab.",
  },
};

function t(key, vars) {
  const lang = String(kino.lang || "").toLowerCase().startsWith("es") ? "es" : "en";
  const tpl = TEXTS[lang][key] || TEXTS.es[key] || key;
  return vars ? tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] != null ? vars[k] : "")) : tpl;
}

// ---- 2. lists ----------------------------------------------------------------------------------------------------

// The included list: the public "Argentina" M3U of nicor1029 (declared host: raw.githubusercontent.com).
const DEFAULT_LIST = "https://raw.githubusercontent.com/nicor1029/Argentina/refs/heads/main/arglo.m3u";
const MAX_LISTS = 10; // Kino takes at most 10 playlist entries per answer

function webUrl(v) {
  const s = String(v || "").trim();
  if (!/^https?:\/\//i.test(s) || s.length > 2048) return "";
  try { return new URL(s).toString(); } catch { return ""; }
}

/** The lists to offer, in order: the included one (unless switched off), then the ones the person wrote. */
function lists() {
  const out = [];
  if (kino.config.get("useDefault") !== false) out.push({ url: DEFAULT_LIST, epg: "" });
  const typed = kino.config.get("lists");
  for (const l of Array.isArray(typed) ? typed : []) {
    const url = webUrl(l && l.url);
    if (url && !out.some((x) => x.url === url)) out.push({ url, epg: webUrl(l.epg) });
  }
  return out.slice(0, MAX_LISTS);
}

function refreshHours() {
  const n = parseInt(String(kino.config.get("refresh") || "6"), 10);
  return n >= 1 && n <= 168 ? n : 6;
}

/** Group titles never shown: the names the person wrote, trimmed, at most 50. */
function hiddenGroups() {
  return String(kino.config.get("hide") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
}

function playerHeaders() {
  const agent = String(kino.config.get("userAgent") || "").trim();
  return agent ? { "User-Agent": agent } : undefined;
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return "?"; }
}

// ---- 3. the exports ----------------------------------------------------------------------------------------------

/** One playlist entry per list: Kino downloads and groups them. Never a channel of our own, so there is no per-category call. */
export async function liveCategories() {
  const hide = hiddenGroups();
  const streamHeaders = playerHeaders();
  return lists().map((l) => ({
    playlist: {
      url: l.url,
      format: "m3u",
      refreshHours: refreshHours(),
      genre: "entretenimiento",
      ...(hide.length ? { hideGroups: hide } : {}),
      ...(streamHeaders ? { streamHeaders } : {}),
      ...(l.epg ? { epg: { url: l.epg, format: "xmltv" } } : {}),
    },
  }));
}

/** Declared because Kino's manifest rules ask for it: this plugin has no titles of its own, only the channels of its lists. */
export async function home() {
  return [];
}

export async function resolve() {
  throw kino.error("not_found", "this plugin only has live channels", { userMessage: t("onlyChannels") });
}

/** Required by `channels`; every channel comes from a playlist, so Kino never asks for a category of ours. */
export async function liveChannels() {
  return { items: [] };
}

// ---- 4. settings status ------------------------------------------------------------------------------------------

/** What a list holds, read from its text: channels, groups, and the entries that repeat a tvg-id (their favorites lose their key). */
export function summarize(text) {
  const entries = String(text).match(/^#EXTINF[^\n]*/gm) || [];
  const groups = new Set();
  const ids = new Set();
  let repeated = 0;
  for (const e of entries) {
    const g = /group-title=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/.exec(e);
    if (g) groups.add(g[1] ?? g[2] ?? g[3]);
    const i = /tvg-id=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/.exec(e);
    const id = i && (i[1] ?? i[2] ?? i[3]);
    if (id) {
      if (ids.has(id)) repeated += 1; else ids.add(id);
    }
  }
  return { channels: entries.length, groups: groups.size, repeated };
}

async function check(l) {
  const host = hostOf(l.url);
  try {
    const r = await kino.fetch(l.url, { timeoutMs: 12000 });
    if (!r.ok) return t("status", { host, status: r.status });
    const s = summarize(r.text());
    if (!s.channels) return t("notM3u", { host });
    return t(s.repeated ? "listOkRepeated" : "listOk", { host, channels: s.channels, groups: s.groups, repeated: s.repeated });
  } catch (e) {
    const code = e && e.code;
    if (code === "timeout") return t("timeout", { host });
    if (code === "network") return t("network", { host });
    if (code === "too_large") return t("tooLarge", { host });
    return t("failed", { host });
  }
}

async function checkAll() {
  const all = lists();
  if (!all.length) return t("noList");
  const lines = await Promise.all(all.map(check));
  return t("summary", { n: all.length, lines: lines.join("; ") });
}

export async function settingsStatus() {
  return { estado: await checkAll() };
}

export async function action(key) {
  if (key !== "probar") return null;
  return { message: await checkAll() };
}
