"use client";
import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from "recharts";

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — In production, all from EXADS API + HubSpot
// ═══════════════════════════════════════════════════════════════
const CLIENTS = [
  { id:1, name:"Adsession", rev:[12162,12024,13101,11927,14718,16941], adReqs:[4.2,4.1,4.5,4.1,5.0,5.8], cost:[890,875,960,870,1080,1240], tier:"T1", status:"active", plan:"Ad Serving" },
  { id:2, name:"Crakmedia", rev:[0,0,0,5280,8940,12526], adReqs:[0,0,0,1.8,3.1,4.3], cost:[0,0,0,385,650,910], tier:"T1", status:"active", plan:"Ad Serving" },
  { id:3, name:"DatingLeads", rev:[3785,4114,3887,3084,3144,7320], adReqs:[1.3,1.4,1.3,1.1,1.1,2.5], cost:[275,300,282,224,228,532], tier:"T2", status:"active", plan:"Ad Serving" },
  { id:4, name:"ValueMedia", rev:[1429,1594,2181,2263,1443,1213], adReqs:[0.9,1.0,1.3,1.4,1.2,1.1], cost:[104,116,159,165,105,88], tier:"T2", status:"warning", plan:"DSP" },
  { id:5, name:"OptiDigital", rev:[1538,1505,1348,1447,1280,1193], adReqs:[0.5,0.5,0.4,0.5,0.4,0.4], cost:[112,110,98,105,93,87], tier:"T3", status:"active", plan:"Ad Serving" },
  { id:6, name:"FlirtVentures", rev:[1100,1050,980,1020,1045,1070], adReqs:[0.4,0.4,0.3,0.3,0.4,0.4], cost:[80,77,71,74,76,78], tier:"T3", status:"active", plan:"Ad Serving" },
  { id:7, name:"Topple", rev:[879,882,854,874,858,852], adReqs:[0.3,0.3,0.3,0.3,0.3,0.3], cost:[64,64,62,64,63,62], tier:"T3", status:"active", plan:"Ad Serving" },
  { id:8, name:"PlayaMedia", rev:[650,620,580,610,590,545], adReqs:[0.2,0.2,0.2,0.2,0.2,0.2], cost:[47,45,42,44,43,40], tier:"T3", status:"declining", plan:"Ad Serving" },
  { id:9, name:"Expandi Group", rev:[3787,3456,2558,2568,2102,1890], adReqs:[1.3,1.2,0.9,0.9,0.7,0.7], cost:[276,252,186,187,153,138], tier:"T2", status:"critical", plan:"Ad Serving" },
  { id:10, name:"CargoMedia", rev:[1000,1000,1000,1000,1000,1000], adReqs:[0.3,0.3,0.3,0.3,0.3,0.3], cost:[73,73,73,73,73,73], tier:"T3", status:"active", plan:"Ad Serving" },
  { id:11, name:"Adsomnia", rev:[782,1005,818,795,845,869], adReqs:[0.3,0.3,0.3,0.3,0.3,0.3], cost:[57,73,60,58,62,63], tier:"T3", status:"active", plan:"Ad Serving" },
  { id:12, name:"Vrume", rev:[520,480,510,490,505,475], adReqs:[0.2,0.2,0.2,0.2,0.2,0.2], cost:[38,35,37,36,37,35], tier:"T3", status:"active", plan:"DSP" },
  { id:13, name:"Digital East", rev:[320,340,310,290,305,295], adReqs:[0.1,0.1,0.1,0.1,0.1,0.1], cost:[23,25,23,21,22,21], tier:"T3", status:"active", plan:"Ad Serving" },
  { id:14, name:"PTP Media", rev:[1800,1750,1690,1720,1680,1650], adReqs:[0.6,0.6,0.6,0.6,0.6,0.6], cost:[131,128,123,125,122,120], tier:"T2", status:"active", plan:"Ad Serving" },
  { id:15, name:"Chillipepper", rev:[0,0,0,0,150,380], adReqs:[0,0,0,0,0.1,0.1], cost:[0,0,0,0,11,28], tier:"New", status:"onboarding", plan:"DSP" },
  { id:16, name:"CF Media", rev:[0,0,0,0,0,220], adReqs:[0,0,0,0,0,0.1], cost:[0,0,0,0,0,16], tier:"New", status:"onboarding", plan:"DSP" },
  { id:17, name:"Bank Midia", rev:[0,0,0,200,350,480], adReqs:[0,0,0,0.1,0.1,0.2], cost:[0,0,0,15,26,35], tier:"New", status:"onboarding", plan:"Ad Serving" },
  { id:18, name:"Caribou Media", rev:[0,0,0,0,0,175], adReqs:[0,0,0,0,0,0.1], cost:[0,0,0,0,0,13], tier:"New", status:"onboarding", plan:"DSP" },
  { id:19, name:"Top Solutions", rev:[0,0,0,0,100,280], adReqs:[0,0,0,0,0,0.1], cost:[0,0,0,0,7,20], tier:"New", status:"onboarding", plan:"DSP" },
];

