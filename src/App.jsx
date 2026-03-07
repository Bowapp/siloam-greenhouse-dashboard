import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const C = {
  bg: "#07100d",
  surface: "#0d1f17",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(74,127,181,0.18)",
  blue: "#4a7fb5",
  blueLight: "#a8c8e8",
  blueDim: "#2a5a8a",
  mint: "#52b788",
  foam: "#95d5b2",
  cream: "#f8f4ef",
  gold: "#c9a84c",
  smoke: "#7a8a80",
  clay: "#8b5e3c",
};

const MONTHS_LABELS = [
  "Mar '26","Apr '26","May '26","Jun '26","Jul '26","Aug '26",
  "Sep '26","Oct '26","Nov '26","Dec '26","Jan '27","Feb '27",
  "Mar '27","Apr '27","May '27","Jun '27","Jul '27","Aug '27",
  "Sep '27","Oct '27","Nov '27","Dec '27","Jan '28","Feb '28",
];
const SHORT = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb",
               "Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"];

// Real Huntsville data — Chop & Roll $600/mo, AL labor rates, Southern produce access
const BASE_ORDERS = [18,28,40,52,60,65,60,63,68,65,58,62,72,80,90,98,108,112,106,110,118,113,103,108];
const COSTS = {
  kitchenRent: 600,   // Chop & Roll shared kitchen
  labor: 0.10,        // AL min wage $7.25/hr vs CA $17+
  produce: 0.17,      // Southern farming access
  packaging: 0.07,
  platform: 0.25,     // DoorDash standard
  marketing: 0.07,
  util: 120,
  permits: 400,
};

function buildData(scenario) {
  const m = scenario === "conservative" ? 0.78 : scenario === "optimistic" ? 1.22 : 1;
  return BASE_ORDERS.map((baseOrd, i) => {
    const orders = Math.round(baseOrd * m);
    const aov = i < 12 ? 20 + i * 0.25 : 22.75 + (i - 12) * 0.30;
    const rev = Math.round(orders * aov * 30.4);
    const produce = Math.round(rev * COSTS.produce);
    const packaging = Math.round(rev * COSTS.packaging);
    const rent = i === 0 ? 0 : COSTS.kitchenRent;
    const labor = Math.round(rev * COSTS.labor);
    const platform = Math.round(rev * COSTS.platform);
    const mktg = Math.round(rev * (i < 3 ? 0.09 : COSTS.marketing));
    const util = COSTS.util;
    const permits = i === 0 ? COSTS.permits : i === 12 ? 120 : 0;
    const supplies = Math.round(rev * 0.02);
    const totalCosts = produce + packaging + rent + labor + platform + mktg + util + permits + supplies;
    const profit = rev - totalCosts;
    return {
      month: MONTHS_LABELS[i],
      label: SHORT[i],
      orders, aov: Math.round(aov * 100) / 100, rev,
      produce, packaging, rent, labor, platform, mktg, util, permits, supplies,
      totalCosts, profit,
      margin: Math.round((profit / rev) * 100),
      free: i === 0,
    };
  });
}

