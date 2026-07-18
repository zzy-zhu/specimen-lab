/* ============================================================
   SPECIMEN.lab — AI idea synthesis
   ------------------------------------------------------------
   summarizeIdeas() turns the room's raw idea/tech submissions into
   clustered themes + a short narrative for the map & monitor.

   If VITE_ANTHROPIC_API_KEY is set it calls Claude directly
   (browser-direct access, fine for a prototype / event laptop).
   Otherwise it falls back to a deterministic local synthesis so
   the experience always works offline.
   ============================================================ */
import { THEME_SEEDS, themeFor } from "../data/lab";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-5";

/* group participants by keyword theme */
export function clusterIdeas(people) {
  const withIdeas = people.filter((p) => (p.idea || "").trim() || (p.tech || "").trim());
  const buckets = THEME_SEEDS.map((t) => ({ ...t, members: [] }));
  withIdeas.forEach((p) => {
    const theme = themeFor(`${p.idea} ${p.tech}`);
    const b = buckets.find((x) => x.key === theme.key) || buckets[buckets.length - 1];
    b.members.push(p);
  });
  return buckets.filter((b) => b.members.length > 0);
}

/* ---- local (offline) synthesis ---- */
function localSynthesis(people) {
  const clusters = clusterIdeas(people).map((c) => {
    const techs = [...new Set(c.members.map((m) => m.tech).filter(Boolean))].slice(0, 4);
    const names = c.members.map((m) => m.name).slice(0, 5);
    const summary =
      `${c.members.length} ${c.members.length === 1 ? "specimen is" : "specimens are"} ` +
      `circling ${c.label.toLowerCase()}` +
      (techs.length ? `, reaching for ${techs.join(", ")}` : "") +
      `. ${names.join(", ")}${c.members.length > names.length ? " and others" : ""} could cross-pollinate here.`;
    return { key: c.key, label: c.label, count: c.members.length, members: names, tech: techs, summary };
  });

  const total = people.filter((p) => (p.idea || "").trim()).length;
  const top = [...clusters].sort((a, b) => b.count - a.count)[0];
  const overview = total
    ? `The room is holding ${total} unfinished idea${total === 1 ? "" : "s"}. ` +
      (top ? `Gravity is pulling toward “${top.label}”. ` : "") +
      `Unexpected adjacencies are forming between materials and machines — go contaminate each other.`
    : "No ideas captured yet. As specimens submit, themes will surface here.";

  return { clusters, overview, source: "local" };
}

/* ---- Claude synthesis ---- */
async function claudeSynthesis(people) {
  const ideas = people
    .filter((p) => (p.idea || "").trim())
    .map((p) => `- ${p.name}: idea="${p.idea}" tech="${p.tech}"`)
    .join("\n");

  const prompt = `You are the curator of Specimen.lab, "a living archive of contamination and creative mischief."
Below are participants' unfinished ideas and the tech/materials they want to explore. Cluster them into 2-5 emergent themes and write a punchy, poetic-but-concrete synthesis.

Return STRICT JSON only, shape:
{"clusters":[{"label":"...","count":N,"members":["name",...],"tech":["..."],"summary":"one vivid sentence about this cluster and who should meet"}],"overview":"2 sentences on the room's creative gravity and surprising adjacencies"}

Ideas:
${ideas}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`claude ${res.status}`);
  const data = await res.json();
  const text = data.content?.map((c) => c.text).join("") || "";
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  // attach keys for map coloring
  json.clusters = json.clusters.map((c) => ({ ...c, key: themeFor(`${c.label} ${(c.tech || []).join(" ")}`).key }));
  json.source = "claude";
  return json;
}

export async function summarizeIdeas(people) {
  if (API_KEY) {
    try {
      return await claudeSynthesis(people);
    } catch (e) {
      console.warn("Claude synthesis failed, using local fallback:", e.message);
    }
  }
  return localSynthesis(people);
}