const MONTHS_LABELS = ["Aug","Sep","Oct","Nov","Dec","Jan"];
const MRR_TARGET = 100000;
const PIPELINE = { qualified: 8, proposal: 3, negotiation: 2, closed: 1 };
const HUBSPOT_TICKETS = { open: 12, pending: 5, resolved: 34 };

// ═══════════════════════════════════════════════════════════════
// ALERT ENGINE — Mirrors the health-monitor.jsx logic
// ═══════════════════════════════════════════════════════════════
function generateAlerts(clients) {
  const alerts = [];
  clients.forEach(c => {
    const r = c.rev;
    const a = c.adReqs;
    if (r.length < 2) return;
    const curr = r[r.length-1], prev = r[r.length-2];
    if (prev === 0) return;
    const revChange = ((curr - prev) / prev) * 100;
    const currA = a[a.length-1], prevA = a[a.length-2];
    const adChange = prevA > 0 ? ((currA - prevA) / prevA) * 100 : 0;

    // Critical: revenue drop > 30%
    if (revChange < -30) {
      alerts.push({ severity: "critical", client: c.name, title: `Revenue down ${Math.abs(revChange).toFixed(0)}% MoM`, detail: `€${prev.toLocaleString()} → €${curr.toLocaleString()}. Ad requests ${adChange > -5 ? "stable" : `down ${Math.abs(adChange).toFixed(0)}%`}.`, action: "Investigate immediately", time: "2h ago" });
    }
    // Warning: revenue drop 15-30%
    else if (revChange < -15) {
      alerts.push({ severity: "warning", client: c.name, title: `Revenue declining ${Math.abs(revChange).toFixed(0)}% MoM`, detail: `Check if volume-driven or pricing issue.`, action: "Review account", time: "4h ago" });
    }
    // Warning: pricing divergence
    if (Math.abs(revChange - adChange) > 15 && prev > 500) {
      alerts.push({ severity: "warning", client: c.name, title: "Billing vs volume divergence", detail: `Revenue ${revChange > 0 ? "+" : ""}${revChange.toFixed(0)}% but ad requests ${adChange > 0 ? "+" : ""}${adChange.toFixed(0)}%. Unit economics shifting.`, action: "Review pricing", time: "6h ago" });
    }
    // Trend: 3+ months declining
    if (r.length >= 4) {
      const last4 = r.slice(-4);
      const declining = last4.every((v, i) => i === 0 || v <= last4[i-1]) && last4[0] > last4[3];
      if (declining && last4[0] > 200) {
        alerts.push({ severity: "trend", client: c.name, title: `${r.length >= 5 ? "5" : "3"}+ months declining`, detail: `€${last4[0].toLocaleString()} → €${last4[last4.length-1].toLocaleString()}. Sustained downward trend.`, action: "Schedule health check", time: "1d ago" });
      }
    }
    // Positive: growth > 30%
    if (revChange > 30 && curr > 500) {
      alerts.push({ severity: "positive", client: c.name, title: `Growth +${revChange.toFixed(0)}% MoM`, detail: `Revenue €${curr.toLocaleString()}/m. ${adChange > 20 ? "Organic growth — volume scaling too." : "Check if pricing change."}`, action: "Upsell opportunity", time: "3h ago" });
    }
  });
  return alerts.sort((a,b) => {
    const order = { critical: 0, warning: 1, trend: 2, positive: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const severityConfig = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", badge: "bg-red-500/20 text-red-400", dot: "bg-red-500" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400", dot: "bg-amber-500" },
  trend: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", badge: "bg-purple-500/20 text-purple-400", dot: "bg-purple-500" },
  positive: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400", dot: "bg-emerald-500" },
};

function AlertCard({ alert }) {
  const s = severityConfig[alert.severity];
  return (
    <div className={`${s.bg} border ${s.border} rounded-lg p-3 mb-2`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
        <span className={`text-xs font-mono uppercase font-bold ${s.text}`}>{alert.severity}</span>
        <span className="text-xs text-slate-500 ml-auto">{alert.time}</span>
      </div>
      <div className="text-sm font-semibold text-slate-200">{alert.client} — {alert.title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{alert.detail}</div>
      <div className={`text-xs font-medium mt-1.5 ${s.text}`}>→ {alert.action}</div>
    </div>
  );
}

function StatCard({ label, value, sub, trend, color = "text-cyan-400" }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-1 font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs prev month
        </div>
      )}
    </div>
  );
}

function MiniSparkline({ data, color = "#06b6d4", height = 32 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.map((v,i) => ({ v, i }))}>
        <defs>
          <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace('#','')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ClientRow({ client, onClick, selected }) {
  const curr = client.rev[client.rev.length - 1];
  const prev = client.rev[client.rev.length - 2];
  const change = prev > 0 ? ((curr - prev) / prev * 100) : 0;
  const costRatio = curr > 0 ? (client.cost[client.cost.length-1] / curr * 100) : 0;
  const statusColors = {
    active: "bg-emerald-500", warning: "bg-amber-500", critical: "bg-red-500",
    declining: "bg-orange-500", onboarding: "bg-cyan-500"
  };
  const sparkColor = change >= 0 ? "#22c55e" : (change < -15 ? "#ef4444" : "#f59e0b");

  return (
    <tr
      className={`border-b border-slate-800/50 cursor-pointer transition-colors ${selected ? "bg-cyan-500/10" : "hover:bg-slate-800/40"}`}
      onClick={onClick}
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[client.status] || "bg-slate-500"}`} />
          <span className="text-sm text-slate-200 font-medium">{client.name}</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded font-mono">{client.tier}</span>
      </td>
      <td className="py-2.5 px-3 text-sm text-slate-300 font-medium tabular-nums text-right">€{curr.toLocaleString()}</td>
      <td className="py-2.5 px-3 text-right">
        <span className={`text-xs font-medium tabular-nums ${change >= 0 ? "text-emerald-400" : (change < -15 ? "text-red-400" : "text-amber-400")}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </td>
      <td className="py-2.5 px-3 text-xs text-slate-400 tabular-nums text-right">{costRatio.toFixed(1)}%</td>
      <td className="py-2.5 px-3 w-24"><MiniSparkline data={client.rev} color={sparkColor} /></td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [view, setView] = useState("overview");
  const [selectedClient, setSelectedClient] = useState(null);
  const [alertFilter, setAlertFilter] = useState("all");

  const alerts = useMemo(() => generateAlerts(CLIENTS), []);
  const filteredAlerts = alertFilter === "all" ? alerts : alerts.filter(a => a.severity === alertFilter);

  // KPIs
  const totalMRR = CLIENTS.reduce((s, c) => s + c.rev[c.rev.length - 1], 0);
  const prevMRR = CLIENTS.reduce((s, c) => s + c.rev[c.rev.length - 2], 0);
  const mrrChange = ((totalMRR - prevMRR) / prevMRR) * 100;
  const activeClients = CLIENTS.filter(c => c.rev[c.rev.length-1] > 0).length;
  const avgRev = Math.round(totalMRR / activeClients);
  const totalAdReqs = CLIENTS.reduce((s, c) => s + c.adReqs[c.adReqs.length-1], 0);

  // Revenue over time
  const revOverTime = MONTHS_LABELS.map((m, i) => ({
    month: m,
    total: CLIENTS.reduce((s, c) => s + c.rev[i], 0),
    t1: CLIENTS.filter(c => c.tier === "T1").reduce((s, c) => s + c.rev[i], 0),
    t2: CLIENTS.filter(c => c.tier === "T2").reduce((s, c) => s + c.rev[i], 0),
    t3: CLIENTS.filter(c => c.tier === "T3" || c.tier === "New").reduce((s, c) => s + c.rev[i], 0),
  }));

  // Top 3 concentration
  const sortedByRev = [...CLIENTS].sort((a, b) => b.rev[b.rev.length-1] - a.rev[a.rev.length-1]);
  const top3Rev = sortedByRev.slice(0, 3).reduce((s, c) => s + c.rev[c.rev.length-1], 0);
  const top3Pct = ((top3Rev / totalMRR) * 100).toFixed(1);

  // Plan split
  const adServingRev = CLIENTS.filter(c => c.plan === "Ad Serving").reduce((s, c) => s + c.rev[c.rev.length-1], 0);
  const dspRev = CLIENTS.filter(c => c.plan === "DSP").reduce((s, c) => s + c.rev[c.rev.length-1], 0);

  const pieData = [
    { name: "Ad Serving", value: adServingRev, color: "#06b6d4" },
    { name: "DSP", value: dspRev, color: "#8b5cf6" },
  ];

  // Client detail
  const detail = selectedClient ? CLIENTS.find(c => c.id === selectedClient) : null;

  const navItems = [
    { id: "overview", label: "Overview", icon: "◉" },
    { id: "alerts", label: "Alerts", icon: "⚠", count: alerts.filter(a => a.severity === "critical" || a.severity === "warning").length },
    { id: "clients", label: "Clients", icon: "◫" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-white tracking-tight">EXADS</div>
            <div className="text-sm text-cyan-400 font-medium">Sales Intelligence</div>
            <div className="w-px h-5 bg-slate-700 mx-1" />
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alerts.filter(a => a.severity === "critical").length > 0 && (
              <button
                onClick={() => { setView("alerts"); setAlertFilter("critical"); }}
                className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-red-400 font-medium hover:bg-red-500/20 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {alerts.filter(a => a.severity === "critical").length} Critical
              </button>
            )}
            <div className="text-xs text-slate-500">Last sync: 2 min ago</div>
          </div>
        </div>
        {/* Nav */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {navItems.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                view === n.id
                  ? "bg-slate-800/80 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
              }`}
            >
              <span className="text-xs">{n.icon}</span> {n.label}
              {n.count > 0 && (
                <span className="ml-1 bg-red-500/20 text-red-400 text-xs font-bold px-1.5 py-0 rounded-full">{n.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {view === "overview" && (
          <div className="space-y-5">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard label="Total MRR" value={`€${totalMRR.toLocaleString()}`} sub={`Target: €${MRR_TARGET.toLocaleString()}`} trend={mrrChange} />
              <StatCard label="Active Clients" value={activeClients} sub={`${CLIENTS.filter(c=>c.status==="onboarding").length} onboarding`} color="text-emerald-400" />
              <StatCard label="Avg Revenue" value={`€${avgRev.toLocaleString()}`} sub="per active client" color="text-amber-400" />
              <StatCard label="Ad Requests" value={`${totalAdReqs.toFixed(1)}B`} sub="this month" color="text-purple-400" />
              <StatCard label="Top 3 Share" value={`${top3Pct}%`} sub={sortedByRev.slice(0,3).map(c=>c.name).join(", ")} color={parseFloat(top3Pct) > 65 ? "text-red-400" : "text-cyan-400"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                <div className="text-sm font-semibold text-slate-300 mb-3">Monthly Revenue by Tier</div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revOverTime}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="100%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }} formatter={(v) => [`€${v.toLocaleString()}`, ""]} />
                    <Area type="monotone" dataKey="t1" stackId="1" stroke="#06b6d4" fill="url(#g1)" strokeWidth={2} name="Tier 1" />
                    <Area type="monotone" dataKey="t2" stackId="1" stroke="#8b5cf6" fill="url(#g2)" strokeWidth={2} name="Tier 2" />
                    <Area type="monotone" dataKey="t3" stackId="1" stroke="#22c55e" fill="url(#g3)" strokeWidth={2} name="Tier 3 & New" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Alerts Summary + Pie */}
              <div className="space-y-4">
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-300">Active Alerts</div>
                    <button onClick={() => setView("alerts")} className="text-xs text-cyan-400 hover:text-cyan-300">View all →</button>
                  </div>
                  <div className="space-y-1.5">
                    {alerts.slice(0, 3).map((a, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${severityConfig[a.severity].text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${severityConfig[a.severity].dot}`} />
                        <span className="text-slate-300 truncate">{a.client}</span>
                        <span className="text-slate-500 ml-auto text-xs whitespace-nowrap">{a.severity}</span>
                      </div>
                    ))}
                    {alerts.length > 3 && <div className="text-xs text-slate-500">+{alerts.length - 3} more</div>}
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                  <div className="text-sm font-semibold text-slate-300 mb-2">Revenue Split</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }} formatter={v => `€${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="text-cyan-400">● Ad Serving {((adServingRev/totalMRR)*100).toFixed(0)}%</span>
                    <span className="text-purple-400">● DSP {((dspRev/totalMRR)*100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Client Table */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/40">
                <div className="text-sm font-semibold text-slate-300">Client Portfolio</div>
                <button onClick={() => setView("clients")} className="text-xs text-cyan-400 hover:text-cyan-300">Full view →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/40 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-medium">Client</th>
                      <th className="text-left px-3 py-2 font-medium">Tier</th>
                      <th className="text-right px-3 py-2 font-medium">MRR</th>
                      <th className="text-right px-3 py-2 font-medium">MoM</th>
                      <th className="text-right px-3 py-2 font-medium">Cost %</th>
                      <th className="text-right px-3 py-2 font-medium w-24">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByRev.filter(c => c.rev[c.rev.length-1] > 0).slice(0, 8).map(c => (
                      <ClientRow key={c.id} client={c} onClick={() => setSelectedClient(c.id)} selected={selectedClient === c.id} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ALERTS TAB ═══════ */}
        {view === "alerts" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-lg font-bold text-white">Alerts</div>
              <div className="text-sm text-slate-500">({alerts.length} active)</div>
              <div className="ml-auto flex gap-1">
                {["all", "critical", "warning", "trend", "positive"].map(f => (
                  <button key={f} onClick={() => setAlertFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                      alertFilter === f ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}>{f} {f !== "all" && `(${alerts.filter(a => a.severity === f).length})`}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
            </div>
            {filteredAlerts.length === 0 && (
              <div className="text-center py-12 text-slate-500">No {alertFilter} alerts</div>
            )}
          </div>
        )}

        {/* ═══════ CLIENTS TAB ═══════ */}
        {view === "clients" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/40">
                <div className="text-sm font-semibold text-slate-300">All Clients — {CLIENTS.filter(c => c.rev[c.rev.length-1] > 0).length} active</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/40 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-medium">Client</th>
                      <th className="text-left px-3 py-2 font-medium">Tier</th>
                      <th className="text-right px-3 py-2 font-medium">MRR</th>
                      <th className="text-right px-3 py-2 font-medium">MoM</th>
                      <th className="text-right px-3 py-2 font-medium">Cost %</th>
                      <th className="text-right px-3 py-2 font-medium w-24">6m Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByRev.filter(c => c.rev[c.rev.length-1] > 0).map(c => (
                      <ClientRow key={c.id} client={c} onClick={() => setSelectedClient(c.id)} selected={selectedClient === c.id} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client Detail */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
              {detail ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      detail.status === "active" ? "bg-emerald-500" : detail.status === "critical" ? "bg-red-500" : detail.status === "warning" ? "bg-amber-500" : "bg-cyan-500"
                    }`} />
                    <div className="text-base font-bold text-white">{detail.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">Tier</span><div className="text-slate-200 font-medium">{detail.tier}</div></div>
                    <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">Plan</span><div className="text-slate-200 font-medium">{detail.plan}</div></div>
                    <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">MRR</span><div className="text-cyan-400 font-bold">€{detail.rev[detail.rev.length-1].toLocaleString()}</div></div>
                    <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">Ad Reqs</span><div className="text-purple-400 font-bold">{detail.adReqs[detail.adReqs.length-1].toFixed(1)}B</div></div>
                  </div>
                  <div className="text-xs text-slate-500 mb-2 font-medium">Revenue Trend (6m)</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={detail.rev.map((v,i) => ({ month: MONTHS_LABELS[i], rev: v, cost: detail.cost[i] }))}>
                      <defs>
                        <linearGradient id="detailG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }} formatter={v => `€${v.toLocaleString()}`} />
                      <Area type="monotone" dataKey="rev" stroke="#06b6d4" fill="url(#detailG)" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Cost" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {alerts.filter(a => a.client === detail.name).map((a, i) => (
                      <div key={i} className={`text-xs p-2 rounded-lg ${severityConfig[a.severity].bg} border ${severityConfig[a.severity].border}`}>
                        <span className={`font-bold uppercase ${severityConfig[a.severity].text}`}>{a.severity}:</span>{" "}
                        <span className="text-slate-300">{a.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-3xl mb-2">◫</div>
                  <div className="text-sm">Select a client to view details</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ PIPELINE TAB ═══════ */}
        {view === "pipeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
              <div className="text-sm font-semibold text-slate-300 mb-4">Sales Pipeline (from HubSpot)</div>
              <div className="space-y-3">
                {[
                  { stage: "Qualified Leads", count: PIPELINE.qualified, color: "bg-cyan-500", width: "100%" },
                  { stage: "Proposal Sent", count: PIPELINE.proposal, color: "bg-purple-500", width: "37.5%" },
                  { stage: "Negotiation", count: PIPELINE.negotiation, color: "bg-amber-500", width: "25%" },
                  { stage: "Closed Won", count: PIPELINE.closed, color: "bg-emerald-500", width: "12.5%" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{s.stage}</span>
                      <span className="font-bold text-slate-300">{s.count}</span>
                    </div>
                    <div className="h-6 bg-slate-900/50 rounded-lg overflow-hidden">
                      <div className={`h-full ${s.color} rounded-lg transition-all`} style={{ width: s.width, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
              <div className="text-sm font-semibold text-slate-300 mb-4">Support Tickets (from HubSpot)</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{HUBSPOT_TICKETS.open}</div>
                  <div className="text-xs text-slate-500">Open</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{HUBSPOT_TICKETS.pending}</div>
                  <div className="text-xs text-slate-500">Pending</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{HUBSPOT_TICKETS.resolved}</div>
                  <div className="text-xs text-slate-500">Resolved</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 border-t border-slate-700/40 pt-3">
                <div className="font-medium text-slate-400 mb-2">MRR to Target Progress</div>
                <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${(totalMRR/100000*100).toFixed(0)}%` }} />
                </div>
                <div className="flex justify-between">
                  <span>€{totalMRR.toLocaleString()}</span>
                  <span>€100,000 target</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
