import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const C = {
  forest: "#1a3c2e", sage: "#2d6a4f", mint: "#52b788", foam: "#95d5b2",
  cream: "#f8f4ef", parchment: "#ede8df", gold: "#c9a84c", clay: "#8b5e3c",
  charcoal: "#2a2a2a", smoke: "#7a8a80",
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
    return { month, orders, aov: Math.round(aov*100)/100, rev, produce, packaging, rent, labor, uber, mktg, util, permits, supplies, costs, profit, margin: Math.round((profit/rev)*100), free: i===0 };
  });
}

const fmt = v => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`;

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.forest, border: `1px solid ${C.mint}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.cream, minWidth: 160 }}>
      <p style={{ fontFamily: "Georgia, serif", color: C.foam, marginBottom: 6, fontWeight: 600, margin: "0 0 6px" }}>{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color, margin: "2px 0" }}>{e.name}: {e.value > 500 ? fmt(e.value) : e.name.includes("Margin") || e.name.includes("%") ? `${e.value}%` : e.value}</p>)}
    </div>
  );
};

const materials = [
  { item: "Organic Produce (fruits, veg, herbs)", low: 2.80, mid: 3.40, high: 4.20, note: "Core cost driver — buy bulk/seasonal from local farms" },
  { item: "Botanical Herbs & Adaptogens", low: 0.60, mid: 0.90, high: 1.40, note: "Sea moss, elderberry, ashwagandha, etc." },
  { item: "Sweeteners (raw honey, agave, cane)", low: 0.20, mid: 0.35, high: 0.55, note: "Raw honey commands premium ingredient cost" },
  { item: "Packaging (bottles, cups, lids)", low: 0.85, mid: 1.10, high: 1.50, note: "Glass vs. plastic — glass adds brand value" },
  { item: "Labels & Custom Branding", low: 0.15, mid: 0.25, high: 0.40, note: "Drops significantly at volume (500+ units/day)" },
  { item: "Insulated Liners / Delivery Quality", low: 0.10, mid: 0.15, high: 0.22, note: "Required to maintain cold-press quality on delivery" },
  { item: "Kitchen Consumables", low: 0.08, mid: 0.12, high: 0.18, note: "Gloves, sanitizer — health dept. compliance" },
  { item: "Add-in Upsells (collagen, protein, CBD)", low: 0.40, mid: 0.65, high: 1.00, note: "~40% attach rate; charges $2-3 to customer" },
];

const products = [
  { name: "Cold-Pressed Juice (12oz)", price: "$14", cogs: "$3.50", gross: "75%", net: "48%", note: "Core volume driver" },
  { name: "Smoothie (16oz)", price: "$16", cogs: "$4.20", gross: "74%", net: "47%", note: "High perceived value" },
  { name: "Herbal Syrup / Honey (4oz)", price: "$18", cogs: "$3.80", gross: "79%", net: "52%", note: "Best margin item" },
  { name: "Sea Moss / Wellness Blend", price: "$22", cogs: "$5.50", gross: "75%", net: "48%", note: "High repeat purchase" },
  { name: "Detox Bundle (3 items)", price: "$38", cogs: "$9.50", gross: "75%", net: "48%", note: "Boosts AOV significantly" },
  { name: "Seasonal Wellness Box", price: "$55", cogs: "$14.00", gross: "75%", net: "48%", note: "High ticket, Autumn/Winter" },
];

