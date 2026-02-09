"use client";
import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid, Legend, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════
type Sentiment = "very_happy" | "happy" | "neutral" | "unhappy" | "very_unhappy";
type Pricing = "Ad Serving" | "DSP";
type ClientPlan = "Enterprise" | "Business" | "Pro" | "Core";

interface Client {
  id: number;
  name: string;
  tradingName?: string;
  vertical: string;
  language: string;
  currency: string;
  blurb: string;
  rev: number[];
  adReqs: number[];
  cost: number[];
  tier: "T1" | "T2" | "T3" | "New";
  status: "active" | "warning" | "critical" | "declining" | "onboarding" | "testing" | "churn";
  pricing: Pricing[];
  plan: ClientPlan;
  sentiment: Sentiment;
  tickets: { open: number; resolved: number };
  upsell: string | null;
}

type AlertSeverity = "critical" | "warning" | "trend" | "positive";

interface Alert {
  severity: AlertSeverity;
  client: string;
  title: string;
  detail: string;
  action: string;
  time: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: string;
}

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

interface ClientRowProps {
  client: Client;
  onClick: () => void;
  selected: boolean;
  sentimentOverride?: Sentiment;
  openTickets?: number;
}

interface AlertCardProps {
  alert: Alert;
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — In production, all from EXADS API + HubSpot
// ═══════════════════════════════════════════════════════════════
const CLIENTS: Client[] = [
  // ── Active / Paying (15) ──
  { id:1, name:"Adsession", tradingName:"Adsession BV", vertical:"Ad Tech", language:"English", currency:"EUR", blurb:"Large-scale ad tech platform specialising in pop-under and push notification ad formats. High-volume programmatic buyer with strong self-serve usage.", rev:[12162,12024,13101,11927,14718,16941], adReqs:[4.2,4.1,4.5,4.1,5.0,5.8], cost:[410,395,440,390,510,580], tier:"T1", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"very_happy", tickets:{open:0,resolved:5}, upsell:null },
  { id:2, name:"Crakmedia", tradingName:"Crak Revenue / Crakmedia Inc.", vertical:"Performance Marketing", language:"English / French", currency:"USD", blurb:"Canadian performance marketing network. Runs large CPA campaigns across dating, nutra, and sweepstakes verticals. Uses both Ad Serving and DSP platforms.", rev:[0,0,0,5280,8940,12526], adReqs:[0,0,0,1.8,3.1,4.3], cost:[0,0,0,290,530,820], tier:"T1", status:"active", pricing:["Ad Serving","DSP"], plan:"Enterprise", sentiment:"happy", tickets:{open:1,resolved:3}, upsell:null },
  { id:3, name:"DatingLeads", tradingName:"Adclix / Perfect Ads / Traffic Gold", vertical:"Dating", language:"English", currency:"EUR", blurb:"Monetises member areas across a large portfolio of dating sites. Operates multiple brands including Adclix, Perfect Ads, and Traffic Gold.", rev:[3785,4114,3887,3084,3144,7320], adReqs:[1.3,1.4,1.3,1.1,1.1,2.5], cost:[340,380,350,285,290,680], tier:"T2", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"happy", tickets:{open:2,resolved:4}, upsell:null },
  { id:4, name:"ValueMedia", tradingName:"Value Media GmbH", vertical:"Media Buying", language:"German / English", currency:"USD", blurb:"German media buying agency focused on display and native campaigns. Uses DSP for programmatic buying across EU markets.", rev:[1429,1594,2181,2263,1443,1213], adReqs:[0.9,1.0,1.3,1.4,1.2,1.1], cost:[155,178,262,275,170,142], tier:"T2", status:"warning", pricing:["DSP"], plan:"Enterprise", sentiment:"neutral", tickets:{open:3,resolved:2}, upsell:null },
  { id:5, name:"OptiDigital", tradingName:"Opti Digital SAS", vertical:"Ad Tech", language:"French / English", currency:"EUR", blurb:"French ad tech company providing header bidding and ad layout optimisation for premium publishers.", rev:[1538,1505,1348,1447,1280,1193], adReqs:[0.5,0.5,0.4,0.5,0.4,0.4], cost:[78,76,68,73,64,60], tier:"T3", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"happy", tickets:{open:0,resolved:1}, upsell:"Pro plan upgrade" },
  { id:6, name:"Topple", tradingName:"Topple Media", vertical:"Media Buying", language:"English", currency:"USD", blurb:"Performance-focused media buyer running RON campaigns. Steady mid-tier account with predictable volumes.", rev:[879,882,854,874,858,852], adReqs:[0.3,0.3,0.3,0.3,0.3,0.3], cost:[92,93,90,92,90,90], tier:"T3", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"neutral", tickets:{open:1,resolved:1}, upsell:null },
  { id:7, name:"CargoMedia", tradingName:"Cargo Media AG", vertical:"Dating", language:"German / English", currency:"CHF", blurb:"Swiss dating platform operator. Very stable, flat revenue — classic \"set and forget\" account.", rev:[1000,1000,1000,1000,1000,1000], adReqs:[0.3,0.3,0.3,0.3,0.3,0.3], cost:[45,45,45,45,45,45], tier:"T3", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"happy", tickets:{open:0,resolved:0}, upsell:"Pro plan upgrade" },
  { id:8, name:"Harlem Next", tradingName:"Adsomnia", vertical:"Ad Tech", language:"English", currency:"EUR", blurb:"Ad tech outfit running remnant inventory monetisation. Trades as Adsomnia. Inconsistent month-to-month but overall stable.", rev:[782,1005,818,795,845,869], adReqs:[0.3,0.3,0.3,0.3,0.3,0.3], cost:[82,110,88,84,92,95], tier:"T3", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"happy", tickets:{open:1,resolved:3}, upsell:null },
  { id:9, name:"Vrume", tradingName:"Ontario", vertical:"Media Buying", language:"English", currency:"USD", blurb:"Also operates as Ontario. Performance media buyer with steady volumes across multiple geos.", rev:[520,480,510,490,505,475], adReqs:[0.2,0.2,0.2,0.2,0.2,0.2], cost:[52,48,51,49,51,48], tier:"T3", status:"active", pricing:["DSP"], plan:"Enterprise", sentiment:"neutral", tickets:{open:0,resolved:1}, upsell:"Ad Serving migration" },
  { id:10, name:"Ideawise", tradingName:"PlayaMedia", vertical:"Media Buying", language:"English", currency:"USD", blurb:"Trades as PlayaMedia. Media buying across multiple verticals with focus on entertainment and dating offers.", rev:[650,620,580,610,590,545], adReqs:[0.2,0.2,0.2,0.2,0.2,0.2], cost:[70,68,65,67,66,62], tier:"T3", status:"declining", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"unhappy", tickets:{open:2,resolved:6}, upsell:null },
  { id:11, name:"Expandi Group", tradingName:"Expandi Group B.V. / TrafficHunt", vertical:"Ad Tech", language:"English / Russian", currency:"USD", blurb:"Runs TrafficHunt ad network. Was a strong T1 account but has been steadily declining. Multiple open tickets — possible platform dissatisfaction.", rev:[3787,3456,2558,2568,2102,1890], adReqs:[1.3,1.2,0.9,0.9,0.7,0.7], cost:[195,180,135,138,115,105], tier:"T2", status:"critical", pricing:["Ad Serving"], plan:"Pro", sentiment:"very_unhappy", tickets:{open:4,resolved:8}, upsell:null },
  { id:12, name:"Digital East", tradingName:"Digital East GmbH", vertical:"Media Buying", language:"German", currency:"USD", blurb:"Small agency buying inventory for DACH region clients. Low volume but consistent payer.", rev:[320,340,310,290,305,295], adReqs:[0.1,0.1,0.1,0.1,0.1,0.1], cost:[38,41,37,35,37,35], tier:"T3", status:"active", pricing:["Ad Serving"], plan:"Pro", sentiment:"happy", tickets:{open:0,resolved:0}, upsell:null },
  { id:13, name:"PTP Media", tradingName:"PTP Media Ltd", vertical:"Performance Marketing", language:"English", currency:"EUR", blurb:"UK-based performance network specialising in lead generation. Slow decline in volumes — may need pricing review.", rev:[1800,1750,1690,1720,1680,1650], adReqs:[0.6,0.6,0.6,0.6,0.6,0.6], cost:[108,105,101,103,101,99], tier:"T2", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"neutral", tickets:{open:1,resolved:4}, upsell:"DSP migration" },
  { id:14, name:"FlirtVentures", tradingName:"SSP / Former AdClix / Turtle Pace Media", vertical:"Dating", language:"Dutch / English", currency:"EUR", blurb:"Netherlands-based dating network operating niche dating sites across Western Europe. Formerly operated as AdClix. Stable, consistent traffic.", rev:[1100,1050,980,1020,1045,1070], adReqs:[0.4,0.4,0.3,0.3,0.4,0.4], cost:[99,95,88,92,94,96], tier:"T3", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"happy", tickets:{open:0,resolved:2}, upsell:"Pro plan upgrade" },
  { id:15, name:"Bank Midia", tradingName:"Bank Midia Ltda", vertical:"Media Buying", language:"Portuguese", currency:"BRL", blurb:"Brazilian media buyer focused on LATAM markets. Growing steadily since onboarding — potential for significant scale.", rev:[0,0,0,200,350,480], adReqs:[0,0,0,0.1,0.1,0.2], cost:[0,0,0,22,42,58], tier:"New", status:"active", pricing:["Ad Serving"], plan:"Enterprise", sentiment:"neutral", tickets:{open:0,resolved:1}, upsell:"Pro plan upgrade" },
  // ── Onboarding (6) ──
  { id:16, name:"Chillipepper", tradingName:"Chillipepper Media", vertical:"Ad Tech", language:"English", currency:"EUR", blurb:"Newly onboarded ad tech startup. Running initial setup on DSP. Early signs of potential.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"onboarding", pricing:["DSP"], plan:"Business", sentiment:"neutral", tickets:{open:1,resolved:0}, upsell:null },
  { id:17, name:"Flowlink Global", tradingName:"Starlinker", vertical:"Ad Tech", language:"English", currency:"USD", blurb:"Also trades as Starlinker. Setting up DSP campaigns — onboarding in progress.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"onboarding", pricing:["DSP"], plan:"Business", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  { id:18, name:"CF Media", tradingName:"Klico", vertical:"Ad Tech", language:"Portuguese / English", currency:"USD", blurb:"Also operates as Klico. Setting up DSP integration — onboarding in progress.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"onboarding", pricing:["DSP"], plan:"Enterprise", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  { id:19, name:"Caribou Media", tradingName:"Recoil Network", vertical:"Gaming", language:"English", currency:"CAD", blurb:"Canadian gaming publisher. Also operates Recoil Network. Setting up DSP for mobile game ad monetisation.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"onboarding", pricing:["DSP"], plan:"Business", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  { id:20, name:"Medialix", tradingName:"Adclix", vertical:"Ad Tech", language:"English", currency:"EUR", blurb:"Trades as Adclix. Setting up DSP integration — enterprise onboarding in progress.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"onboarding", pricing:["DSP"], plan:"Enterprise", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  // ── Testing (4) ──
  { id:21, name:"Top Solutions", tradingName:"Top Solutions Media", vertical:"Media Buying", language:"English", currency:"EUR", blurb:"Running initial test campaigns on DSP. Evaluating platform fit before committing to full rollout.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"testing", pricing:["DSP"], plan:"Business", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  { id:22, name:"Ezmob", vertical:"Ad Tech", language:"English", currency:"USD", blurb:"Ad tech platform running test campaigns on Ad Serving. Evaluating integration and performance.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"testing", pricing:["Ad Serving"], plan:"Core", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  { id:23, name:"AdultadAdworld", vertical:"Dating", language:"English", currency:"USD", blurb:"Running test campaigns on DSP platform. Evaluating ad formats and targeting capabilities.", rev:[0,0,0,0,0,0], adReqs:[0,0,0,0,0,0], cost:[0,0,0,0,0,0], tier:"New", status:"testing", pricing:["DSP"], plan:"Enterprise", sentiment:"neutral", tickets:{open:0,resolved:0}, upsell:null },
  // ── Churn (1) ──
  { id:24, name:"Venus London", tradingName:"Venus London Technology", vertical:"Dating", language:"English", currency:"GBP", blurb:"Was on DSP Business plan. Churned — last activity was minimal. May be worth a win-back campaign.", rev:[420,380,310,180,90,0], adReqs:[0.2,0.2,0.1,0.1,0,0], cost:[48,44,36,21,10,0], tier:"T3", status:"churn", pricing:["DSP"], plan:"Business", sentiment:"very_unhappy", tickets:{open:0,resolved:2}, upsell:null },
];

const MONTHS_LABELS = ["Aug","Sep","Oct","Nov","Dec","Jan"];
const MRR_TARGET = 100000;
const PIPELINE = { qualified: 8, proposal: 3, negotiation: 2, closed: 1, qualifiedVal: 18400, proposalVal: 9200, negotiationVal: 7600, closedVal: 3800 };
const HUBSPOT_TICKETS = { open: 12, pending: 5, resolved: 34 };

// Network-wide revenue (illustrative — all EXADS network traffic, not just managed clients)
const NETWORK_REVENUE = [
  { month: "Aug", total: 2850000, adServing: 2140000, dsp: 710000 },
  { month: "Sep", total: 2920000, adServing: 2160000, dsp: 760000 },
  { month: "Oct", total: 3080000, adServing: 2280000, dsp: 800000 },
  { month: "Nov", total: 2940000, adServing: 2150000, dsp: 790000 },
  { month: "Dec", total: 3210000, adServing: 2350000, dsp: 860000 },
  { month: "Jan", total: 3340000, adServing: 2420000, dsp: 920000 },
];

// ═══════════════════════════════════════════════════════════════
// ALERT ENGINE
// ═══════════════════════════════════════════════════════════════
function generateAlerts(clients: Client[]): Alert[] {
  const alerts: Alert[] = [];
  clients.forEach(c => {
    const r = c.rev;
    const a = c.adReqs;
    if (r.length < 2) return;
    const curr = r[r.length-1], prev = r[r.length-2];

    // Client ready for billing: onboarding status + 2+ months of revenue
    if (c.status === "onboarding" && r.filter(v => v > 0).length >= 2 && curr > 100) {
      alerts.push({
        severity: "positive",
        client: c.name,
        title: "Ready to move to billing",
        detail: `${r.filter(v => v > 0).length} months of activity. Current MRR: \u20AC${curr.toLocaleString()}.`,
        action: "Set up billing",
        time: "Today"
      });
    }

    if (prev === 0) return;
    const revChange = ((curr - prev) / prev) * 100;
    const currA = a[a.length-1], prevA = a[a.length-2];
    const adChange = prevA > 0 ? ((currA - prevA) / prevA) * 100 : 0;

    // Critical: revenue drop > 30%
    if (revChange < -30) {
      alerts.push({ severity: "critical", client: c.name, title: `Revenue down ${Math.abs(revChange).toFixed(0)}% MoM`, detail: `\u20AC${prev.toLocaleString()} \u2192 \u20AC${curr.toLocaleString()}. Ad requests ${adChange > -5 ? "stable" : `down ${Math.abs(adChange).toFixed(0)}%`}.`, action: "Investigate immediately", time: "2h ago" });
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
        alerts.push({ severity: "trend", client: c.name, title: `${r.length >= 5 ? "5" : "3"}+ months declining`, detail: `\u20AC${last4[0].toLocaleString()} \u2192 \u20AC${last4[last4.length-1].toLocaleString()}. Sustained downward trend.`, action: "Schedule health check", time: "1d ago" });
      }
    }
    // Positive: growth > 30%
    if (revChange > 30 && curr > 500) {
      alerts.push({ severity: "positive", client: c.name, title: `Growth +${revChange.toFixed(0)}% MoM`, detail: `Revenue \u20AC${curr.toLocaleString()}/m. ${adChange > 20 ? "Organic growth \u2014 volume scaling too." : "Check if pricing change."}`, action: "Upsell opportunity", time: "3h ago" });
    }
  });
  return alerts.sort((a,b) => {
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, trend: 2, positive: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ═══════════════════════════════════════════════════════════════
// FORECAST HELPERS
// ═══════════════════════════════════════════════════════════════
function forecastClient(rev: number[], status: string): number {
  const r = rev;
  const weighted = r[5] * 0.5 + r[4] * 0.3 + r[3] * 0.2;
  const momGrowth = r[4] > 0 ? (r[5] - r[4]) / r[4] : 0;
  return (status === "onboarding" && momGrowth > 0.5) ? weighted * 1.2 : weighted;
}

function computeVariance(rev: number[]): number {
  const nonZero = rev.filter(v => v > 0);
  if (nonZero.length < 2) return 1;
  const mean = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  const variance = nonZero.reduce((s, v) => s + (v - mean) ** 2, 0) / nonZero.length;
  return Math.sqrt(variance) / mean; // coefficient of variation
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const severityConfig: Record<AlertSeverity, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", badge: "bg-red-500/20 text-red-400", dot: "bg-red-500" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400", dot: "bg-amber-500" },
  trend: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", badge: "bg-purple-500/20 text-purple-400", dot: "bg-purple-500" },
  positive: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400", dot: "bg-emerald-500" },
};

function AlertCard({ alert }: AlertCardProps) {
  const s = severityConfig[alert.severity];
  return (
    <div className={`${s.bg} border ${s.border} rounded-lg p-3 mb-2 backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
        <span className={`text-xs font-mono uppercase font-bold ${s.text}`}>{alert.severity}</span>
        <span className="text-xs text-slate-500 ml-auto">{alert.time}</span>
      </div>
      <div className="text-sm font-semibold text-slate-200">{alert.client} — {alert.title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{alert.detail}</div>
      <div className={`text-xs font-medium mt-1.5 ${s.text}`}>{"\u2192"} {alert.action}</div>
    </div>
  );
}

function StatCard({ label, value, sub, trend, color = "text-cyan-400" }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl hover:border-slate-600/40 transition-all duration-300">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-1 font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend).toFixed(1)}% vs prev month
        </div>
      )}
    </div>
  );
}

function MiniSparkline({ data, color = "#06b6d4", height = 32 }: MiniSparklineProps) {
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

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  very_happy: "#22c55e",
  happy: "#4ade80",
  neutral: "#f59e0b",
  unhappy: "#f97316",
  very_unhappy: "#ef4444",
};

function SentimentFace({ sentiment, size = 28, onClick, selected }: { sentiment: Sentiment; size?: number; onClick?: () => void; selected?: boolean }) {
  const color = SENTIMENT_COLORS[sentiment];
  const r = size / 2;
  const cx = r, cy = r;
  const eyeY = r * 0.72;
  const eyeL = r * 0.65;
  const eyeR = r * 1.35;
  const mouthY = r * 1.3;

  const eyeRadius = r * 0.08;
  const mouthW = r * 0.5;

  let eyes: React.ReactNode = null;
  let mouth: React.ReactNode = null;

  switch (sentiment) {
    case "very_happy":
      eyes = <>
        <ellipse cx={eyeL} cy={eyeY - r*0.05} rx={eyeRadius * 1.2} ry={eyeRadius * 0.6} fill={color} />
        <ellipse cx={eyeR} cy={eyeY - r*0.05} rx={eyeRadius * 1.2} ry={eyeRadius * 0.6} fill={color} />
      </>;
      mouth = <path d={`M ${cx - mouthW} ${mouthY - r*0.1} Q ${cx} ${mouthY + r*0.35} ${cx + mouthW} ${mouthY - r*0.1}`} stroke={color} strokeWidth={r * 0.12} fill="none" strokeLinecap="round" />;
      break;
    case "happy":
      eyes = <>
        <circle cx={eyeL} cy={eyeY} r={eyeRadius} fill={color} />
        <circle cx={eyeR} cy={eyeY} r={eyeRadius} fill={color} />
      </>;
      mouth = <path d={`M ${cx - mouthW * 0.8} ${mouthY} Q ${cx} ${mouthY + r*0.22} ${cx + mouthW * 0.8} ${mouthY}`} stroke={color} strokeWidth={r * 0.1} fill="none" strokeLinecap="round" />;
      break;
    case "neutral":
      eyes = <>
        <circle cx={eyeL} cy={eyeY} r={eyeRadius} fill={color} />
        <circle cx={eyeR} cy={eyeY} r={eyeRadius} fill={color} />
      </>;
      mouth = <line x1={cx - mouthW * 0.6} y1={mouthY} x2={cx + mouthW * 0.6} y2={mouthY} stroke={color} strokeWidth={r * 0.1} strokeLinecap="round" />;
      break;
    case "unhappy":
      eyes = <>
        <circle cx={eyeL} cy={eyeY} r={eyeRadius} fill={color} />
        <circle cx={eyeR} cy={eyeY} r={eyeRadius} fill={color} />
      </>;
      mouth = <path d={`M ${cx - mouthW * 0.8} ${mouthY + r*0.12} Q ${cx} ${mouthY - r*0.15} ${cx + mouthW * 0.8} ${mouthY + r*0.12}`} stroke={color} strokeWidth={r * 0.1} fill="none" strokeLinecap="round" />;
      break;
    case "very_unhappy":
      eyes = <>
        <line x1={eyeL - eyeRadius*1.5} y1={eyeY - eyeRadius*1.2} x2={eyeL + eyeRadius*1.5} y2={eyeY + eyeRadius*0.5} stroke={color} strokeWidth={r * 0.08} strokeLinecap="round" />
        <circle cx={eyeL} cy={eyeY + eyeRadius} r={eyeRadius * 0.8} fill={color} />
        <line x1={eyeR + eyeRadius*1.5} y1={eyeY - eyeRadius*1.2} x2={eyeR - eyeRadius*1.5} y2={eyeY + eyeRadius*0.5} stroke={color} strokeWidth={r * 0.08} strokeLinecap="round" />
        <circle cx={eyeR} cy={eyeY + eyeRadius} r={eyeRadius * 0.8} fill={color} />
      </>;
      mouth = <path d={`M ${cx - mouthW} ${mouthY + r*0.2} Q ${cx} ${mouthY - r*0.2} ${cx + mouthW} ${mouthY + r*0.2}`} stroke={color} strokeWidth={r * 0.12} fill="none" strokeLinecap="round" />;
      break;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={onClick}
      className={`${onClick ? "cursor-pointer hover:scale-110" : ""} transition-transform ${selected ? "scale-125 drop-shadow-lg" : "opacity-60 hover:opacity-100"}`}
      style={selected ? { filter: `drop-shadow(0 0 4px ${color}40)` } : undefined}
    >
      <circle cx={cx} cy={cy} r={r - 1} fill={`${color}18`} stroke={color} strokeWidth={selected ? 2 : 1.2} />
      {eyes}
      {mouth}
    </svg>
  );
}

const SENTIMENTS: Sentiment[] = ["very_happy", "happy", "neutral", "unhappy", "very_unhappy"];

function ClientRow({ client, onClick, selected, sentimentOverride, openTickets }: ClientRowProps) {
  const curr = client.rev[client.rev.length - 1];
  const prev = client.rev[client.rev.length - 2];
  const change = prev > 0 ? ((curr - prev) / prev * 100) : 0;
  const costRatio = curr > 0 ? (client.cost[client.cost.length-1] / curr * 100) : 0;
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500", warning: "bg-amber-500", critical: "bg-red-500",
    declining: "bg-orange-500", onboarding: "bg-cyan-500", testing: "bg-violet-500", churn: "bg-slate-500"
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
          {(openTickets ?? client.tickets.open) > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0 rounded-full">{openTickets ?? client.tickets.open}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded font-mono">{client.tier}</span>
      </td>
      <td className="py-2.5 px-1">
        <div className="flex justify-center">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[sentimentOverride ?? client.sentiment] }} />
        </div>
      </td>
      <td className="py-2.5 px-3 text-sm text-slate-300 font-medium tabular-nums text-right">{"\u20AC"}{curr.toLocaleString()}</td>
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
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [alertFilter, setAlertFilter] = useState("all");
  const [clientOverrides, setClientOverrides] = useState<Record<number, { sentiment?: Sentiment; pricing?: Pricing; plan?: ClientPlan }>>({});
  const [editingPricing, setEditingPricing] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [clientTab, setClientTab] = useState<"all" | "new">("all");

  const alerts = useMemo(() => generateAlerts(CLIENTS), []);
  const filteredAlerts = alertFilter === "all" ? alerts : alerts.filter(a => a.severity === alertFilter);

  // KPIs
  const totalMRR = CLIENTS.reduce((s, c) => s + c.rev[c.rev.length - 1], 0);
  const prevMRR = CLIENTS.reduce((s, c) => s + c.rev[c.rev.length - 2], 0);
  const mrrChange = ((totalMRR - prevMRR) / prevMRR) * 100;
  const activeClients = CLIENTS.filter(c => c.rev[c.rev.length-1] > 0).length;
  const avgRev = Math.round(totalMRR / activeClients);
  const totalAdReqs = CLIENTS.reduce((s, c) => s + c.adReqs[c.adReqs.length-1], 0);

  // Forecast calculations
  const forecastData = useMemo(() => {
    // Month 1 (Feb): weighted average per client
    const m1Forecasts = CLIENTS.map(c => forecastClient(c.rev, c.status));
    const m1Total = Math.round(m1Forecasts.reduce((s, v) => s + v, 0));

    // Month 2 (Mar): shift window — use [rev[4], rev[5], m1forecast] with same weights
    const m2Forecasts = CLIENTS.map((c, i) => {
      const shifted = c.rev[5] * 0.2 + m1Forecasts[i] * 0.5 + c.rev[4] * 0.3;
      const momGrowth = c.rev[4] > 0 ? (c.rev[5] - c.rev[4]) / c.rev[4] : 0;
      return (c.status === "onboarding" && momGrowth > 0.5) ? shifted * 1.2 : shifted;
    });
    const m2Total = Math.round(m2Forecasts.reduce((s, v) => s + v, 0));

    // Month 3 (Apr): shift again
    const m3Forecasts = CLIENTS.map((c, i) => {
      const shifted = m1Forecasts[i] * 0.2 + m2Forecasts[i] * 0.5 + c.rev[5] * 0.3;
      const momGrowth = c.rev[4] > 0 ? (c.rev[5] - c.rev[4]) / c.rev[4] : 0;
      return (c.status === "onboarding" && momGrowth > 0.5) ? shifted * 1.2 : shifted;
    });
    const m3Total = Math.round(m3Forecasts.reduce((s, v) => s + v, 0));

    // Confidence: based on avg coefficient of variation across clients
    const avgCV = CLIENTS.reduce((s, c) => s + computeVariance(c.rev), 0) / CLIENTS.length;
    const confidence = avgCV < 0.15 ? "High" : avgCV < 0.35 ? "Medium" : "Low";

    return {
      months: [
        { label: "Feb", value: m1Total },
        { label: "Mar", value: m2Total },
        { label: "Apr", value: m3Total },
      ],
      confidence,
      avgCV,
    };
  }, []);

  // MRR vs Target yearly data (with forecast extension)
  const MRR_YEARLY_DATA = [
    { month: "Jan", actual: 42500, target: 50000, isForecast: false },
    { month: "Feb", actual: 44200, target: 55000, isForecast: false },
    { month: "Mar", actual: 46800, target: 60000, isForecast: false },
    { month: "Apr", actual: 48100, target: 65000, isForecast: false },
    { month: "May", actual: 49300, target: 70000, isForecast: false },
    { month: "Jun", actual: 48900, target: 75000, isForecast: false },
    { month: "Jul", actual: 50200, target: 80000, isForecast: false },
    { month: "Aug", actual: 51800, target: 85000, isForecast: false },
    { month: "Sep", actual: 53400, target: 90000, isForecast: false },
    { month: "Oct", actual: 55100, target: 95000, isForecast: false },
    { month: "Nov", actual: 47100, target: 97000, isForecast: false },
    { month: "Dec", actual: totalMRR, target: 100000, isForecast: false },
    { month: "Jan\u2019", actual: forecastData.months[0].value, target: MRR_TARGET, isForecast: true },
    { month: "Feb\u2019", actual: forecastData.months[1].value, target: MRR_TARGET, isForecast: true },
    { month: "Mar\u2019", actual: forecastData.months[2].value, target: MRR_TARGET, isForecast: true },
  ];

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

  // Pricing split
  const adServingRev = CLIENTS.filter(c => c.pricing.includes("Ad Serving")).reduce((s, c) => s + c.rev[c.rev.length-1], 0);
  const dspRev = CLIENTS.filter(c => c.pricing.includes("DSP")).reduce((s, c) => s + c.rev[c.rev.length-1], 0);

  const pieData = [
    { name: "Ad Serving", value: adServingRev, color: "#06b6d4" },
    { name: "DSP", value: dspRev, color: "#8b5cf6" },
  ];

  // Client detail
  const detail = selectedClient ? CLIENTS.find(c => c.id === selectedClient) : null;
  const detailSentiment = detail ? (clientOverrides[detail.id]?.sentiment ?? detail.sentiment) : "neutral";
  const detailPricing = detail ? (clientOverrides[detail.id]?.pricing ?? detail.pricing[0]) : "Ad Serving";
  const detailPlan = detail ? (clientOverrides[detail.id]?.plan ?? detail.plan) : "Core";

  // Invoice generation
  function openInvoice(client: Client) {
    const invNum = `EX/2026/${String(client.id).padStart(5, "0")}`;
    const months = [
      { label: "November 2025", idx: 3 },
      { label: "December 2025", idx: 4 },
      { label: "January 2026", idx: 5 },
    ];
    const isOnboarding = client.status === "onboarding";
    let grandTotal = 0;
    let grandUntaxed = 0;
    let grandDiscount = 0;

    const monthRows = months.map((m, mi) => {
      const adReqBase = client.adReqs[m.idx] * 1_000_000_000;
      const variance = 1 + (Math.random() * 0.06 - 0.03);
      const adReqQty = Math.round(adReqBase * variance);
      const adUnitPrice = 0.0000100;
      const adAmount = adReqQty * adUnitPrice;

      const cdnGB = Math.round(adReqQty * 0.6 / 1_000_000);
      const cdnUnitPrice = 0.0100000;
      const cdnAmount = cdnGB * cdnUnitPrice;

      let monthSubtotal = adAmount + cdnAmount;
      let discount = 0;
      if (isOnboarding && mi === 0) {
        discount = monthSubtotal * 0.5;
        monthSubtotal -= discount;
      }
      grandTotal += monthSubtotal;
      grandUntaxed += adAmount + cdnAmount;
      grandDiscount += discount;

      return `
        <tr style="background:#f8fafc"><td colspan="5" style="padding:8px 12px;font-weight:600;color:#1e40af;border:1px solid #e2e8f0;">${m.label}</td></tr>
        <tr>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;">Ad requests</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${adReqQty.toLocaleString()}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${adUnitPrice.toFixed(7)}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${discount > 0 ? "50%" : "-"}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:500">\u20AC${(adAmount - (discount > 0 ? adAmount * 0.5 : 0)).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;">CDN (GB) Video</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${cdnGB.toLocaleString()}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${cdnUnitPrice.toFixed(7)}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${discount > 0 ? "50%" : "-"}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:500">\u20AC${(cdnAmount - (discount > 0 ? cdnAmount * 0.5 : 0)).toFixed(2)}</td>
        </tr>
        <tr style="background:#f1f5f9">
          <td colspan="4" style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:600">Subtotal ${m.label}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:600">\u20AC${monthSubtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const html = `<!DOCTYPE html><html><head><title>Invoice ${invNum} - ${client.name}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:0 auto;padding:30px;color:#1e293b}
      table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:white;padding:8px 12px;text-align:left;font-size:13px}
      td{font-size:13px}.header{display:flex;justify-content:space-between;margin-bottom:30px}
      .logo{font-size:24px;font-weight:bold;color:#1e3a5f}.addr{font-size:11px;color:#64748b;line-height:1.6}
      .inv-details{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;display:flex;justify-content:space-between}
      .inv-details div{font-size:13px;line-height:1.8}.total-row{background:#1e3a5f;color:white}
      .total-row td{padding:10px 12px;font-weight:bold;font-size:15px}</style></head>
    <body>
      <div class="header">
        <div>
          <div class="logo">EXADS</div>
          <div class="addr">Smart Advertising Technology Limited T/A EXADS<br>
          Workhub, Office 1.6, 6 Fern Road<br>Sandyford, Co. Dublin D18 FP98<br>Ireland<br>VAT: IE3179817IH</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:bold;color:#1e3a5f">INVOICE</div>
          <div style="font-size:14px;color:#64748b;margin-top:4px">${invNum}</div>
        </div>
      </div>
      <div class="inv-details">
        <div><strong>Bill To:</strong><br>${client.name}${client.tradingName ? `<br><span style="color:#64748b">${client.tradingName}</span>` : ""}<br>Client ID: ${client.id}</div>
        <div style="text-align:right"><strong>Invoice Date:</strong> 31/01/2026<br><strong>Due Date:</strong> 15/02/2026<br><strong>Currency:</strong> EUR<br><strong>Pricing:</strong> ${detailPricing}</div>
      </div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Quantity</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Discount</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          ${monthRows}
          <tr style="border-top:2px solid #cbd5e1">
            <td colspan="4" style="padding:8px 12px;text-align:right;font-size:13px">Untaxed Amount</td>
            <td style="padding:8px 12px;text-align:right;font-weight:600">\u20AC${grandUntaxed.toFixed(2)}</td>
          </tr>
          ${grandDiscount > 0 ? `<tr><td colspan="4" style="padding:6px 12px;text-align:right;font-size:13px;color:#dc2626">Discount</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#dc2626">-\u20AC${grandDiscount.toFixed(2)}</td></tr>` : ""}
          <tr>
            <td colspan="4" style="padding:6px 12px;text-align:right;font-size:13px">Taxes (0%)</td>
            <td style="padding:6px 12px;text-align:right;font-weight:600">\u20AC0.00</td>
          </tr>
          <tr class="total-row">
            <td colspan="4" style="text-align:right">Total</td>
            <td style="text-align:right">\u20AC${grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:30px;padding:16px;background:#f8fafc;border-radius:8px;font-size:11px;color:#64748b">
        <strong>Payment Terms:</strong> Net 15 days. Please reference invoice number ${invNum} with your payment.<br>
        <strong>Bank:</strong> AIB Bank, IBAN: IE12 AIBK 9311 5212 3456 78, BIC: AIBKIE2D
      </div>
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: "\u25C9" },
    { id: "sales", label: "Sales", icon: "\u25B2" },
    { id: "alerts", label: "Alerts", icon: "\u26A0", count: alerts.filter(a => a.severity === "critical" || a.severity === "warning").length },
    { id: "clients", label: "Clients", icon: "\u25EB" },
    { id: "pipelines", label: "Pipelines", icon: "\u25C8" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Radial gradient background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#0a0a0f] to-[#0a0a0f] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-slate-800/40 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-white tracking-tight">EXADS</div>
              <div className="text-sm text-cyan-400 font-medium">Revenue Intelligence</div>
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
                {n.count !== undefined && n.count > 0 && (
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
                <StatCard label="Total MRR" value={`\u20AC${totalMRR.toLocaleString()}`} sub={`Target: \u20AC${MRR_TARGET.toLocaleString()}`} trend={mrrChange} />
                <StatCard label="Paying Clients" value={CLIENTS.filter(c=>c.status==="active" || c.status==="warning" || c.status==="critical" || c.status==="declining").length} sub={`${CLIENTS.filter(c=>c.status==="onboarding").length} onboarding \u00B7 ${CLIENTS.filter(c=>c.status==="testing").length} testing`} color="text-emerald-400" />
                <StatCard label="Avg Revenue" value={`\u20AC${avgRev.toLocaleString()}`} sub="per active client" color="text-amber-400" />
                <StatCard label="Ad Requests" value={`${totalAdReqs.toFixed(1)}B`} sub="this month" color="text-purple-400" />
                <StatCard label="Top 3 Share" value={`${top3Pct}%`} sub={sortedByRev.slice(0,3).map(c=>c.name).join(", ")} color={parseFloat(top3Pct) > 65 ? "text-red-400" : "text-cyan-400"} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Alerts Summary */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-300">Active Alerts</div>
                    <button onClick={() => setView("alerts")} className="text-xs text-cyan-400 hover:text-cyan-300">{`View all \u2192`}</button>
                  </div>
                  <div className="space-y-1.5">
                    {alerts.slice(0, 5).map((a, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${severityConfig[a.severity].text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${severityConfig[a.severity].dot}`} />
                        <span className="text-slate-300 truncate">{a.client}</span>
                        <span className="text-slate-500 ml-auto text-xs whitespace-nowrap">{a.severity}</span>
                      </div>
                    ))}
                    {alerts.length > 5 && <div className="text-xs text-slate-500">+{alerts.length - 5} more</div>}
                  </div>
                </div>

                {/* Revenue Split Pie */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-slate-300 mb-2">Revenue Split</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }} formatter={(v: number) => `\u20AC${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="text-cyan-400">{"\u25CF"} Ad Serving {((adServingRev/totalMRR)*100).toFixed(0)}%</span>
                    <span className="text-purple-400">{"\u25CF"} DSP {((dspRev/totalMRR)*100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* MRR Progress */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-slate-300 mb-3">MRR to Target</div>
                  <div className="flex items-end gap-2 mb-4">
                    <div className="text-3xl font-bold text-cyan-400 tabular-nums">{((totalMRR/MRR_TARGET)*100).toFixed(0)}%</div>
                    <div className="text-xs text-slate-500 mb-1">of {"\u20AC"}100k target</div>
                  </div>
                  <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all" style={{ width: `${(totalMRR/MRR_TARGET*100).toFixed(0)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{"\u20AC"}{totalMRR.toLocaleString()}</span>
                    <span>{"\u20AC"}{MRR_TARGET.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-1">Gap to close</div>
                    <div className="text-lg font-bold text-amber-400 tabular-nums">{"\u20AC"}{(MRR_TARGET - totalMRR).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Network Revenue */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-300">Network Revenue (All EXADS)</div>
                    <span className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">Platform-wide</span>
                  </div>
                  <div className="text-xs text-slate-400">This month: <span className="text-white font-bold tabular-nums">{"\u20AC"}{NETWORK_REVENUE[NETWORK_REVENUE.length-1].total.toLocaleString()}</span></div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={NETWORK_REVENUE}>
                    <defs>
                      <linearGradient id="gNet1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gNet2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => `\u20AC${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }} formatter={(v: number) => [`\u20AC${v.toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Area type="monotone" dataKey="adServing" stackId="1" stroke="#06b6d4" fill="url(#gNet1)" strokeWidth={2} name="Ad Serving" />
                    <Area type="monotone" dataKey="dsp" stackId="1" stroke="#8b5cf6" fill="url(#gNet2)" strokeWidth={2} name="DSP" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Client Table */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/30">
                  <div className="text-sm font-semibold text-slate-300">Client Portfolio</div>
                  <button onClick={() => setView("clients")} className="text-xs text-cyan-400 hover:text-cyan-300">{`Full view \u2192`}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/30 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="text-left px-3 py-2 font-medium">Client</th>
                        <th className="text-left px-3 py-2 font-medium">Tier</th>
                        <th className="text-center px-1 py-2 font-medium">{"\u263A"}</th>
                        <th className="text-right px-3 py-2 font-medium">MRR</th>
                        <th className="text-right px-3 py-2 font-medium">MoM</th>
                        <th className="text-right px-3 py-2 font-medium">Cost %</th>
                        <th className="text-right px-3 py-2 font-medium w-24">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedByRev.filter(c => c.rev[c.rev.length-1] > 0).slice(0, 8).map(c => (
                        <ClientRow key={c.id} client={c} onClick={() => { setSelectedClient(c.id); setView("clients"); }} selected={selectedClient === c.id} sentimentOverride={clientOverrides[c.id]?.sentiment} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ SALES TAB ═══════ */}
          {view === "sales" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-lg font-bold text-white">Sales</div>
                <div className="text-sm text-slate-500">Revenue tracking & targets</div>
              </div>

              {/* Revenue Forecast */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-300">Revenue Forecast</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      forecastData.confidence === "High" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                      forecastData.confidence === "Medium" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                      "bg-red-500/15 text-red-400 border border-red-500/30"
                    }`}>
                      {forecastData.confidence} confidence
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">Based on weighted 3-month trends</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {forecastData.months.map((m, i) => {
                    const prevVal = i === 0 ? totalMRR : forecastData.months[i - 1].value;
                    const change = prevVal > 0 ? ((m.value - prevVal) / prevVal) * 100 : 0;
                    const target = MRR_TARGET;
                    const attainment = ((m.value / target) * 100).toFixed(0);
                    return (
                      <div key={m.label} className="bg-slate-900/50 rounded-lg p-4">
                        <div className="text-xs text-slate-500 mb-1">{m.label} 2026</div>
                        <div className="text-xl font-bold text-cyan-400 tabular-nums">{"\u20AC"}{m.value.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {change >= 0 ? "\u2191" : "\u2193"}{Math.abs(change).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">vs {i === 0 ? "Jan" : forecastData.months[i-1].label}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700/30">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">vs Target</span>
                            <span className={`font-medium ${parseInt(attainment) >= 80 ? "text-emerald-400" : "text-amber-400"}`}>{attainment}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${parseInt(attainment) >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, parseInt(attainment))}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue Split + KPIs + Pipeline Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-slate-300 mb-2">Revenue by Pricing</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }} formatter={(v: number) => `\u20AC${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="text-cyan-400">{"\u25CF"} Ad Serving {"\u20AC"}{adServingRev.toLocaleString()}</span>
                    <span className="text-purple-400">{"\u25CF"} DSP {"\u20AC"}{dspRev.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-slate-300 mb-3">Revenue KPIs</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Total MRR</span>
                      <span className="text-sm font-bold text-cyan-400 tabular-nums">{"\u20AC"}{totalMRR.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Target</span>
                      <span className="text-sm font-bold text-slate-300 tabular-nums">{"\u20AC"}{MRR_TARGET.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Attainment</span>
                      <span className={`text-sm font-bold tabular-nums ${totalMRR/MRR_TARGET >= 0.8 ? "text-emerald-400" : "text-amber-400"}`}>{((totalMRR/MRR_TARGET)*100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Gap</span>
                      <span className="text-sm font-bold text-amber-400 tabular-nums">{"\u20AC"}{(MRR_TARGET - totalMRR).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Avg per Client</span>
                      <span className="text-sm font-bold text-slate-300 tabular-nums">{"\u20AC"}{avgRev.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">MoM Growth</span>
                      <span className={`text-sm font-bold tabular-nums ${mrrChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>{mrrChange >= 0 ? "+" : ""}{mrrChange.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">12m Growth</span>
                      <span className={`text-sm font-bold tabular-nums ${totalMRR >= 42500 ? "text-emerald-400" : "text-red-400"}`}>{totalMRR >= 42500 ? "+" : ""}{(((totalMRR - 42500) / 42500) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* MRR to Target Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-2">MRR to Target Progress</div>
                    <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${(totalMRR/MRR_TARGET*100).toFixed(0)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{"\u20AC"}{totalMRR.toLocaleString()}</span>
                      <span>{"\u20AC"}{MRR_TARGET.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-300">Sales Pipeline</div>
                    <div className="text-xs text-slate-500">{PIPELINE.qualified + PIPELINE.proposal + PIPELINE.negotiation + PIPELINE.closed} deals</div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { stage: "Qualified", count: PIPELINE.qualified, value: PIPELINE.qualifiedVal, color: "text-cyan-400" },
                      { stage: "Proposal", count: PIPELINE.proposal, value: PIPELINE.proposalVal, color: "text-purple-400" },
                      { stage: "Negotiation", count: PIPELINE.negotiation, value: PIPELINE.negotiationVal, color: "text-amber-400" },
                      { stage: "Closed Won", count: PIPELINE.closed, value: PIPELINE.closedVal, color: "text-emerald-400" },
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{s.stage} ({s.count})</span>
                        <span className={`text-sm font-bold tabular-nums ${s.color}`}>{"\u20AC"}{s.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">Total Pipeline</span>
                      <span className="text-sm font-bold text-white tabular-nums">{"\u20AC"}{(PIPELINE.qualifiedVal + PIPELINE.proposalVal + PIPELINE.negotiationVal + PIPELINE.closedVal).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700/30">
                    <div className="text-sm font-semibold text-slate-300 mb-2">Top 5 by MRR</div>
                    <div className="space-y-1.5">
                      {sortedByRev.slice(0, 5).map((c, i) => {
                        const curr = c.rev[c.rev.length-1];
                        const pct = (curr / totalMRR * 100);
                        return (
                          <div key={c.id} className="flex justify-between text-xs">
                            <span className="text-slate-300">{i+1}. {c.name}</span>
                            <span className="text-slate-400 tabular-nums">{"\u20AC"}{curr.toLocaleString()} ({pct.toFixed(0)}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* MRR vs Target Chart (with forecast) */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-semibold text-slate-300">MRR vs Target (Monthly)</div>
                  <span className="text-[10px] bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">Dashed = Forecast</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={MRR_YEARLY_DATA} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => `\u20AC${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }}
                      formatter={(v: number, name: string) => {
                        return [`\u20AC${v.toLocaleString()}`, name === "actual" ? "Actual" : "Target"];
                      }}
                      labelFormatter={(label: string) => label.includes("\u2019") ? `${label} (Forecast)` : label}
                    />
                    <Legend
                      formatter={(value: string) => value === "actual" ? "Actual / Forecast" : "Target"}
                      wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                    />
                    <ReferenceLine x="Dec" stroke="#334155" strokeDasharray="6 3" label={{ value: "Forecast \u2192", position: "top", fill: "#64748b", fontSize: 10 }} />
                    <Bar
                      dataKey="actual"
                      radius={[3, 3, 0, 0]}
                      name="actual"
                      shape={(props: unknown) => {
                        const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: { isForecast: boolean } };
                        if (payload.isForecast) {
                          return (
                            <rect x={x} y={y} width={width} height={height} rx={3} ry={3}
                              fill="#06b6d4" fillOpacity={0.2} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
                          );
                        }
                        return <rect x={x} y={y} width={width} height={height} rx={3} ry={3} fill="#06b6d4" />;
                      }}
                    />
                    <Bar dataKey="target" fill="#475569" radius={[3, 3, 0, 0]} name="target" opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by Tier */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                <div className="text-sm font-semibold text-slate-300 mb-3">Monthly Revenue by Tier</div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revOverTime}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="100%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => `\u20AC${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }} formatter={(v: number) => [`\u20AC${v.toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Area type="monotone" dataKey="t1" stackId="1" stroke="#06b6d4" fill="url(#g1)" strokeWidth={2} name="Tier 1" />
                    <Area type="monotone" dataKey="t2" stackId="1" stroke="#8b5cf6" fill="url(#g2)" strokeWidth={2} name="Tier 2" />
                    <Area type="monotone" dataKey="t3" stackId="1" stroke="#22c55e" fill="url(#g3)" strokeWidth={2} name="Tier 3 & New" />
                  </AreaChart>
                </ResponsiveContainer>
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
                  {(["all", "critical", "warning", "trend", "positive"] as const).map(f => (
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
          {view === "clients" && (() => {
            const displayClients = clientTab === "new"
              ? sortedByRev.filter(c => c.tier === "New" || c.status === "onboarding" || c.status === "testing" || c.status === "churn")
              : sortedByRev;
            return (
            <div key="clients-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {([
                      { key: "all" as const, label: "All Clients" },
                      { key: "new" as const, label: "New (last 60 days)" },
                    ]).map(t => (
                      <button
                        key={t.key}
                        onClick={() => setClientTab(t.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          clientTab === t.key
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/40"
                            : "text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                      >
                        {t.label}
                        {t.key === "new" && (
                          <span className="ml-1.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0 rounded-full">
                            {CLIENTS.filter(c => c.tier === "New" || c.status === "onboarding").length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">{displayClients.length} clients</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/30 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="text-left px-3 py-2 font-medium">Client</th>
                        <th className="text-left px-3 py-2 font-medium">Tier</th>
                        <th className="text-center px-1 py-2 font-medium">{"\u263A"}</th>
                        <th className="text-right px-3 py-2 font-medium">MRR</th>
                        <th className="text-right px-3 py-2 font-medium">MoM</th>
                        <th className="text-right px-3 py-2 font-medium">Cost %</th>
                        <th className="text-right px-3 py-2 font-medium w-24">6m Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayClients.map(c => (
                        <ClientRow key={c.id} client={c} onClick={() => setSelectedClient(c.id)} selected={selectedClient === c.id} sentimentOverride={clientOverrides[c.id]?.sentiment} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Client Detail */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
                {detail ? (
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        detail.status === "active" ? "bg-emerald-500" : detail.status === "critical" ? "bg-red-500" : detail.status === "warning" ? "bg-amber-500" : detail.status === "declining" ? "bg-orange-500" : detail.status === "testing" ? "bg-violet-500" : detail.status === "churn" ? "bg-slate-500" : "bg-cyan-500"
                      }`} />
                      <div className="text-base font-bold text-white">{detail.name}</div>
                    </div>
                    {detail.tradingName && (
                      <div className="text-xs text-slate-500 mb-1 ml-5">a.k.a. {detail.tradingName}</div>
                    )}
                    <div className="ml-5 mb-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-medium bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">{detail.vertical}</span>
                      <span className="text-[10px] text-slate-500">{detail.language}</span>
                      <span className="text-[10px] text-slate-600">|</span>
                      <span className="text-[10px] text-slate-500">{detail.currency}</span>
                    </div>

                    {/* Client info blurb */}
                    <div className="mb-4 bg-slate-900/50 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-400 leading-relaxed">{detail.blurb}</div>
                    </div>

                    {/* Sentiment faces */}
                    <div className="mb-4">
                      <div className="text-xs text-slate-500 font-medium mb-2">Sentiment</div>
                      <div className="flex items-center gap-2">
                        {SENTIMENTS.map(s => (
                          <SentimentFace
                            key={s}
                            sentiment={s}
                            size={detailSentiment === s ? 32 : 26}
                            selected={detailSentiment === s}
                            onClick={() => setClientOverrides(prev => ({
                              ...prev,
                              [detail.id]: { ...prev[detail.id], sentiment: s }
                            }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Pricing (Ad Serving / DSP) — edit to change */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-500 font-medium">Pricing</div>
                        <button
                          onClick={() => setEditingPricing(editingPricing === detail.id ? null : detail.id)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {editingPricing === detail.id ? "Done" : "Edit"}
                        </button>
                      </div>
                      {editingPricing === detail.id ? (
                        <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
                          {(["Ad Serving", "DSP"] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => {
                                setClientOverrides(prev => ({
                                  ...prev,
                                  [detail.id]: { ...prev[detail.id], pricing: p }
                                }));
                                setEditingPricing(null);
                              }}
                              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                                detailPricing === p
                                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                                  : "bg-slate-800/40 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {detail.pricing.map(p => (
                            <div key={p} className="bg-slate-900/50 rounded-lg px-3 py-2">
                              <span className="text-xs text-slate-200 font-medium">{p}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Plan (Enterprise > Business > Pro > Core) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-500 font-medium">Plan</div>
                        <button
                          onClick={() => setEditingPlan(editingPlan === detail.id ? null : detail.id)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {editingPlan === detail.id ? "Done" : "Edit"}
                        </button>
                      </div>
                      {editingPlan === detail.id ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["Enterprise", "Business", "Pro", "Core"] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => {
                                setClientOverrides(prev => ({
                                  ...prev,
                                  [detail.id]: { ...prev[detail.id], plan: p }
                                }));
                                setEditingPlan(null);
                              }}
                              className={`py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                                detailPlan === p
                                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                                  : "bg-slate-800/40 text-slate-500 hover:text-slate-300 border-slate-700/50"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-slate-200 font-medium">{detailPlan}</span>
                          {detailPlan !== "Enterprise" && (
                            <span className="text-[10px] text-purple-400">
                              {"\u2191"} {detailPlan === "Core" ? "Pro" : detailPlan === "Pro" ? "Business" : "Enterprise"} available
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">Tier</span><div className="text-slate-200 font-medium">{detail.tier}</div></div>
                      <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">Status</span><div className="text-slate-200 font-medium capitalize">{detail.status}</div></div>
                      <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">MRR</span><div className="text-cyan-400 font-bold">{"\u20AC"}{detail.rev[detail.rev.length-1].toLocaleString()}</div></div>
                      <div className="bg-slate-900/50 rounded-lg p-2"><span className="text-slate-500">Ad Reqs</span><div className="text-purple-400 font-bold">{detail.adReqs[detail.adReqs.length-1].toFixed(1)}B</div></div>
                    </div>

                    {/* Tickets */}
                    <div className="mb-4">
                      <div className="text-xs text-slate-500 font-medium mb-2">Tickets this month</div>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{detail.tickets.open}</span>
                          <span className="text-xs text-slate-400">Open</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{detail.tickets.resolved}</span>
                          <span className="text-xs text-slate-400">Resolved</span>
                        </div>
                      </div>
                    </div>

                    {/* Upsell Opportunity */}
                    {detail.upsell && (
                      <div className="mb-4">
                        <div className="text-xs text-slate-500 font-medium mb-2">Upsell Opportunity</div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-2.5">
                          <div className="text-xs font-medium text-purple-300">{"\u2728"} {detail.upsell}</div>
                        </div>
                      </div>
                    )}

                    {/* Revenue chart */}
                    <div className="text-xs text-slate-500 mb-2 font-medium">Revenue Trend (6m)</div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={detail.rev.map((v,i) => ({ month: MONTHS_LABELS[i], rev: v, cost: detail.cost[i] }))}>
                        <defs>
                          <linearGradient id="detailG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickFormatter={(v: number) => `\u20AC${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }} formatter={(v: number) => `\u20AC${v.toLocaleString()}`} />
                        <Area type="monotone" dataKey="rev" stroke="#06b6d4" fill="url(#detailG)" strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Cost" />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Billing */}
                    {(() => {
                      const r = detail.rev;
                      const currentDay = 9;
                      const daysInMonth = 28;
                      const mtdEstimate = r[5] * (currentDay / daysInMonth);
                      const forecast = r[5] * 0.5 + r[4] * 0.3 + r[3] * 0.2;
                      const prev = r[5];
                      const forecastChange = prev > 0 ? ((forecast - prev) / prev) * 100 : 0;
                      const last3Avg = (r[5] + r[4] + r[3]) / 3;
                      // Growth multiplier for fast-growing onboarding clients
                      const momGrowth = r[4] > 0 ? ((r[5] - r[4]) / r[4]) : 0;
                      const adjustedForecast = (detail.status === "onboarding" && momGrowth > 0.5)
                        ? forecast * 1.2
                        : forecast;
                      const adjustedChange = prev > 0 ? ((adjustedForecast - prev) / prev) * 100 : 0;
                      return (
                        <div className="mt-4">
                          <div className="text-xs text-slate-500 font-medium mb-2">Billing</div>
                          <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-xs font-mono">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Current month ({currentDay}d/{daysInMonth}d)</span>
                              <span className="text-slate-200 font-medium">{"\u20AC"}{Math.round(mtdEstimate).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Forecast (Feb)</span>
                              <span className="flex items-center gap-1.5">
                                <span className="text-cyan-400 font-medium">{"\u20AC"}{Math.round(adjustedForecast).toLocaleString()}</span>
                                <span className={`text-[10px] font-bold ${adjustedChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {adjustedChange >= 0 ? "\u2191" : "\u2193"}{Math.abs(adjustedChange).toFixed(0)}%
                                </span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Last 3m avg</span>
                              <span className="text-slate-300 font-medium">{"\u20AC"}{Math.round(last3Avg).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actions: Invoice + Odoo */}
                    <div className="mt-4 space-y-2">
                      <div className="w-full py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-xs font-medium text-slate-300 text-center">
                        Latest Invoice
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-3 mb-1.5">Finance</div>
                      <div className="flex gap-2">
                        <a
                          href={`https://exads.odoo.com/web#model=res.partner&id=${detail.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 text-center bg-slate-800/50 border border-slate-700/40 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                        >
                          View in Odoo {"\u2197"}
                        </a>
                        <a
                          href={`https://exads.odoo.com/web#model=account.move&partner_id=${detail.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 text-center bg-slate-800/50 border border-slate-700/40 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                        >
                          Invoices {"\u2197"}
                        </a>
                      </div>
                    </div>

                    {/* Client alerts */}
                    {alerts.filter(a => a.client === detail.name).length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <div className="text-xs text-slate-500 font-medium mb-1">Alerts</div>
                        {alerts.filter(a => a.client === detail.name).map((a, i) => (
                          <div key={i} className={`text-xs p-2 rounded-lg ${severityConfig[a.severity].bg} border ${severityConfig[a.severity].border}`}>
                            <span className={`font-bold uppercase ${severityConfig[a.severity].text}`}>{a.severity}:</span>{" "}
                            <span className="text-slate-300">{a.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <div className="text-3xl mb-2">{"\u25EB"}</div>
                    <div className="text-sm">Select a client to view details</div>
                  </div>
                )}
              </div>
            </div>
          );})()}

          {/* ═══════ PIPELINES TAB ═══════ */}
          {view === "pipelines" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
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

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/30 rounded-xl p-4 backdrop-blur-xl">
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
                <div className="text-xs text-slate-500 border-t border-slate-700/30 pt-3">
                  <div className="font-medium text-slate-400 mb-1">Resolution Rate</div>
                  <div className="text-lg font-bold text-emerald-400">{((HUBSPOT_TICKETS.resolved / (HUBSPOT_TICKETS.open + HUBSPOT_TICKETS.pending + HUBSPOT_TICKETS.resolved)) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}