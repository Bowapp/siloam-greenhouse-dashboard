import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const C = {
  forest: "#1a3c2e", sage: "#2d6a4f", mint: "#52b788", foam: "#95d5b2",
  cream: "#f8f4ef", gold: "#c9a84c", clay: "#8b5e3c", smoke: "#7a8a80",
};

function buildData(scenario) {
  const m = scenario === "conservative" ? 0.78 : scenario === "optimistic" ? 1.22 : 1;
  const baseOrders = [30,45,62,78,90,95,88,92,100,95,85,90,105,118,130,142,155,160,152,158,168,162,148,155];
  const months = ["Mar '26","Apr '26","May '26","Jun '26","Jul '26","Aug '26","Sep '26","Oct '26","Nov '26","Dec '26","Jan '27","Feb '27","Mar '27","Apr '27","May '27","Jun '27","Jul '27","Aug '27","Sep '27","Oct '27","Nov '27","Dec '27","Jan '28","Feb '28"];
  return months.map((month, i) => {
    const orders = Math.round(baseOrders[i] * m);
    const aov = i < 12 ? 22 + i * 0.3 : 26 + (i - 12) * 0.35;
    const rev = Math.round(orders * aov * 30.4);
    const produce = Math.round(rev * 0.20);
    const packaging = Math.round(rev * 0.07);
    const rent = i === 0 ? 0 : i < 12 ? 950 : 1100;
    const labor = Math.round(rev * (i < 6 ? 0.14 : i < 12 ? 0.12 : 0.11));
    const uber = Math.round(rev * 0.25);
    const mktg = Math.round(rev * (i < 3 ? 0.08 : 0.05));
    const util = i < 12 ? 180 : 220;
    const permits = i === 0 ? 600 : i === 12 ? 200 : 0;
    const supplies = Math.round(rev * 0.02);
    const costs = produce + packaging + rent + labor + uber + mktg + util + permits + supplies;
    const profit = rev - costs;
    return {
      month, orders, aov: Math.round(aov * 100) / 100, rev,
      produce, packaging, rent, labor, uber, mktg, util, permits, supplies,
      costs, profit, margin: Math.round((profit / rev) * 100), free: i === 0,
    };
  });
}