export default function App() {
  const [scenario, setScenario] = useState("base");
  const [tab, setTab] = useState("overview");
  const [key, setKey] = useState(0);
  const data = buildData(scenario);
  const y1 = data.slice(0, 12), y2 = data.slice(12, 24);
  const r1 = y1.reduce((s,d)=>s+d.rev,0), p1 = y1.reduce((s,d)=>s+d.profit,0);
  const r2 = y2.reduce((s,d)=>s+d.rev,0), p2 = y2.reduce((s,d)=>s+d.profit,0);
  const avgM = Math.round(data.reduce((s,d)=>s+d.margin,0)/data.length);

  useEffect(() => { setKey(k => k+1); }, [scenario]);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.forest} 0%, #0f2419 40%, #081510 100%)`, color: C.cream, fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: "0 0 60px" }}>
      <style>{`
        *{box-sizing:border-box;} ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:${C.sage};border-radius:3px;}
        .tb{transition:all 0.2s;} .tb:hover{background:rgba(82,183,136,0.15)!important;}
        .sc{transition:all 0.2s;cursor:pointer;} .sc:hover{opacity:0.85;}
        .kc{transition:transform 0.2s;} .kc:hover{transform:translateY(-2px);}
        @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        .fu{animation:fu 0.5s ease forwards;}
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(45,106,79,0.3)", borderBottom: "1px solid rgba(82,183,136,0.2)", padding: "24px 36px 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <p style={{ color: C.foam, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 5px", fontWeight: 500 }}>Ghost Kitchen Financial Model</p>
            <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 28, fontWeight: 700, margin: "0 0 3px", letterSpacing: "-0.01em" }}>Siloam Greenhouse</h1>
            <p style={{ color: C.foam, fontSize: 12, margin: 0, fontStyle: "italic" }}>2-Year Uber Eats Scaling Projection · Downtown Los Angeles, CA</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: C.smoke, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 2 }}>Scenario:</span>
            {["conservative","base","optimistic"].map(s => (
              <button key={s} className="sc" onClick={() => setScenario(s)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${scenario===s?C.mint:"rgba(149,213,178,0.25)"}`, background: scenario===s?"rgba(82,183,136,0.22)":"transparent", color: scenario===s?C.mint:C.smoke, fontSize: 11, fontWeight: scenario===s?600:400, cursor: "pointer" }}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div key={key} style={{ maxWidth: 1080, margin: "24px auto 0", padding: "0 36px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {[
            { l: "Year 1 Revenue", v: fmt(r1), s: "gross", c: C.foam, d: "0s" },
            { l: "Year 1 Net Profit", v: fmt(p1), s: "after all costs", c: C.mint, d: "0.07s" },
            { l: "Year 2 Revenue", v: fmt(r2), s: `+${Math.round((r2/r1-1)*100)}% YoY`, c: C.gold, d: "0.14s" },
            { l: "Year 2 Net Profit", v: fmt(p2), s: "after all costs", c: "#7fc97f", d: "0.21s" },
            { l: "Avg Net Margin", v: avgM+"%", s: "ghost kitchen model", c: C.cream, d: "0.28s" },
          ].map((k,i) => (
            <div key={i} className="kc fu" style={{ animationDelay: k.d, opacity: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.14)", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 9, color: C.smoke, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 5px" }}>{k.l}</p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: k.c, margin: "0 0 3px" }}>{k.v}</p>
              <p style={{ fontSize: 10, color: C.smoke, margin: 0 }}>{k.s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 1080, margin: "20px auto 0", padding: "0 36px" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(149,213,178,0.15)" }}>
          {[["overview","📈 Revenue & Profit"],["costs","📊 Cost Breakdown"],["materials","🌿 Materials & COGS"],["products","💚 Product Margins"],["monthly","📋 Monthly Detail"]].map(([id,lbl]) => (
            <button key={id} className="tb" onClick={() => setTab(id)} style={{ padding: "9px 16px", background: tab===id?"rgba(82,183,136,0.18)":"transparent", border: "none", borderBottom: tab===id?`2px solid ${C.mint}`:"2px solid transparent", color: tab===id?C.cream:C.smoke, fontSize: 12, fontWeight: tab===id?600:400, cursor: "pointer", borderRadius: "7px 7px 0 0", marginBottom: -1, whiteSpace: "nowrap" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "20px auto 0", padding: "0 36px" }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div key={key} className="fu" style={{ opacity: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "18px 18px 10px" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 14px", color: C.foam }}>Revenue vs. Net Profit (24 Months)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.mint} stopOpacity={0.35}/><stop offset="95%" stopColor={C.mint} stopOpacity={0}/></linearGradient>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={0.35}/><stop offset="95%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.smoke }} />
                    <Area type="monotone" dataKey="rev" name="Gross Revenue" stroke={C.mint} fill="url(#rg)" strokeWidth={2} />
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke={C.gold} fill="url(#pg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "18px 18px 10px" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 14px", color: C.foam }}>Daily Orders & Avg Order Value</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={3} />
                    <YAxis yAxisId="o" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} />
                    <YAxis yAxisId="a" orientation="right" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`$${v}`} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.smoke }} />
                    <Line yAxisId="o" type="monotone" dataKey="orders" name="Daily Orders" stroke={C.foam} strokeWidth={2} dot={false} />
                    <Line yAxisId="a" type="monotone" dataKey="aov" name="Avg Order ($)" stroke={C.gold} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "18px 18px 10px", marginBottom: 18 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Net Profit Margin % by Month</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 14px" }}>Ghost kitchen industry avg: 10–30%. Wellness/juice focus outperforms due to premium pricing + low labor overhead.</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,35]} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="margin" name="Net Margin %" radius={[4,4,0,0]}>
                    {data.map((d,i) => <rect key={i} fill={d.margin>20?C.mint:d.margin>15?C.sage:"#4a6a55"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {[[y1,r1,p1,"Year 1 Summary",C.mint],[y2,r2,p2,"Year 2 Summary",C.gold]].map(([yr,r,p,lbl,c]) => {
                const peak = yr.reduce((a,b)=>a.profit>b.profit?a:b);
                return (
                  <div key={lbl} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.14)", borderRadius: 14, padding: "18px 20px" }}>
                    <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 12px", color: c }}>{lbl}</h3>
                    {[["Total Gross Revenue",fmt(r)],["Total Net Profit",fmt(p)],["Avg Net Margin",Math.round((p/r)*100)+"%"],["Total Costs Paid Out",fmt(yr.reduce((s,d)=>s+d.costs,0))],["Peak Month Profit",`${fmt(peak.profit)} (${peak.month})`]].map(([k,v])=>(
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(149,213,178,0.08)", padding: "7px 0" }}>
                        <span style={{ fontSize: 12, color: C.smoke }}>{k}</span>
                        <span style={{ fontSize: 12, color: C.cream, fontWeight: 500, fontFamily: "monospace" }}>{v}</span>
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
          <div key={key} className="fu" style={{ opacity: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "18px 18px 10px", marginBottom: 18 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Cost Stack by Month</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 14px" }}>Uber Eats commission is the largest single line item at 25% of revenue — the key lever for improving profit over time is building direct order channels.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(149,213,178,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: C.smoke, fontSize: 9 }} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: C.smoke }} />
                  <Bar dataKey="produce" name="Produce / Botanicals" stackId="a" fill="#4a9c6e" />
                  <Bar dataKey="packaging" name="Packaging" stackId="a" fill="#357a55" />
                  <Bar dataKey="uber" name="Uber Eats Fees" stackId="a" fill="#8b5e3c" />
                  <Bar dataKey="labor" name="Labor" stackId="a" fill="#6b7280" />
                  <Bar dataKey="mktg" name="Marketing" stackId="a" fill={C.gold} />
                  <Bar dataKey="rent" name="Kitchen Rent" stackId="a" fill="#2a4a35" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "20px 22px" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Cost Structure as % of Revenue</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 18px" }}>Real industry benchmarks for ghost kitchens operating wellness/juice concepts in Los Angeles.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { n: "Uber Eats Commission", p: "25%", note: "Standard plan. Lite plan drops to 15% but loses featured placement. Build direct orders over time.", c: C.clay },
                  { n: "Produce & Botanicals", p: "20%", note: "Biggest COGS line. Buying bulk from local DTLA farmers markets can reduce to 16-17%.", c: "#4a9c6e" },
                  { n: "Labor", p: "11–14%", note: "1 prep person scales to 2 by Month 8-10. Ghost kitchen eliminates front-of-house entirely.", c: "#6b7280" },
                  { n: "Packaging", p: "7%", note: "Glass bottles = premium brand signal + higher cost. Volume buying drops this to ~5%.", c: "#357a55" },
                  { n: "Marketing", p: "5–8%", note: "Heavier in months 1-3 for platform visibility. Organic reviews + social reduce this over time.", c: C.gold },
                  { n: "Kitchen Rent", p: "$0 M1 → $950–$1,100/mo", note: "Month 1 FREE is a major early cash flow advantage — should be used to accelerate investor repayment.", c: "#2a4a35" },
                  { n: "Utilities & Misc", p: "~1.5%", note: "Shared kitchen = shared utility costs. Very low in this model.", c: C.smoke },
                  { n: "Net Margin After All Costs", p: "15–26%", note: "Well above full-service restaurant avg of 3-5%. Beverage-focused models consistently outperform.", c: C.gold },
                ].map((row,i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${row.c}`, paddingLeft: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.cream }}>{row.n}</span>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: row.c, fontWeight: 600, marginLeft: 8, whiteSpace: "nowrap" }}>{row.p}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.smoke, margin: 0, lineHeight: 1.5 }}>{row.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div key={key} className="fu" style={{ opacity: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Per-Order Material Costs</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 18px" }}>
                Industry standard for cold-pressed juice & botanical wellness: keep total COGS under 28–32% of menu price.
                At a $22 avg order, target: under <strong style={{ color: C.mint }}>$6.30/order</strong> total materials.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{["Ingredient / Supply","Low","Mid (Target)","High","Notes"].map(h=>(
                      <th key={h} style={{ textAlign: "left", padding: "9px 10px", fontSize: 10, color: C.foam, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "2px solid rgba(149,213,178,0.2)", fontWeight: 600 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {materials.map((r,i) => (
                      <tr key={i} style={{ background: i%2===0?"rgba(255,255,255,0.025)":"transparent" }}>
                        <td style={{ padding: "10px 10px", fontSize: 12, color: C.cream, fontWeight: 500 }}>{r.item}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: C.foam }}>${r.low.toFixed(2)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontFamily: "monospace", color: C.mint, fontWeight: 600 }}>${r.mid.toFixed(2)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: C.smoke }}>${r.high.toFixed(2)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 11, color: C.smoke, maxWidth: 220, lineHeight: 1.5 }}>{r.note}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "rgba(82,183,136,0.1)", borderTop: "2px solid rgba(149,213,178,0.3)" }}>
                      <td style={{ padding: "11px 10px", fontSize: 13, color: C.cream, fontWeight: 700 }}>TOTAL PER ORDER</td>
                      <td style={{ padding: "11px 10px", fontSize: 14, fontFamily: "monospace", color: C.foam, fontWeight: 700 }}>${materials.reduce((s,r)=>s+r.low,0).toFixed(2)}</td>
                      <td style={{ padding: "11px 10px", fontSize: 14, fontFamily: "monospace", color: C.mint, fontWeight: 700 }}>${materials.reduce((s,r)=>s+r.mid,0).toFixed(2)}</td>
                      <td style={{ padding: "11px 10px", fontSize: 14, fontFamily: "monospace", color: C.smoke, fontWeight: 700 }}>${materials.reduce((s,r)=>s+r.high,0).toFixed(2)}</td>
                      <td style={{ padding: "11px 10px", fontSize: 11, color: C.mint }}>Target under $6.30 (~28% of $22 AOV)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "20px 22px" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Key Cost Reduction Strategies</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 16px" }}>How Siloam Greenhouse can protect margins as it scales.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { t: "Bulk Produce Buying", d: "Partner with 1-2 DTLA farmers markets or a local farm co-op. Committing to weekly volume drops produce cost by 15-25%.", s: "Months 3-4" },
                  { t: "Custom Label Volume", d: "At 60+ orders/day, bulk label printing drops per-unit label cost from $0.25 → $0.10.", s: "Month 3+" },
                  { t: "Direct Order Channel", d: "Push website orders via Instagram/SMS. 0% commission vs. 25% on Uber. Every direct order saves $5-6 vs. platform.", s: "Month 2+" },
                  { t: "Seasonal Menu Rotation", d: "Using seasonal produce (already Siloam's brand!) cuts ingredient costs naturally in peak growing seasons.", s: "Ongoing" },
                  { t: "Upsell Add-ins", d: "Protein, collagen, CBD add-ons cost $0.40-0.65 but charge $2-3 to customer. ~40% attach rate = 15% revenue lift.", s: "Month 1" },
                  { t: "Ghost Kitchen Capacity Deals", d: "Negotiate 6-12 month kitchen lease at fixed rate. Avoids rent escalation as volume and hours grow.", s: "Month 4-6" },
                ].map((s,i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(149,213,178,0.1)", borderRadius: 10, padding: "14px 15px" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, margin: "0 0 6px" }}>{s.t}</p>
                    <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 8px", lineHeight: 1.5 }}>{s.d}</p>
                    <span style={{ fontSize: 10, color: C.mint, background: "rgba(82,183,136,0.15)", padding: "2px 8px", borderRadius: 10 }}>▶ {s.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div key={key} className="fu" style={{ opacity: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "20px 22px", marginBottom: 18 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Margin by Product Type</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 18px" }}>
                "Net after Uber" = gross margin minus the 25% Uber Eats platform fee. This is what Siloam actually keeps after delivery.
                <span style={{ color: C.mint }}> Building direct orders closes this gap.</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
                {products.map((p,i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(149,213,178,0.1)", borderRadius: 12, padding: "16px" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.cream, margin: "0 0 12px", lineHeight: 1.4 }}>{p.name}</p>
                    {[["Menu Price",p.price,C.gold],["COGS",p.cogs,C.smoke],["Gross Margin",p.gross,C.mint],["After Uber 25%",p.net,C.foam]].map(([k,v,c])=>(
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(149,213,178,0.07)" }}>
                        <span style={{ fontSize: 11, color: C.smoke }}>{k}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: c, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: C.smoke, margin: "10px 0 0", fontStyle: "italic" }}>{p.note}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(149,213,178,0.12)", borderRadius: 14, padding: "20px 22px" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 14, margin: "0 0 4px", color: C.foam }}>Platform Fee Impact: Uber Eats vs. Direct</h3>
              <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 18px" }}>
                At scale, shifting even 20% of orders to direct channels (website, SMS, loyalty) has a dramatic effect on profitability.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  { title: "100% Uber Eats", rev: "$52,000", fee: "$13,000 (25%)", net: "$39,000", note: "Year 1 avg monthly scenario", col: C.clay },
                  { title: "80% Uber / 20% Direct", rev: "$52,000", fee: "$10,400", net: "$41,600", note: "+$2,600/mo by building even small direct channel", col: C.sage },
                  { title: "60% Uber / 40% Direct", rev: "$52,000", fee: "$7,800", net: "$44,200", note: "+$5,200/mo. Realistic by Month 10-12 with loyalty program", col: C.mint },
                ].map((s,i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.col}40`, borderRadius: 12, padding: "16px" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: s.col, margin: "0 0 12px" }}>{s.title}</p>
                    {[["Monthly Revenue",s.rev],["Platform Fees",s.fee],["Retained Revenue",s.net]].map(([k,v])=>(
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(149,213,178,0.07)" }}>
                        <span style={{ fontSize: 11, color: C.smoke }}>{k}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: C.cream, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: C.smoke, margin: "10px 0 0", fontStyle: "italic" }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY DETAIL */}
        {tab === "monthly" && (
          <div key={key} className="fu" style={{ opacity: 0 }}>
            <p style={{ fontSize: 11, color: C.smoke, margin: "0 0 14px" }}>Click any row to expand full cost breakdown. * = Month 1 free kitchen rent applied.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Month","Daily Orders","Avg Order","Gross Rev","Total Costs","Net Profit","Margin"].map(h=>(
                    <th key={h} style={{ textAlign: "left", padding: "9px 10px", fontSize: 10, color: C.foam, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "2px solid rgba(149,213,178,0.2)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {data.map((d,i) => {
                    const sel = i === (tab === "monthly" ? i : -1);
                    const isY2start = i === 12;
                    return [
                      isY2start && (
                        <tr key={`y2-${i}`}><td colSpan={7} style={{ padding: "8px 10px", fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", background: "rgba(201,168,76,0.08)", borderTop: "1px solid rgba(201,168,76,0.2)" }}>— Year 2 Begins →</td></tr>
                      ),
                      <tr key={i} style={{ background: i%2===0?"rgba(255,255,255,0.025)":"transparent", cursor: "default" }}>
                        <td style={{ padding: "10px 10px", fontSize: 12, color: C.cream, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {d.month}{d.free && <span style={{ fontSize: 9, color: C.mint, marginLeft: 5, background: "rgba(82,183,136,0.15)", padding: "1px 6px", borderRadius: 8 }}>FREE RENT</span>}
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: C.foam }}>{d.orders}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: C.smoke }}>${d.aov.toFixed(2)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: C.cream }}>{fmt(d.rev)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: C.smoke }}>{fmt(d.costs)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontFamily: "monospace", color: C.mint, fontWeight: 600 }}>{fmt(d.profit)}</td>
                        <td style={{ padding: "10px 10px", fontSize: 12, fontFamily: "monospace", color: d.margin>20?C.mint:d.margin>15?C.foam:C.smoke, fontWeight: 500 }}>{d.margin}%</td>
                      </tr>
                    ];
                  })}
                  <tr style={{ background: "rgba(82,183,136,0.1)", borderTop: "2px solid rgba(149,213,178,0.3)" }}>
                    <td style={{ padding: "11px 10px", fontSize: 12, color: C.cream, fontWeight: 700 }}>2-YEAR TOTAL</td>
                    <td></td><td></td>
                    <td style={{ padding: "11px 10px", fontSize: 13, fontFamily: "monospace", color: C.mint, fontWeight: 700 }}>{fmt(r1+r2)}</td>
                    <td style={{ padding: "11px 10px", fontSize: 13, fontFamily: "monospace", color: C.smoke, fontWeight: 700 }}>{fmt(data.reduce((s,d)=>s+d.costs,0))}</td>
                    <td style={{ padding: "11px 10px", fontSize: 13, fontFamily: "monospace", color: C.gold, fontWeight: 700 }}>{fmt(p1+p2)}</td>
                    <td style={{ padding: "11px 10px", fontSize: 13, fontFamily: "monospace", color: C.gold, fontWeight: 700 }}>{avgM}% avg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { t: "Month 1 Advantage", d: `Free kitchen rent + ${fmt(y1[0].profit)} net profit = optimal month to begin investor repayment. Nearly entire profit is available.`, c: C.mint },
                { t: "Investor Repayment Window", d: "At base scenario, $1,000/month repayment is comfortably covered from Month 1 onwards. Full $6,000 return by Month 6.", c: C.gold },
                { t: "Year 2 Growth", d: `Revenue grows to ${fmt(r2)} in Year 2 (+${Math.round((r2/r1-1)*100)}% vs Y1). Ghost kitchen capacity and direct orders drive this jump.`, c: C.foam },
              ].map((n,i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${n.c}30`, borderRadius: 12, padding: "16px" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: n.c, margin: "0 0 7px" }}>{n.t}</p>
                  <p style={{ fontSize: 11, color: C.smoke, margin: 0, lineHeight: 1.6 }}>{n.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ maxWidth: 1080, margin: "32px auto 0", padding: "0 36px" }}>
        <p style={{ fontSize: 10, color: "rgba(120,140,130,0.5)", textAlign: "center", fontStyle: "italic", margin: 0 }}>
          Projections based on industry benchmarks: ghost kitchen margins 10–30% (Peppr POS 2025), cold-pressed juice COGS 28–32% (Goodnature), Uber Eats commission 25% standard plan, DTLA shared kitchen rent $950–$1,100/mo.
          Base scenario reflects realistic ramp for a wellness brand with existing product catalog and brand identity. · siloamgreenhouse.com
        </p>
      </div>
    </div>
  );
}