const fmt = v => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`;

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1a13", border: `1px solid ${C.blue}66`, borderRadius: 10, padding: "8px 12px", fontSize: 11, color: C.cream, minWidth: 150 }}>
      <p style={{ color: C.blueLight, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color || C.cream, margin: "2px 0" }}>
          {e.name}: {e.value > 500 ? fmt(e.value) : e.name?.includes("%") ? `${e.value}%` : e.value}
        </p>
      ))}
    </div>
  );
};

const TABS = [
  { id: "overview", emoji: "📈", label: "Revenue" },
  { id: "costs",    emoji: "💸", label: "Costs" },
  { id: "materials",emoji: "🌿", label: "Materials" },
  { id: "products", emoji: "💚", label: "Products" },
  { id: "kitchens", emoji: "🏠", label: "Kitchens" },
  { id: "monthly",  emoji: "📋", label: "Monthly" },
];

const materials = [
  { item: "Organic Produce", low: 2.40, mid: 2.90, high: 3.60, note: "Local AL farmers markets + Southern co-ops reduce cost vs national avg" },
  { item: "Botanical Herbs & Adaptogens", low: 0.60, mid: 0.90, high: 1.40, note: "Sea moss, elderberry, ashwagandha — order bulk online to keep costs low" },
  { item: "Sweeteners (honey, agave)", low: 0.20, mid: 0.32, high: 0.50, note: "Alabama is a honey-producing state — local sourcing is a brand story" },
  { item: "Packaging (bottles, cups)", low: 0.80, mid: 1.05, high: 1.45, note: "Glass premium; start with BPA-free plastic then upgrade at volume" },
  { item: "Labels & Branding", low: 0.12, mid: 0.22, high: 0.38, note: "Vistaprint or local Huntsville printer — drops sharply at 500+/day" },
  { item: "Insulated Delivery Liners", low: 0.10, mid: 0.14, high: 0.20, note: "DoorDash bags help but liners protect cold-press quality" },
  { item: "Kitchen Consumables", low: 0.07, mid: 0.11, high: 0.16, note: "Gloves, sanitizer, paper towels — AL health dept. compliance" },
  { item: "Add-in Upsells (collagen, chia)", low: 0.38, mid: 0.60, high: 0.95, note: "~40% attach rate; charge $2 extra. Pure profit after ~$0.60 cost" },
];

const products = [
  { name: "Cold-Pressed Juice (12oz)", price: "$13", cogs: "$3.20", gross: "75%", net: "48%", note: "Lead product — build early reviews here" },
  { name: "Smoothie (16oz)", price: "$14", cogs: "$3.80", gross: "73%", net: "46%", note: "High volume, familiar category" },
  { name: "Herbal Syrup / Honey (4oz)", price: "$16", cogs: "$3.40", gross: "79%", net: "52%", note: "Best margin — local honey story sells itself" },
  { name: "Sea Moss / Wellness Blend", price: "$20", cogs: "$5.00", gross: "75%", net: "48%", note: "Repeat purchase driver — subscription potential" },
  { name: "Detox Bundle (3 items)", price: "$34", cogs: "$8.50", gross: "75%", net: "48%", note: "Boosts avg order value significantly" },
  { name: "Seasonal Wellness Box", price: "$48", cogs: "$12.00", gross: "75%", net: "48%", note: "Holiday / quarterly drops. Pre-orders possible" },
];

const kitchens = [
  {
    name: "Host & Ghost Commissary",
    addr: "115 Wholesale Ave NE, Huntsville AL 35811",
    phone: "(256) 270-4779",
    rate: "Call for pricing",
    hours: "Flexible",
    fit: "🌟 Best First Call",
    color: C.blue,
    notes: [
      "Specializes in early-stage food startups — their whole model is helping businesses like Siloam launch",
      "Co-packing services available (they can help fulfill larger orders)",
      "Cold storage, dry storage included",
      "Name literally says ghost kitchen — built for delivery-first brands",
    ],
  },
  {
    name: "Chop & Roll Commissary",
    addr: "2537 Sparkman Dr NW, Huntsville AL 35810",
    phone: "(256) 714-7740",
    rate: "$600–$2,000/mo",
    hours: "24/7 access",
    fit: "✅ Best Value",
    color: C.mint,
    notes: [
      "4 commercial kitchens — multiple options and sizes",
      "24/7 access means Jewel can prep on her own schedule",
      "600lb daily ice machine (essential for cold-press)",
      "Cold & dry storage included. $600/mo shared is the starting rate",
    ],
  },
  {
    name: "MAPKitchen",
    addr: "Huntsville, AL",
    phone: "Search online for current contact",
    rate: "Inquire directly",
    hours: "By arrangement",
    fit: "💚 Category Aligned",
    color: C.gold,
    notes: [
      "Plant-based and vegan kitchen — literally built for Siloam's product type",
      "Other tenants are wellness/health brands — built-in community and referral network",
      "Potential for cross-promotion with other plant-based vendors",
      "Most brand-aligned of the three options",
    ],
  },
];

export default function App() {
  const [scenario, setScenario] = useState("base");
  const [tab, setTab] = useState("overview");
  const [animKey, setAnimKey] = useState(0);

  const data = buildData(scenario);
  const y1 = data.slice(0, 12);
  const y2 = data.slice(12, 24);
  const r1 = y1.reduce((s, d) => s + d.rev, 0);
  const p1 = y1.reduce((s, d) => s + d.profit, 0);
  const r2 = y2.reduce((s, d) => s + d.rev, 0);
  const p2 = y2.reduce((s, d) => s + d.profit, 0);
  const avgM = Math.round(data.reduce((s, d) => s + d.margin, 0) / data.length);

  useEffect(() => { setAnimKey(k => k + 1); }, [scenario]);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { background: ${C.bg}; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-thumb { background: ${C.blueDim}; border-radius: 3px; }
    @keyframes fu { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .fu { animation: fu 0.4s ease forwards; }

    .wrap { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
    @media(min-width:600px) { .wrap { padding: 0 28px; } }
    @media(min-width:900px) { .wrap { padding: 0 32px; } }

    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media(min-width:600px) { .kpi-grid { grid-template-columns: repeat(3,1fr); } }
    @media(min-width:900px) { .kpi-grid { grid-template-columns: repeat(5,1fr); } }

    .two-col { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media(min-width:700px) { .two-col { grid-template-columns: 1fr 1fr; } }

    .three-col { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media(min-width:500px) { .three-col { grid-template-columns: 1fr 1fr; } }
    @media(min-width:900px) { .three-col { grid-template-columns: 1fr 1fr 1fr; } }

    .cost-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media(min-width:650px) { .cost-grid { grid-template-columns: 1fr 1fr; } }

    .tab-bar { display: flex; gap: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; border-bottom: 1px solid rgba(74,127,181,0.2); }
    .tab-bar::-webkit-scrollbar { display: none; }
    .tab-btn { flex-shrink: 0; padding: 10px 14px; background: transparent; border: none; border-bottom: 2px solid transparent; color: ${C.smoke}; font-size: 13px; cursor: pointer; border-radius: 7px 7px 0 0; margin-bottom: -1px; transition: all 0.2s; display: flex; align-items: center; gap: 5px; white-space: nowrap; font-family: inherit; }
    .tab-btn.active { background: rgba(74,127,181,0.18); border-bottom-color: ${C.blue}; color: ${C.cream}; font-weight: 600; }
    .tab-btn:hover { background: rgba(74,127,181,0.1); }

    .sc-btn { padding: 6px 13px; border-radius: 20px; border: 1px solid rgba(74,127,181,0.3); background: transparent; color: ${C.smoke}; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .sc-btn.active { border-color: ${C.blue}; background: rgba(74,127,181,0.22); color: ${C.blueLight}; font-weight: 600; }

    .card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 14px; padding: 16px; }
    @media(min-width:600px) { .card { padding: 20px 22px; } }

    .kpi-card { background: rgba(74,127,181,0.07); border: 1px solid rgba(74,127,181,0.2); border-radius: 12px; padding: 12px 14px; transition: transform 0.2s; }
    .kpi-card:hover { transform: translateY(-2px); }

    .item-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(74,127,181,0.12); border-radius: 12px; padding: 14px 15px; }

    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { border-collapse: collapse; width: 100%; min-width: 420px; }
    th { text-align: left; padding: 9px 10px; font-size: 10px; color: ${C.blueLight}; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 2px solid rgba(74,127,181,0.25); font-weight: 600; white-space: nowrap; }
    td { padding: 9px 10px; font-size: 12px; vertical-align: top; }

    .row-divider { border-bottom: 1px solid rgba(74,127,181,0.1); padding: 6px 0; display: flex; justify-content: space-between; align-items: center; }

    @media(max-width:599px) {
      .tab-bar-outer { position: fixed; bottom: 0; left: 0; right: 0; background: #0a1812; border-top: 1px solid rgba(74,127,181,0.2); z-index: 100; padding: 4px 8px 10px; }
      .tab-bar { border-bottom: none; justify-content: space-around; }
      .tab-btn { flex-direction: column; gap: 2px; padding: 6px 8px; font-size: 10px; border-bottom: none !important; border-radius: 8px; }
      .tab-emoji { font-size: 18px; }
      .tab-btn.active { background: rgba(74,127,181,0.2); }
      .content-pad { padding-bottom: 90px; }
    }
    @media(min-width:600px) {
      .tab-bar-outer { padding: 0 28px; margin-top: 20px; }
      .tab-emoji { display: none; }
      .content-pad { padding-bottom: 0; }
    }
    @media(min-width:900px) { .tab-bar-outer { padding: 0 32px; } }
  `;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #0e1f18 0%, #07100d 50%, ${C.bg} 100%)`, color: C.cream, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{ background: "rgba(74,127,181,0.15)", borderBottom: "1px solid rgba(74,127,181,0.25)", padding: "20px 0 16px" }}>
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32 }}>🌿</span>
              <div>
                <p style={{ color: C.blueLight, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 3 }}>Ghost Kitchen · Huntsville, AL · Financial Model</p>
                <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.cream, lineHeight: 1.1 }}>Siloam Greenhouse</h1>
                <p style={{ color: C.smoke, fontSize: 11, marginTop: 3 }}>
                  <span style={{ color: C.blueLight }}>🚀 Huntsville, Alabama</span>
                  <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
                  DoorDash-first · 2-Year Projection
                </p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 9, color: C.smoke, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Scenario</p>
              <div style={{ display: "flex", gap: 6 }}>
                {["conservative", "base", "optimistic"].map(s => (
                  <button key={s} className={`sc-btn${scenario === s ? " active" : ""}`} onClick={() => setScenario(s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div key={animKey} className="wrap" style={{ marginTop: 18 }}>
        <div className="kpi-grid">
          {[
            { l: "Year 1 Revenue",     v: fmt(r1), s: "gross",            c: C.blueLight, d: "0s" },
            { l: "Year 1 Net Profit",  v: fmt(p1), s: "after all costs",  c: C.mint,      d: "0.06s" },
            { l: "Year 2 Revenue",     v: fmt(r2), s: `+${Math.round((r2/r1-1)*100)}% YoY`, c: C.gold, d: "0.12s" },
            { l: "Year 2 Net Profit",  v: fmt(p2), s: "after all costs",  c: "#7fc97f",   d: "0.18s" },
            { l: "Avg Net Margin",     v: avgM+"%",s: "vs 10–30% industry", c: C.cream,   d: "0.24s" },
          ].map((k, i) => (
            <div key={i} className="kpi-card fu" style={{ animationDelay: k.d, opacity: 0 }}>
              <p style={{ fontSize: 9, color: C.smoke, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{k.l}</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: k.c, marginBottom: 2 }}>{k.v}</p>
              <p style={{ fontSize: 10, color: C.smoke }}>{k.s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TAB BAR */}
      <div className="tab-bar-outer">
        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-emoji">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="wrap content-pad" style={{ marginTop: 20 }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 14 }}>Revenue vs. Net Profit (24 Months)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.4}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={0.4}/><stop offset="95%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,181,0.1)" />
                  <XAxis dataKey="label" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={40} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.smoke }} />
                  <Area type="monotone" dataKey="rev" name="Gross Revenue" stroke={C.blue} fill="url(#rg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke={C.gold} fill="url(#pg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 14 }}>Daily Orders & Avg Order Value</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,181,0.1)" />
                  <XAxis dataKey="label" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis yAxisId="o" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} width={30} />
                  <YAxis yAxisId="a" orientation="right" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v => `$${v}`} width={34} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.smoke }} />
                  <Line yAxisId="o" type="monotone" dataKey="orders" name="Daily Orders" stroke={C.blueLight} strokeWidth={2} dot={false} />
                  <Line yAxisId="a" type="monotone" dataKey="aov" name="Avg Order ($)" stroke={C.gold} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Net Profit Margin % by Month</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 14, lineHeight: 1.5 }}>Huntsville's lower costs push margins above the ghost kitchen industry average of 10–30% faster than a higher-cost market.</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,181,0.1)" />
                  <XAxis dataKey="label" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 40]} width={36} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="margin" name="Net Margin %" radius={[4, 4, 0, 0]}>
                    {data.map((d, i) => <rect key={i} fill={d.margin > 22 ? C.blue : d.margin > 16 ? C.blueDim : "#1e3a5f"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="two-col">
              {[[y1, r1, p1, "Year 1 Summary", C.blue], [y2, r2, p2, "Year 2 Summary", C.gold]].map(([yr, r, p, lbl, c]) => {
                const peak = yr.reduce((a, b) => a.profit > b.profit ? a : b);
                return (
                  <div key={lbl} className="card">
                    <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: c, marginBottom: 12 }}>{lbl}</p>
                    {[
                      ["Total Revenue", fmt(r)],
                      ["Total Net Profit", fmt(p)],
                      ["Avg Net Margin", Math.round((p / r) * 100) + "%"],
                      ["Total Costs", fmt(yr.reduce((s, d) => s + d.totalCosts, 0))],
                      ["Peak Month", `${fmt(peak.profit)} (${peak.month})`],
                    ].map(([k, v]) => (
                      <div key={k} className="row-divider">
                        <span style={{ fontSize: 11, color: C.smoke }}>{k}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 500, color: C.cream }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COSTS ── */}
        {tab === "costs" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Cost Stack by Month</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 14, lineHeight: 1.5 }}>DoorDash commission is the largest single cost at 25%. Building direct orders via Instagram/website is the #1 lever for improving profit over time.</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,127,181,0.1)" />
                  <XAxis dataKey="label" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={40} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: C.smoke }} />
                  <Bar dataKey="produce"  name="Produce"    stackId="a" fill="#3a7a5a" />
                  <Bar dataKey="packaging" name="Packaging" stackId="a" fill="#2a5a40" />
                  <Bar dataKey="platform" name="DoorDash"  stackId="a" fill="#7a5030" />
                  <Bar dataKey="labor"    name="Labor"     stackId="a" fill="#4a5060" />
                  <Bar dataKey="mktg"     name="Marketing" stackId="a" fill={C.gold} />
                  <Bar dataKey="rent"     name="Rent"      stackId="a" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Huntsville Cost Structure</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>Every cost line benefits from Alabama's lower cost of living vs. LA, CA, or NYC.</p>
              <div className="cost-grid">
                {[
                  { n: "DoorDash Commission", p: "25%", note: "Standard rate. Lite plan = 15% but loses discovery placement. Worth the full 25% early on.", c: "#7a5030" },
                  { n: "Produce & Botanicals", p: "17%", note: "Southern farming access + local farmers markets keeps this below national avg of 20%.", c: "#3a7a5a" },
                  { n: "Labor", p: "~10%", note: "AL minimum wage $7.25/hr vs CA $17+/hr. 1 prep person to start, 2 by Month 8.", c: "#4a5060" },
                  { n: "Packaging", p: "7%", note: "Start plastic, move to glass as brand premium is established and volume supports cost.", c: "#2a5a40" },
                  { n: "Marketing", p: "7–9%", note: "Higher months 1-3. No wellness ghost kitchen competition = lower cost to win customers.", c: C.gold },
                  { n: "Kitchen Rent", p: "$0 M1 → $600/mo", note: "Month 1 FREE at Chop & Roll. $600/mo ongoing — 37% cheaper than DTLA.", c: "#1e3a5f" },
                  { n: "Utilities & Misc", p: "~1.5%", note: "Shared kitchen = shared costs. $120/mo estimate.", c: C.smoke },
                  { n: "Net Margin",  p: `${avgM}% avg`, note: "Comfortably above the 10–30% ghost kitchen industry benchmark.", c: C.gold },
                ].map((row, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${row.c}`, paddingLeft: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.cream }}>{row.n}</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: row.c, fontWeight: 600, marginLeft: 8, whiteSpace: "nowrap" }}>{row.p}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.smoke, lineHeight: 1.5 }}>{row.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Direct Orders vs. DoorDash — Profit Impact</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>Shifting even 20% of orders to direct (Instagram DMs, website, text orders) saves thousands per month.</p>
              <div className="three-col">
                {[
                  { title: "100% DoorDash", rev: "$38,000", fee: "$9,500 (25%)", net: "$28,500", note: "Year 1 avg monthly baseline", col: C.clay },
                  { title: "80% Door / 20% Direct", rev: "$38,000", fee: "$7,600", net: "$30,400", note: "+$1,900/mo — worth building early", col: C.blueDim },
                  { title: "60% Door / 40% Direct", rev: "$38,000", fee: "$5,700", net: "$32,300", note: "+$3,800/mo. Loyalty program + SMS list", col: C.blue },
                ].map((s, i) => (
                  <div key={i} className="item-card" style={{ borderLeft: `3px solid ${s.col}` }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: s.col, marginBottom: 10 }}>{s.title}</p>
                    {[["Revenue", s.rev], ["Platform Fees", s.fee], ["You Keep", s.net]].map(([k, v]) => (
                      <div key={k} className="row-divider">
                        <span style={{ fontSize: 11, color: C.smoke }}>{k}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 500, color: C.cream }}>{v}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: C.smoke, marginTop: 8, fontStyle: "italic" }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MATERIALS ── */}
        {tab === "materials" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Per-Order Material Costs — Huntsville</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>
                Southern farming access and Alabama honey production lower ingredient costs vs. national average.
                At $20 avg order → keep total COGS under <strong style={{ color: C.blueLight }}>$5.80/order</strong> (29%).
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Low</th>
                      <th style={{ color: C.blueLight }}>Mid ✓</th>
                      <th>High</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(74,127,181,0.05)" : "transparent" }}>
                        <td>
                          <p style={{ color: C.cream, fontWeight: 500, marginBottom: 2 }}>{r.item}</p>
                          <p style={{ color: C.smoke, fontSize: 10, lineHeight: 1.4 }}>{r.note}</p>
                        </td>
                        <td style={{ color: C.foam, fontFamily: "monospace", verticalAlign: "middle" }}>${r.low.toFixed(2)}</td>
                        <td style={{ color: C.blueLight, fontFamily: "monospace", fontWeight: 600, verticalAlign: "middle" }}>${r.mid.toFixed(2)}</td>
                        <td style={{ color: C.smoke, fontFamily: "monospace", verticalAlign: "middle" }}>${r.high.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "rgba(74,127,181,0.1)", borderTop: "2px solid rgba(74,127,181,0.3)" }}>
                      <td style={{ color: C.cream, fontWeight: 700 }}>TOTAL PER ORDER</td>
                      <td style={{ color: C.foam, fontFamily: "monospace", fontWeight: 700 }}>${materials.reduce((s, r) => s + r.low, 0).toFixed(2)}</td>
                      <td style={{ color: C.blueLight, fontFamily: "monospace", fontWeight: 700 }}>${materials.reduce((s, r) => s + r.mid, 0).toFixed(2)}</td>
                      <td style={{ color: C.smoke, fontFamily: "monospace", fontWeight: 700 }}>${materials.reduce((s, r) => s + r.high, 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Huntsville-Specific Cost Strategies</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>Advantages unique to launching in Alabama vs. a major coastal market.</p>
              <div className="three-col">
                {[
                  { t: "Alabama Honey", d: "Alabama is a top honey-producing state. Source raw honey locally — it costs less AND becomes a brand story (Alabama wildflower honey, etc.).", s: "Month 1" },
                  { t: "Local Farmers Markets", d: "Huntsville Farmers Market (seasonal) and Madison County produce sources. Bulk weekly orders from local farms cut produce 15-25%.", s: "Months 2-3" },
                  { t: "Volume Labels", d: "At 50+ orders/day, bulk label printing drops from $0.22 → $0.10/unit. Local Huntsville print shops often beat online rates.", s: "Month 3+" },
                  { t: "Direct Order Channel", d: "Instagram DMs → Google Form → Venmo/CashApp for pre-orders. Zero commission. Even 10 direct orders/day = $900+/mo saved.", s: "Month 2+" },
                  { t: "Bundle Upsells", d: "Detox bundles and wellness boxes are lower competition in Huntsville. Customers haven't seen premium wellness bundles locally — AOV lift is significant.", s: "Month 1" },
                  { t: "Lock Kitchen Rate", d: "Negotiate a 6-month fixed rate with Chop & Roll once volume is proven. Protects against rent increases as hours and volume grow.", s: "Month 3-4" },
                ].map((s, i) => (
                  <div key={i} className="item-card">
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, marginBottom: 6 }}>{s.t}</p>
                    <p style={{ fontSize: 11, color: C.smoke, marginBottom: 10, lineHeight: 1.5 }}>{s.d}</p>
                    <span style={{ fontSize: 10, color: C.blueLight, background: "rgba(74,127,181,0.15)", padding: "2px 8px", borderRadius: 10 }}>▶ {s.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Product Margins — Huntsville Pricing</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>
                Prices are slightly below LA due to market sensitivity, but lower COGS keeps margins strong.{" "}
                <span style={{ color: C.blueLight }}>Direct orders = full gross margin, no DoorDash cut.</span>
              </p>
              <div className="three-col">
                {products.map((p, i) => (
                  <div key={i} className="item-card">
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, marginBottom: 10, lineHeight: 1.4 }}>{p.name}</p>
                    {[["Menu Price", p.price, C.gold], ["COGS", p.cogs, C.smoke], ["Gross Margin", p.gross, C.blueLight], ["After DoorDash 25%", p.net, C.foam]].map(([k, v, c]) => (
                      <div key={k} className="row-divider">
                        <span style={{ fontSize: 11, color: C.smoke }}>{k}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 500, color: c }}>{v}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: C.smoke, marginTop: 8, fontStyle: "italic" }}>{p.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 4 }}>Huntsville Growth Opportunities</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 14, lineHeight: 1.5 }}>Revenue channels beyond DoorDash that are especially strong in Huntsville's market.</p>
              <div className="three-col">
                {[
                  { t: "Corporate Wellness Orders", d: "NASA, Redstone Arsenal, and dozens of aerospace/tech companies in Huntsville have health-conscious workforces. Weekly office delivery orders are a real channel.", col: C.blue },
                  { t: "Gym & Yoga Studio Wholesale", d: "CrossFit boxes, yoga studios, and wellness centers along the Research Park Blvd corridor. Offer wholesale cold-pressed juice for resale.", col: C.mint },
                  { t: "Seasonal Box Subscriptions", d: "Huntsville's University of Alabama connection = young professional base. Quarterly wellness boxes + subscription model builds reliable recurring revenue.", col: C.gold },
                ].map((item, i) => (
                  <div key={i} className="item-card" style={{ borderTop: `3px solid ${item.col}` }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: item.col, marginBottom: 7 }}>{item.t}</p>
                    <p style={{ fontSize: 11, color: C.smoke, lineHeight: 1.6 }}>{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── KITCHENS ── */}
        {tab === "kitchens" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, color: C.smoke, lineHeight: 1.6 }}>
              Three real, operating commercial kitchens in Huntsville that Jewel can contact this week. All are startup-friendly and suited for ghost kitchen / delivery-first operations.
            </p>
            {kitchens.map((k, i) => (
              <div key={i} className="card" style={{ borderLeft: `4px solid ${k.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: k.color, marginBottom: 4 }}>{k.name}</p>
                    <p style={{ fontSize: 11, color: C.smoke }}>📍 {k.addr}</p>
                  </div>
                  <span style={{ fontSize: 11, background: `${k.color}22`, border: `1px solid ${k.color}55`, color: k.color, padding: "4px 10px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>{k.fit}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[["📞 Phone", k.phone], ["💵 Rate", k.rate], ["🕐 Hours", k.hours]].map(([label, val]) => (
                    <div key={label} style={{ background: `${k.color}10`, borderRadius: 8, padding: "8px 10px" }}>
                      <p style={{ fontSize: 10, color: C.smoke, marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 11, color: C.cream, fontWeight: 500 }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 10, color: C.smoke, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Why this kitchen works for Siloam</p>
                  {k.notes.map((note, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                      <span style={{ color: k.color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 11, color: C.smoke, lineHeight: 1.5 }}>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="card" style={{ background: "rgba(74,127,181,0.06)", border: "1px solid rgba(74,127,181,0.2)" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.blueLight, marginBottom: 8 }}>📋 Permitting Checklist — Alabama / Madison County</p>
              <div className="two-col">
                {[
                  { step: "Alabama Food Handler Permit", detail: "Required for anyone preparing food. Online course available through AL Dept of Public Health. ~$15.", done: false },
                  { step: "Madison County Health Permit", detail: "Commercial kitchen inspection required. Chop & Roll and Host+Ghost handle their own inspections — this may be covered.", done: false },
                  { step: "Alabama Business License", detail: "City of Huntsville business license. ~$50-100 depending on structure. File online.", done: false },
                  { step: "LLC / Business Entity", detail: "File an Alabama LLC ($200 state filing fee). Protects personal assets and required for business banking.", done: false },
                  { step: "Business Bank Account", detail: "Needed for DoorDash merchant payouts. Open at Redstone Federal Credit Union or any local bank.", done: false },
                  { step: "DoorDash Merchant Account", detail: "Sign up at merchant.doordash.com. Takes 5-7 business days for approval. Start this week.", done: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 10, borderBottom: "1px solid rgba(74,127,181,0.1)" }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>☐</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, marginBottom: 3 }}>{item.step}</p>
                      <p style={{ fontSize: 11, color: C.smoke, lineHeight: 1.5 }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MONTHLY ── */}
        {tab === "monthly" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, color: C.smoke }}>
              Full 24-month breakdown. Scenario: <strong style={{ color: C.blueLight }}>{scenario.charAt(0).toUpperCase() + scenario.slice(1)}</strong>
            </p>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Orders/day</th>
                      <th>Revenue</th>
                      <th>Costs</th>
                      <th>Profit</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => [
                      i === 12 && (
                        <tr key={`y2-${i}`}>
                          <td colSpan={6} style={{ padding: "6px 10px", fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", background: "rgba(201,168,76,0.08)", borderTop: "1px solid rgba(201,168,76,0.2)" }}>— Year 2 Begins —</td>
                        </tr>
                      ),
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(74,127,181,0.04)" : "transparent" }}>
                        <td style={{ color: C.cream, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {d.month}
                          {d.free && <span style={{ display: "block", fontSize: 9, color: C.blueLight, background: "rgba(74,127,181,0.15)", padding: "1px 5px", borderRadius: 6, marginTop: 2, width: "fit-content" }}>FREE RENT</span>}
                        </td>
                        <td style={{ color: C.foam, fontFamily: "monospace" }}>{d.orders}</td>
                        <td style={{ color: C.cream, fontFamily: "monospace" }}>{fmt(d.rev)}</td>
                        <td style={{ color: C.smoke, fontFamily: "monospace" }}>{fmt(d.totalCosts)}</td>
                        <td style={{ color: C.blueLight, fontFamily: "monospace", fontWeight: 600 }}>{fmt(d.profit)}</td>
                        <td style={{ color: d.margin > 22 ? C.blueLight : d.margin > 16 ? C.foam : C.smoke, fontFamily: "monospace", fontWeight: 500 }}>{d.margin}%</td>
                      </tr>
                    ])}
                    <tr style={{ background: "rgba(74,127,181,0.1)", borderTop: "2px solid rgba(74,127,181,0.3)" }}>
                      <td style={{ color: C.cream, fontWeight: 700, padding: "11px 10px" }}>2-YEAR TOTAL</td>
                      <td></td>
                      <td style={{ color: C.blueLight, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{fmt(r1 + r2)}</td>
                      <td style={{ color: C.smoke, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{fmt(data.reduce((s, d) => s + d.totalCosts, 0))}</td>
                      <td style={{ color: C.gold, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{fmt(p1 + p2)}</td>
                      <td style={{ color: C.gold, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{avgM}% avg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="three-col">
              {[
                { t: "Month 1 Advantage", d: `Free kitchen rent + ${fmt(data[0].profit)} net profit in Month 1. Best month to begin investor repayment.`, c: C.blueLight },
                { t: "Investor Repayment", d: "At base scenario, $1,000/month repayment is covered from Month 1. Full $6,000 return by Month 6.", c: C.gold },
                { t: "Year 2 Growth", d: `Revenue reaches ${fmt(r2)} in Year 2 (+${Math.round((r2 / r1 - 1) * 100)}% vs Y1) as Huntsville brand recognition builds.`, c: C.foam },
              ].map((n, i) => (
                <div key={i} className="item-card" style={{ borderTop: `3px solid ${n.c}` }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: n.c, marginBottom: 7 }}>{n.t}</p>
                  <p style={{ fontSize: 11, color: C.smoke, lineHeight: 1.6 }}>{n.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 10, color: "rgba(120,140,130,0.35)", textAlign: "center", fontStyle: "italic", lineHeight: 1.6 }}>
            Kitchen rates: Chop & Roll Commissary ($600–$2,000/mo, actual), Host & Ghost Commissary, MAPKitchen — all Huntsville, AL.
            Cost of living: BestPlaces.net (Huntsville = 49% of LA costs). DoorDash market share 67% (2025). Population: US Census / World Population Review 2026. · siloamgreenhouse.com
          </p>
        </div>
      </div>
    </div>
  );
}