const fmt = v => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`;

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.forest, border: `1px solid ${C.mint}`, borderRadius: 10, padding: "8px 12px", fontSize: 11, color: C.cream, minWidth: 140 }}>
      <p style={{ color: C.foam, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, margin: "2px 0" }}>
          {e.name}: {e.value > 500 ? fmt(e.value) : e.name.includes("Margin") || e.name.includes("%") ? `${e.value}%` : e.value}
        </p>
      ))}
    </div>
  );
};

const materials = [
  { item: "Organic Produce", low: 2.80, mid: 3.40, high: 4.20, note: "Biggest cost driver — buy bulk/seasonal from local farms to reduce 15-25%" },
  { item: "Botanical Herbs & Adaptogens", low: 0.60, mid: 0.90, high: 1.40, note: "Sea moss, elderberry, ashwagandha, etc." },
  { item: "Sweeteners (honey, agave)", low: 0.20, mid: 0.35, high: 0.55, note: "Raw honey commands premium ingredient cost" },
  { item: "Packaging (bottles, cups)", low: 0.85, mid: 1.10, high: 1.50, note: "Glass vs. plastic — glass adds brand value but costs more" },
  { item: "Labels & Branding", low: 0.15, mid: 0.25, high: 0.40, note: "Cost drops significantly at volume (500+ units/day)" },
  { item: "Insulated Delivery Liners", low: 0.10, mid: 0.15, high: 0.22, note: "Required to maintain cold-press quality on delivery" },
  { item: "Kitchen Consumables", low: 0.08, mid: 0.12, high: 0.18, note: "Gloves, sanitizer — health dept. compliance" },
  { item: "Add-in Upsells (collagen, chia)", low: 0.40, mid: 0.65, high: 1.00, note: "~40% attach rate; customer charged $2-3 extra" },
];

const products = [
  { name: "Cold-Pressed Juice (12oz)", price: "$14", cogs: "$3.50", gross: "75%", net: "48%", note: "Core volume driver" },
  { name: "Smoothie (16oz)", price: "$16", cogs: "$4.20", gross: "74%", net: "47%", note: "High perceived value" },
  { name: "Herbal Syrup / Honey (4oz)", price: "$18", cogs: "$3.80", gross: "79%", net: "52%", note: "Best margin item" },
  { name: "Sea Moss / Wellness Blend", price: "$22", cogs: "$5.50", gross: "75%", net: "48%", note: "High repeat purchase" },
  { name: "Detox Bundle (3 items)", price: "$38", cogs: "$9.50", gross: "75%", net: "48%", note: "Boosts average order value" },
  { name: "Seasonal Wellness Box", price: "$55", cogs: "$14.00", gross: "75%", net: "48%", note: "High ticket, Autumn/Winter" },
];

const TABS = [
  { id: "overview", emoji: "📈", label: "Revenue" },
  { id: "costs", emoji: "📊", label: "Costs" },
  { id: "materials", emoji: "🌿", label: "Materials" },
  { id: "products", emoji: "💚", label: "Products" },
  { id: "monthly", emoji: "📋", label: "Monthly" },
];

export default function App() {
  const [scenario, setScenario] = useState("base");
  const [tab, setTab] = useState("overview");
  const [animKey, setAnimKey] = useState(0);

  const data = buildData(scenario);
  const y1 = data.slice(0, 12), y2 = data.slice(12, 24);
  const r1 = y1.reduce((s, d) => s + d.rev, 0);
  const p1 = y1.reduce((s, d) => s + d.profit, 0);
  const r2 = y2.reduce((s, d) => s + d.rev, 0);
  const p2 = y2.reduce((s, d) => s + d.profit, 0);
  const avgM = Math.round(data.reduce((s, d) => s + d.margin, 0) / data.length);

  useEffect(() => { setAnimKey(k => k + 1); }, [scenario]);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { background: #081510; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-thumb { background: #2d6a4f; border-radius: 3px; }
    @keyframes fu { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .fu { animation: fu 0.4s ease forwards; }

    .wrap { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
    @media(min-width: 600px) { .wrap { padding: 0 28px; } }
    @media(min-width: 900px) { .wrap { padding: 0 32px; } }

    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media(min-width: 600px) { .kpi-grid { grid-template-columns: repeat(3,1fr); } }
    @media(min-width: 900px) { .kpi-grid { grid-template-columns: repeat(5,1fr); } }

    .two-col { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media(min-width: 700px) { .two-col { grid-template-columns: 1fr 1fr; } }

    .three-col { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media(min-width: 500px) { .three-col { grid-template-columns: 1fr 1fr; } }
    @media(min-width: 900px) { .three-col { grid-template-columns: 1fr 1fr 1fr; } }

    .cost-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media(min-width: 650px) { .cost-grid { grid-template-columns: 1fr 1fr; } }

    .tab-bar { display: flex; gap: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; border-bottom: 1px solid rgba(149,213,178,0.15); }
    .tab-bar::-webkit-scrollbar { display: none; }
    .tab-btn { flex-shrink: 0; padding: 10px 14px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #7a8a80; font-size: 13px; cursor: pointer; border-radius: 7px 7px 0 0; margin-bottom: -1px; transition: all 0.2s; display: flex; align-items: center; gap: 5px; white-space: nowrap; font-family: inherit; }
    .tab-btn.active { background: rgba(82,183,136,0.18); border-bottom-color: #52b788; color: #f8f4ef; font-weight: 600; }
    .tab-btn:hover { background: rgba(82,183,136,0.1); }

    .sc-btn { padding: 6px 13px; border-radius: 20px; border: 1px solid rgba(149,213,178,0.25); background: transparent; color: #7a8a80; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .sc-btn.active { border-color: #52b788; background: rgba(82,183,136,0.22); color: #52b788; font-weight: 600; }

    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(149,213,178,0.12); border-radius: 14px; padding: 16px; }
    @media(min-width:600px) { .card { padding: 20px 22px; } }

    .kpi-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(149,213,178,0.14); border-radius: 12px; padding: 12px 14px; transition: transform 0.2s; }
    .kpi-card:hover { transform: translateY(-2px); }

    .item-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(149,213,178,0.1); border-radius: 12px; padding: 14px 15px; }

    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { border-collapse: collapse; width: 100%; min-width: 400px; }
    th { text-align: left; padding: 9px 10px; font-size: 10px; color: #95d5b2; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 2px solid rgba(149,213,178,0.2); font-weight: 600; white-space: nowrap; }
    td { padding: 9px 10px; font-size: 12px; vertical-align: top; }

    .row-divider { border-bottom: 1px solid rgba(149,213,178,0.08); padding: 6px 0; display: flex; justify-content: space-between; align-items: center; }

    /* Mobile: sticky bottom nav */
    @media(max-width: 599px) {
      .tab-bar-outer { position: fixed; bottom: 0; left: 0; right: 0; background: #0f2419; border-top: 1px solid rgba(149,213,178,0.15); z-index: 100; padding: 4px 8px 10px; }
      .tab-bar { border-bottom: none; justify-content: space-around; }
      .tab-btn { flex-direction: column; gap: 2px; padding: 6px 10px; font-size: 10px; border-bottom: none !important; border-radius: 8px; }
      .tab-emoji { font-size: 20px; }
      .tab-btn.active { background: rgba(82,183,136,0.2); }
      .content-pad { padding-bottom: 90px; }
    }
    @media(min-width: 600px) {
      .tab-bar-outer { padding: 0 28px; margin-top: 20px; }
      .tab-emoji { display: none; }
      .content-pad { padding-bottom: 0; }
    }
    @media(min-width: 900px) {
      .tab-bar-outer { padding: 0 32px; }
    }
  `;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.forest} 0%, #0f2419 40%, #081510 100%)`, color: C.cream, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{ background: "rgba(45,106,79,0.3)", borderBottom: "1px solid rgba(82,183,136,0.2)", padding: "18px 0 14px" }}>
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 30 }}>🌿</span>
              <div>
                <p style={{ color: C.foam, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, marginBottom: 3 }}>Ghost Kitchen · Financial Model</p>
                <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.cream, lineHeight: 1.1 }}>Siloam Greenhouse</h1>
                <p style={{ color: C.foam, fontSize: 11, fontStyle: "italic", marginTop: 2 }}>2-Year Uber Eats Projection · Downtown LA</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 9, color: C.smoke, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Scenario</p>
              <div style={{ display: "flex", gap: 6 }}>
                {["conservative","base","optimistic"].map(s => (
                  <button key={s} className={`sc-btn${scenario===s?" active":""}`} onClick={() => setScenario(s)}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
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
            { l: "Year 1 Revenue", v: fmt(r1), s: "gross", c: C.foam, d: "0s" },
            { l: "Year 1 Net Profit", v: fmt(p1), s: "after all costs", c: C.mint, d: "0.06s" },
            { l: "Year 2 Revenue", v: fmt(r2), s: `+${Math.round((r2/r1-1)*100)}% YoY`, c: C.gold, d: "0.12s" },
            { l: "Year 2 Net Profit", v: fmt(p2), s: "after all costs", c: "#7fc97f", d: "0.18s" },
            { l: "Avg Net Margin", v: avgM+"%", s: "ghost kitchen model", c: C.cream, d: "0.24s" },
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
            <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
              <span className="tab-emoji">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="wrap content-pad" style={{ marginTop: 20, paddingBottom: 40 }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 14 }}>Revenue vs. Net Profit (24 Months)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.mint} stopOpacity={0.35}/><stop offset="95%" stopColor={C.mint} stopOpacity={0}/></linearGradient>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={0.35}/><stop offset="95%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} width={40} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.smoke }} />
                  <Area type="monotone" dataKey="rev" name="Gross Revenue" stroke={C.mint} fill="url(#rg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke={C.gold} fill="url(#pg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 14 }}>Daily Orders & Avg Order Value</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis yAxisId="o" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} width={30} />
                  <YAxis yAxisId="a" orientation="right" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`$${v}`} width={34} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.smoke }} />
                  <Line yAxisId="o" type="monotone" dataKey="orders" name="Daily Orders" stroke={C.foam} strokeWidth={2} dot={false} />
                  <Line yAxisId="a" type="monotone" dataKey="aov" name="Avg Order ($)" stroke={C.gold} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Net Profit Margin % by Month</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 14, lineHeight: 1.5 }}>Ghost kitchen industry avg: 10–30%. Wellness/juice focus outperforms due to premium pricing and low overhead.</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,35]} width={36} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="margin" name="Net Margin %" radius={[4,4,0,0]}>
                    {data.map((d,i) => <rect key={i} fill={d.margin>20?C.mint:d.margin>15?C.sage:"#4a6a55"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="two-col">
              {[[y1,r1,p1,"Year 1 Summary",C.mint],[y2,r2,p2,"Year 2 Summary",C.gold]].map(([yr,r,p,lbl,c]) => {
                const peak = yr.reduce((a,b)=>a.profit>b.profit?a:b);
                return (
                  <div key={lbl} className="card">
                    <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: c, marginBottom: 12 }}>{lbl}</p>
                    {[["Total Revenue",fmt(r)],["Total Net Profit",fmt(p)],["Avg Net Margin",Math.round((p/r)*100)+"%"],["Total Costs",fmt(yr.reduce((s,d)=>s+d.costs,0))],["Peak Month",`${fmt(peak.profit)} (${peak.month})`]].map(([k,v])=>(
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

        {/* COSTS */}
        {tab === "costs" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Cost Stack by Month</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 14, lineHeight: 1.5 }}>Uber Eats commission is the largest single cost at 25% of revenue. Building direct orders is the #1 lever for improving profit.</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} width={40} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: C.smoke }} />
                  <Bar dataKey="produce" name="Produce" stackId="a" fill="#4a9c6e" />
                  <Bar dataKey="packaging" name="Packaging" stackId="a" fill="#357a55" />
                  <Bar dataKey="uber" name="Uber Fees" stackId="a" fill="#8b5e3c" />
                  <Bar dataKey="labor" name="Labor" stackId="a" fill="#6b7280" />
                  <Bar dataKey="mktg" name="Marketing" stackId="a" fill={C.gold} />
                  <Bar dataKey="rent" name="Rent" stackId="a" fill="#2a4a35" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Cost Structure as % of Revenue</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>Real benchmarks for ghost kitchens running wellness/juice concepts in Los Angeles.</p>
              <div className="cost-grid">
                {[
                  { n: "Uber Eats Commission", p: "25%", note: "Lite plan = 15% but loses featured placement. Build direct orders over time.", c: C.clay },
                  { n: "Produce & Botanicals", p: "20%", note: "Biggest COGS line. Bulk buying from local farms can reduce to 16-17%.", c: "#4a9c6e" },
                  { n: "Labor", p: "11–14%", note: "1 prep person scales to 2 by Month 8-10. No front-of-house = huge saving.", c: "#6b7280" },
                  { n: "Packaging", p: "7%", note: "Glass bottles = premium brand signal. Volume buying drops to ~5%.", c: "#357a55" },
                  { n: "Marketing", p: "5–8%", note: "Heavier months 1-3 for visibility. Organic reviews reduce cost over time.", c: C.gold },
                  { n: "Kitchen Rent", p: "$0 M1 → $950–$1,100", note: "Month 1 FREE — a major early cash flow advantage.", c: "#2a4a35" },
                  { n: "Utilities & Misc", p: "~1.5%", note: "Shared kitchen = shared utility costs. Very manageable.", c: C.smoke },
                  { n: "Net Margin", p: "15–26%", note: "Well above restaurant avg of 3-5%. Beverage model drives this.", c: C.gold },
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
          </div>
        )}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Per-Order Material Costs</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>
                Industry standard: keep total COGS under 28–32% of menu price.
                At $22 avg order → target under <strong style={{ color: C.mint }}>$6.30/order</strong>.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Low</th>
                      <th style={{ color: C.mint }}>Mid ✓</th>
                      <th>High</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((r, i) => (
                      <tr key={i} style={{ background: i%2===0?"rgba(255,255,255,0.025)":"transparent" }}>
                        <td>
                          <p style={{ color: C.cream, fontWeight: 500, marginBottom: 2 }}>{r.item}</p>
                          <p style={{ color: C.smoke, fontSize: 10, lineHeight: 1.4 }}>{r.note}</p>
                        </td>
                        <td style={{ color: C.foam, fontFamily: "monospace", verticalAlign: "middle" }}>${r.low.toFixed(2)}</td>
                        <td style={{ color: C.mint, fontFamily: "monospace", fontWeight: 600, verticalAlign: "middle" }}>${r.mid.toFixed(2)}</td>
                        <td style={{ color: C.smoke, fontFamily: "monospace", verticalAlign: "middle" }}>${r.high.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "rgba(82,183,136,0.1)", borderTop: "2px solid rgba(149,213,178,0.3)" }}>
                      <td style={{ color: C.cream, fontWeight: 700 }}>TOTAL PER ORDER</td>
                      <td style={{ color: C.foam, fontFamily: "monospace", fontWeight: 700 }}>${materials.reduce((s,r)=>s+r.low,0).toFixed(2)}</td>
                      <td style={{ color: C.mint, fontFamily: "monospace", fontWeight: 700 }}>${materials.reduce((s,r)=>s+r.mid,0).toFixed(2)}</td>
                      <td style={{ color: C.smoke, fontFamily: "monospace", fontWeight: 700 }}>${materials.reduce((s,r)=>s+r.high,0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Cost Reduction Strategies</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>How Siloam Greenhouse can protect margins as it scales.</p>
              <div className="three-col">
                {[
                  { t: "Bulk Produce", d: "Partner with DTLA farmers market or farm co-op. Weekly volume commitment drops produce cost 15-25%.", s: "Months 3-4" },
                  { t: "Volume Labels", d: "At 60+ orders/day, bulk label printing drops per-unit cost from $0.25 → $0.10.", s: "Month 3+" },
                  { t: "Direct Orders", d: "Push website orders via Instagram/SMS. 0% commission vs. 25% on Uber. Saves $5-6 per order.", s: "Month 2+" },
                  { t: "Seasonal Menus", d: "Using seasonal produce (already Siloam's brand!) cuts ingredient costs in peak growing seasons.", s: "Ongoing" },
                  { t: "Upsell Add-ins", d: "Collagen, chia add-ons cost $0.65 but charge $2-3 to customer. ~40% attach = 15% revenue lift.", s: "Month 1" },
                  { t: "Lock Kitchen Rate", d: "Negotiate 6-12 month lease at fixed rate. Avoids rent escalation as volume and hours grow.", s: "Month 4-6" },
                ].map((s, i) => (
                  <div key={i} className="item-card">
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, marginBottom: 6 }}>{s.t}</p>
                    <p style={{ fontSize: 11, color: C.smoke, marginBottom: 10, lineHeight: 1.5 }}>{s.d}</p>
                    <span style={{ fontSize: 10, color: C.mint, background: "rgba(82,183,136,0.15)", padding: "2px 8px", borderRadius: 10 }}>▶ {s.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Margin by Product Type</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>
                "After Uber" = what Siloam keeps after the 25% delivery fee.{" "}
                <span style={{ color: C.mint }}>Direct orders = full gross margin retained.</span>
              </p>
              <div className="three-col">
                {products.map((p, i) => (
                  <div key={i} className="item-card">
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, marginBottom: 10, lineHeight: 1.4 }}>{p.name}</p>
                    {[["Menu Price",p.price,C.gold],["COGS",p.cogs,C.smoke],["Gross Margin",p.gross,C.mint],["After Uber 25%",p.net,C.foam]].map(([k,v,c]) => (
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
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.foam, marginBottom: 4 }}>Direct Orders vs. Uber Eats — Profit Impact</p>
              <p style={{ fontSize: 11, color: C.smoke, marginBottom: 16, lineHeight: 1.5 }}>Shifting even 20% of orders to direct channels has a big effect on monthly profit.</p>
              <div className="three-col">
                {[
                  { title: "100% Uber Eats", rev: "$52,000", fee: "$13,000 (25%)", net: "$39,000", note: "Year 1 avg monthly baseline", col: C.clay },
                  { title: "80% Uber / 20% Direct", rev: "$52,000", fee: "$10,400", net: "$41,600", note: "+$2,600/mo from a small direct channel", col: C.sage },
                  { title: "60% Uber / 40% Direct", rev: "$52,000", fee: "$7,800", net: "$44,200", note: "+$5,200/mo. Realistic by Month 10-12", col: C.mint },
                ].map((s, i) => (
                  <div key={i} className="item-card" style={{ borderLeft: `3px solid ${s.col}` }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: s.col, marginBottom: 10 }}>{s.title}</p>
                    {[["Revenue",s.rev],["Platform Fees",s.fee],["You Keep",s.net]].map(([k,v]) => (
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

        {/* MONTHLY */}
        {tab === "monthly" && (
          <div key={animKey} className="fu" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, color: C.smoke }}>
              Full 24-month breakdown. Scenario: <strong style={{ color: C.mint }}>{scenario.charAt(0).toUpperCase()+scenario.slice(1)}</strong>
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
                      <tr key={i} style={{ background: i%2===0?"rgba(255,255,255,0.025)":"transparent" }}>
                        <td style={{ color: C.cream, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {d.month}
                          {d.free && <span style={{ display: "block", fontSize: 9, color: C.mint, background: "rgba(82,183,136,0.15)", padding: "1px 5px", borderRadius: 6, marginTop: 2, width: "fit-content" }}>FREE RENT</span>}
                        </td>
                        <td style={{ color: C.foam, fontFamily: "monospace" }}>{d.orders}</td>
                        <td style={{ color: C.cream, fontFamily: "monospace" }}>{fmt(d.rev)}</td>
                        <td style={{ color: C.smoke, fontFamily: "monospace" }}>{fmt(d.costs)}</td>
                        <td style={{ color: C.mint, fontFamily: "monospace", fontWeight: 600 }}>{fmt(d.profit)}</td>
                        <td style={{ color: d.margin>20?C.mint:d.margin>15?C.foam:C.smoke, fontFamily: "monospace", fontWeight: 500 }}>{d.margin}%</td>
                      </tr>
                    ])}
                    <tr style={{ background: "rgba(82,183,136,0.1)", borderTop: "2px solid rgba(149,213,178,0.3)" }}>
                      <td style={{ color: C.cream, fontWeight: 700, padding: "11px 10px" }}>2-YEAR TOTAL</td>
                      <td></td>
                      <td style={{ color: C.mint, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{fmt(r1+r2)}</td>
                      <td style={{ color: C.smoke, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{fmt(data.reduce((s,d)=>s+d.costs,0))}</td>
                      <td style={{ color: C.gold, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{fmt(p1+p2)}</td>
                      <td style={{ color: C.gold, fontFamily: "monospace", fontWeight: 700, padding: "11px 10px" }}>{avgM}% avg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="three-col">
              {[
                { t: "Month 1 Advantage", d: `Free kitchen rent + ${fmt(y1[0].profit)} net profit. Optimal month to start investor repayment.`, c: C.mint },
                { t: "Investor Repayment", d: "At base scenario, $1,000/month is comfortably covered from Month 1. Full $6,000 return by Month 6.", c: C.gold },
                { t: "Year 2 Growth", d: `Revenue grows to ${fmt(r2)} in Year 2 (+${Math.round((r2/r1-1)*100)}% vs Y1). Ghost kitchen + direct orders drive the jump.`, c: C.foam },
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
          <p style={{ fontSize: 10, color: "rgba(120,140,130,0.4)", textAlign: "center", fontStyle: "italic", lineHeight: 1.6 }}>
            Projections based on industry benchmarks: ghost kitchen margins 10–30%, cold-pressed juice COGS 28–32%,
            Uber Eats standard commission 25%, DTLA shared kitchen rent $950–$1,100/mo. · siloamgreenhouse.com
          </p>
        </div>
      </div>
    </div>
  );
}
