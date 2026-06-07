import { useState, useEffect, useRef, useCallback } from "react";

const USERS_KEY = "wk-users-v1";
const ACTIVE_USER_KEY = "wk-active-user";
function getStorageKey(uid) { return "workout-log-v5-" + uid; }
function getCardioKey(uid) { return "cardio-log-v1-" + uid; }
function getNutrKey(uid) { return "nutrition-log-v1-" + uid; }
// Legacy keys for user 1 migration
const STORAGE_KEY = "workout-log-v5";
const CARDIO_KEY = "cardio-log-v1";
const NUTR_LEGACY_KEY = "nutrition-log-v1";
const TODAY = new Date().toISOString().split("T")[0];
const MUSCLE_GROUPS = ["Back","Biceps","Triceps","Shoulders","Chest","Legs","Core","Cardio","Warmup","Other"];
const GROUP_COLORS = {
  Back:"#C8F5A0", Biceps:"#A0D4F5", Triceps:"#F5A0D4", Shoulders:"#F5C8A0", Chest:"#F5A0A0",
  Legs:"#D4A0F5", Core:"#F5F0A0", Cardio:"#A0F5D4", Warmup:"#E0E0E0", Other:"#C8C8C8",
};

// ── Exercise Library ───────────────────────────────────────────────────
const EXERCISE_LIBRARY = {
  Back: ["Pull-ups","Chin-ups","Barbell row","Dumbbell row","Seated cable row","Cable pulldown","Lat pulldown","Straight arm lat pulldowns","T-bar row","Pendlay row","Single arm row","Meadows row","Rack pull","Deadlift","Romanian deadlift","Good mornings","Hyperextension","Reverse hyperextension","Face pull","Cable row"],
  Biceps: ["Barbell bicep curl","Dumbbell bicep curl","Hammer curl","Preacher curl","Concentration curl","Incline dumbbell curl","Cable curl","EZ bar curl","Spider curl","Reverse curl","Zottman curl","Machine curl"],
  Triceps: ["Tricep pushdown","Overhead tricep extension","Skull crusher","Close grip bench press","Dips","Diamond push-ups","Tricep kickback","Cable overhead extension","JM press","Tate press"],
  Shoulders: ["Shoulder press","Dumbbell shoulder press","Arnold press","Lateral raise","Front raise","Reverse fly","Upright row","Face pull","Cable lateral raise","Machine shoulder press","Shrugs","Behind neck press"],
  Chest: ["Bench press","Incline bench press","Decline bench press","Dumbbell bench press","Incline dumbbell press","Dumbbell fly","Cable fly","Pec deck","Push-ups","Dips","Landmine press","Machine chest press"],
  Legs: ["Squat","Back squat","Front squat","Leg press","Romanian deadlift","Bulgarian split squat","Lunge","Walking lunge","Leg extension","Leg curl","Prone leg curl","Hip thrust","Glute bridge","Calf raise","Seated calf raise","Hack squat","Step-up","Sumo squat","Goblet squat","Hip adductors","Hip abductors","Leg press calf raise"],
  Core: ["Plank","Side plank","Crunch","Sit-up","Reverse crunch","Leg raise","Hanging leg raise","Russian twist","Cable crunch","Ab wheel rollout","Deadbug","Bird dog","Hollow hold","Pallof press","V-up","Toe touch","Flutter kicks","Mountain climbers"],
  Cardio: ["Outdoor walk","Outdoor run","Treadmill run","Treadmill walk","Stationary bike","Rowing machine","Elliptical","Stair climber","Jump rope","Box jumps","Burpees","Jumping jacks"],
  Warmup: ["Push-ups","Band pull-apart","Shoulder circles","Hip circles","Leg swings","Cat-cow","World's greatest stretch","Inchworm","Jumping jacks","Light jog"],
  Other: [],
};

// ── Pre-built Workout Templates ────────────────────────────────────────
const WORKOUT_TEMPLATES = [
  { key:"push", label:"Push Day", icon:"💪", color:"#F5A0A0", exercises:[
    {name:"Bench press",group:"Chest",sets:4,reps:8,weight:""},
    {name:"Incline dumbbell press",group:"Chest",sets:3,reps:10,weight:""},
    {name:"Shoulder press",group:"Shoulders",sets:3,reps:10,weight:""},
    {name:"Lateral raise",group:"Shoulders",sets:3,reps:12,weight:""},
    {name:"Tricep pushdown",group:"Triceps",sets:3,reps:12,weight:""},
    {name:"Overhead tricep extension",group:"Triceps",sets:3,reps:12,weight:""},
  ]},
  { key:"pull", label:"Pull Day", icon:"🏋️", color:"#C8F5A0", exercises:[
    {name:"Deadlift",group:"Back",sets:4,reps:5,weight:""},
    {name:"Pull-ups",group:"Back",sets:3,reps:8,weight:""},
    {name:"Seated cable row",group:"Back",sets:3,reps:10,weight:""},
    {name:"Lat pulldown",group:"Back",sets:3,reps:12,weight:""},
    {name:"Barbell bicep curl",group:"Biceps",sets:3,reps:10,weight:""},
    {name:"Hammer curl",group:"Biceps",sets:3,reps:12,weight:""},
  ]},
  { key:"legs", label:"Leg Day", icon:"🦵", color:"#D4A0F5", exercises:[
    {name:"Squat",group:"Legs",sets:4,reps:6,weight:""},
    {name:"Romanian deadlift",group:"Legs",sets:3,reps:10,weight:""},
    {name:"Leg press",group:"Legs",sets:3,reps:12,weight:""},
    {name:"Bulgarian split squat",group:"Legs",sets:3,reps:10,weight:""},
    {name:"Leg curl",group:"Legs",sets:3,reps:12,weight:""},
    {name:"Calf raise",group:"Legs",sets:4,reps:15,weight:""},
  ]},
  { key:"upper", label:"Upper Body", icon:"⬆️", color:"#F5C8A0", exercises:[
    {name:"Bench press",group:"Chest",sets:3,reps:8,weight:""},
    {name:"Barbell row",group:"Back",sets:3,reps:8,weight:""},
    {name:"Shoulder press",group:"Shoulders",sets:3,reps:10,weight:""},
    {name:"Pull-ups",group:"Back",sets:3,reps:8,weight:""},
    {name:"Barbell bicep curl",group:"Biceps",sets:3,reps:10,weight:""},
    {name:"Tricep pushdown",group:"Triceps",sets:3,reps:12,weight:""},
  ]},
  { key:"fullbody", label:"Full Body", icon:"⚡", color:"#F5F0A0", exercises:[
    {name:"Squat",group:"Legs",sets:3,reps:8,weight:""},
    {name:"Bench press",group:"Chest",sets:3,reps:8,weight:""},
    {name:"Deadlift",group:"Back",sets:3,reps:6,weight:""},
    {name:"Shoulder press",group:"Shoulders",sets:3,reps:10,weight:""},
    {name:"Pull-ups",group:"Back",sets:3,reps:8,weight:""},
    {name:"Plank",group:"Core",sets:3,reps:1,weight:""},
  ]},
  { key:"core", label:"Core & Abs", icon:"🎯", color:"#F5F0A0", exercises:[
    {name:"Plank",group:"Core",sets:3,reps:1,weight:""},
    {name:"Deadbug",group:"Core",sets:3,reps:10,weight:""},
    {name:"Hanging leg raise",group:"Core",sets:3,reps:12,weight:""},
    {name:"Russian twist",group:"Core",sets:3,reps:20,weight:""},
    {name:"Ab wheel rollout",group:"Core",sets:3,reps:10,weight:""},
    {name:"Pallof press",group:"Core",sets:3,reps:12,weight:""},
  ]},
];

const FATIGUE_COLORS = {
  fresh:      { fill:"#2A4A1A", stroke:"#6ABF3A", label:"Fresh" },
  recovering: { fill:"#3A3A10", stroke:"#C8B840", label:"Recovering" },
  sore:       { fill:"#4A2020", stroke:"#FF8040", label:"Sore" },
  fatigued:   { fill:"#5A1010", stroke:"#FF3A3A", label:"Fatigued" },
};
const SEED_DATE = "2026-05-09";
const SEED_DATE2 = "2026-05-10";
const SEED_DATE3 = "2026-05-14";
// Cardio seed data
const CARDIO_SEEDS = {
  "2026-05-09": [
    { id: 1001, type:"walk", label:"Walk", icon:"🚶", color:"#A0F5D4", date:"2026-05-09",
      duration: 30, distance: 2, pace:"", temp:"", style:"", notes:"Outdoor", feel: 4 }
  ],
  "2026-05-14": [
    { id: 1002, type:"run", label:"Run", icon:"🏃", color:"#F5A0A0", date:"2026-05-14",
      duration: 37, distance: 3.7, pace:"10:00", temp:"", style:"", notes:"", feel: 4 },
    { id: 1003, type:"yoga", label:"Hot Yoga", icon:"🧘", color:"#F5C8A0", date:"2026-05-14",
      duration: 60, distance: 0, pace:"", temp:"", style:"Hot Power", notes:"", feel: 4 }
  ],
};

const SEED_DATE4 = "2026-05-13";
const SEED_EX4 = [
  { id:301, group:"Legs", name:"Hip adductors",        sets:2, reps:10, weight:70 },
  { id:302, group:"Core", name:"Deadbug",               sets:1, reps:25, weight:"" },
  { id:303, group:"Core", name:"Reverse crunch",        sets:3, reps:10, weight:25 },
  { id:304, group:"Legs", name:"Bulgarian split squat", sets:3, reps:10, weight:50 },
  { id:305, group:"Legs", name:"Prone leg curl",        sets:3, reps:10, weight:50 },
  { id:306, group:"Legs", name:"Hip thrust",            sets:3, reps:10, weight:120 },
];
const SEED_EX3 = [
  { id:201, group:"Chest",   name:"Dumbbell incline bench",            sets:3, reps:10, weight:45,   weightMode:"pair", note:"x2 dumbbells (90 lbs total)" },
  { id:202, group:"Chest",   name:"Cable fly",                          sets:4, reps:10, weight:27.5, weightMode:"single" },
  { id:203, group:"Triceps", name:"Cable tricep bar",                   sets:3, reps:10, weight:40,   weightMode:"single" },
  { id:204, group:"Triceps", name:"Single arm cable tricep extension",  sets:3, reps:10, weight:15,   weightMode:"single" },
  { id:205, group:"Triceps", name:"Dumbbell tricep extension",          sets:3, reps:10, weight:25,   weightMode:"pair", note:"x2 dumbbells (50 lbs total)" },
];
const SEED_EX2 = [
  { id:101, group:"Legs", name:"Hip adductors",        sets:2, reps:10, weight:70 },
  { id:102, group:"Core", name:"Deadbug",               sets:1, reps:25, weight:"" },
  { id:103, group:"Core", name:"Reverse crunch",        sets:3, reps:10, weight:25 },
  { id:104, group:"Legs", name:"Bulgarian split squat", sets:3, reps:10, weight:50 },
  { id:105, group:"Legs", name:"Prone leg curl",        sets:3, reps:10, weight:50 },
  { id:106, group:"Legs", name:"Hip thrust",            sets:3, reps:10, weight:120 },
];
const SEED_EX = [
  { id:1,  group:"Warmup",    name:"Push-ups",                   sets:1, reps:25,    weight:"" },
  { id:2,  group:"Back",      name:"Pull-ups",                   sets:2, reps:"8/5", weight:"" },
  { id:3,  group:"Back",      name:"Seated cable row",           sets:3, reps:10,    weight:88 },
  { id:4,  group:"Back",      name:"Cable pulldown",             sets:2, reps:10,    weight:99 },
  { id:5,  group:"Back",      name:"Straight arm lat pulldowns", sets:2, reps:25,    weight:25 },
  { id:6,  group:"Biceps",    name:"Barbell bicep curls",        sets:1, reps:8,     weight:70 },
  { id:7,  group:"Biceps",    name:"Concentrated curl",          sets:1, reps:10,    weight:22.5 },
  { id:8,  group:"Biceps",    name:"Dumbbell bicep curl",        sets:2, reps:10,    weight:22.5 },
  { id:9,  group:"Shoulders", name:"Shoulder press",             sets:3, reps:10,    weight:40 },
  { id:10, group:"Shoulders", name:"Dumbbell lateral raises",    sets:2, reps:10,    weight:22.5 },
  { id:11, group:"Shoulders", name:"Upright rows",               sets:2, reps:10,    weight:22.5 },
  { id:12, group:"Shoulders", name:"Reverse cable flies",        sets:2, reps:10,    weight:7.5 },
  { id:13, group:"Cardio",    name:"Outdoor walk",               sets:1, reps:1,     weight:"", note:"2 miles" },
];

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDetail(ex) {
  var w = "";
  if (ex.weight) {
    if (ex.weightMode === "pair") {
      w = " @ " + ex.weight + " lbs x2 (" + (ex.weight*2) + " total)";
    } else {
      w = " @ " + ex.weight + " lbs";
    }
  }
  var base = ex.sets + " x " + ex.reps + w;
  if (ex.note && ex.weightMode !== "pair") return base + " — " + ex.note;
  return base;
}

function calcVol(exercises) {
  return (exercises || []).reduce((acc, e) => {
    if (!e.weight) return acc;
    const r = typeof e.reps === "string"
      ? e.reps.split("/").reduce((a, b) => a + parseInt(b), 0)
      : e.reps * e.sets;
    return acc + e.weight * r;
  }, 0);
}

function daysSince(workouts, group) {
  const dates = Object.keys(workouts).sort((a, b) => b.localeCompare(a));
  for (var i = 0; i < dates.length; i++) {
    var date = dates[i];
    var exs = workouts[date] || [];
    if (exs.some(function(e) { return e.group === group; })) {
      return Math.floor((new Date(TODAY + "T12:00:00") - new Date(date + "T12:00:00")) / 86400000);
    }
  }
  return null;
}

function fatigueLevel(days) {
  if (days === null) return "fresh";
  if (days === 0) return "fatigued";
  if (days === 1) return "sore";
  if (days <= 2) return "recovering";
  return "fresh";
}

// ── Progress Tab ───────────────────────────────────────────────────────
function LineChart(props) {
  var data = props.data;
  var color = props.color || "#D4FF6E";
  var height = props.height || 140;
  if (!data || data.length < 2) {
    return React.createElement("div", {
      style: { textAlign:"center", padding:"30px 0", fontSize:12, color:"#333" }
    }, "Log this exercise at least twice to see a chart.");
  }
  var vals = data.map(function(d) { return d.y; });
  var mn = Math.floor(Math.min.apply(null, vals) * 0.95);
  var mx = Math.ceil(Math.max.apply(null, vals) * 1.05);
  var rng = mx - mn || 1;
  var W = 300, H = height, pL = 36, pR = 8, pT = 10, pB = 24;
  var iW = W - pL - pR, iH = H - pT - pB;
  function tx(i) { return pL + (i / Math.max(data.length - 1, 1)) * iW; }
  function ty(v) { return pT + iH - ((v - mn) / rng) * iH; }
  var pathD = data.map(function(d, i) { return (i === 0 ? "M" : "L") + tx(i) + "," + ty(d.y); }).join(" ");
  var areaD = pathD + " L" + tx(data.length - 1) + "," + (pT + iH) + " L" + tx(0) + "," + (pT + iH) + " Z";
  var ticks = [0, 1, 2, 3].map(function(i) {
    var v = mn + (rng / 3) * i;
    var y = ty(v);
    return React.createElement("g", { key: i },
      React.createElement("line", { x1: pL, y1: y, x2: W - pR, y2: y, stroke: "#1E1E1E", strokeWidth: "1" }),
      React.createElement("text", { x: pL - 3, y: y + 3, fontSize: "8", fill: "#444", textAnchor: "end" }, Math.round(v))
    );
  });
  var dots = data.map(function(d, i) {
    var show = data.length <= 6 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1;
    return React.createElement("g", { key: i },
      React.createElement("circle", { cx: tx(i), cy: ty(d.y), r: "3", fill: color }),
      show ? React.createElement("text", { x: tx(i), y: H - 5, fontSize: "7", fill: "#555", textAnchor: "middle" }, d.label) : null
    );
  });
  return React.createElement("svg", { viewBox: "0 0 " + W + " " + H, style: { width: "100%", height: height }, preserveAspectRatio: "none" },
    React.createElement("defs", null,
      React.createElement("linearGradient", { id: "lg1", x1: "0", y1: "0", x2: "0", y2: "1" },
        React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: "0.2" }),
        React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })
      )
    ),
    ticks,
    React.createElement("path", { d: areaD, fill: "url(#lg1)" }),
    React.createElement("path", { d: pathD, fill: "none", stroke: color, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" }),
    dots
  );
}

function ProgressTab(props) {
  var workouts = props.workouts;
  var exIdx = {};
  var sortedDates = Object.keys(workouts).sort(function(a, b) { return a.localeCompare(b); });
  sortedDates.forEach(function(date) {
    var exs = workouts[date] || [];
    exs.forEach(function(ex) {
      if (!ex.name) return;
      if (!exIdx[ex.name]) exIdx[ex.name] = { group: ex.group, entries: [] };
      var rn = typeof ex.reps === "string"
        ? ex.reps.split("/").reduce(function(a, b) { return a + parseInt(b); }, 0) / ex.reps.split("/").length
        : ex.reps;
      var vol = ex.weight ? ex.weight * (typeof ex.reps === "string"
        ? ex.reps.split("/").reduce(function(a, b) { return a + parseInt(b); }, 0)
        : ex.reps * ex.sets) : 0;
      exIdx[ex.name].entries.push({ date: date, weight: ex.weight || 0, reps: rn, sets: ex.sets || 1, vol: vol });
    });
  });

  var wex = Object.keys(exIdx)
    .filter(function(n) { return exIdx[n].entries.some(function(e) { return e.weight > 0; }); })
    .sort();

  var prs = {};
  wex.forEach(function(name) {
    prs[name] = exIdx[name].entries.reduce(function(a, b) { return b.weight > a.weight ? b : a; }, exIdx[name].entries[0]);
  });

  var [sel, setSel] = useState(wex[0] || "");
  var [met, setMet] = useState("weight");

  var sd = sel ? exIdx[sel] : null;
  var pr = sel ? prs[sel] : null;

  var cd = [];
  if (sd) {
    cd = sd.entries
      .filter(function(e) { return met === "reps" ? e.reps > 0 : e.weight > 0; })
      .map(function(e) {
        return {
          label: new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          y: met === "weight" ? e.weight : met === "volume" ? Math.round(e.vol) : e.reps,
        };
      });
  }

  var trend = cd.length >= 2 ? cd[cd.length - 1].y - cd[0].y : null;
  var tpct = cd.length >= 2 && cd[0].y > 0 ? ((cd[cd.length - 1].y - cd[0].y) / cd[0].y * 100).toFixed(1) : null;

  var svols = sortedDates.map(function(date) {
    return { label: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }), y: calcVol(workouts[date] || []) };
  }).filter(function(d) { return d.y > 0; });

  return (
    <div style={{ padding:"0 20px 40px" }}>
      {/* PRs */}
      <div style={{ borderBottom:"1px solid #1A1A1A", paddingBottom:20, marginBottom:20 }}>
        <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:13, letterSpacing:3, color:"#555", marginBottom:10 }}>PERSONAL RECORDS — tap to chart</div>
        {wex.length === 0 ? (
          <div style={{ fontSize:13, color:"#444" }}>No weighted exercises logged yet.</div>
        ) : wex.map(function(name) {
          var p = prs[name];
          var g = exIdx[name].group;
          var prev = exIdx[name].entries.filter(function(e) { return e.date < p.date && e.weight > 0; });
          var prevB = prev.length ? Math.max.apply(null, prev.map(function(e) { return e.weight; })) : null;
          var imp = prevB ? p.weight - prevB : null;
          return (
            <div key={name} onClick={function() { setSel(name); }}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #161616", cursor:"pointer", paddingLeft: sel === name ? 10 : 0, transition:"padding .15s" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:6, height:6, background: GROUP_COLORS[g] || "#888", borderRadius:1 }} />
                  <div style={{ fontSize:14, fontWeight:600, color: sel === name ? "#F0EDE6" : "#777" }}>{name}</div>
                </div>
                <div style={{ fontSize:11, color:"#444", marginTop:2 }}>
                  {new Date(p.date + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  {" · "}{exIdx[name].entries.length} sessions
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:24, color:"#D4FF6E" }}>{p.weight}</span>
                <span style={{ fontSize:10, color:"#555", marginLeft:3 }}>LBS</span>
                {imp !== null && <div style={{ fontSize:10, color:"#6A8C2A" }}>+{imp} from prev</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart for selected exercise */}
      {sel && sd && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, letterSpacing:2, color:"#F0EDE6" }}>{sel}</div>
              <div style={{ fontSize:11, color:"#555" }}>{sd.group.toUpperCase()} · {sd.entries.length} SESSIONS</div>
            </div>
            {pr && (
              <div style={{ background:"#111", border:"1px solid #2A2A2A", padding:"8px 12px", textAlign:"right" }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:2 }}>ALL-TIME PR</div>
                <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:24, color:"#D4FF6E", lineHeight:1 }}>{pr.weight} <span style={{ fontSize:11 }}>LBS</span></div>
              </div>
            )}
          </div>

          {/* Metric toggle */}
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {["weight","volume","reps"].map(function(m) {
              return (
                <button key={m} onClick={function() { setMet(m); }}
                  style={{ background: met === m ? "#D4FF6E20" : "transparent", border: "1px solid " + (met === m ? "#D4FF6E" : "#2A2A2A"), color: met === m ? "#D4FF6E" : "#555", fontFamily:"Bebas Neue,sans-serif", fontSize:13, letterSpacing:2, padding:"4px 12px", cursor:"pointer" }}>
                  {m.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Trend stats */}
          {trend !== null && (
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <div style={{ background:"#111", border:"1px solid #1E1E1E", padding:"8px 10px", flex:1 }}>
                <div style={{ fontSize:9, color:"#444", letterSpacing:2 }}>CHANGE</div>
                <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, color: trend >= 0 ? "#D4FF6E" : "#FF6E6E" }}>
                  {trend >= 0 ? "+" : ""}{met === "volume" ? Math.round(trend) : trend}
                </div>
              </div>
              {tpct !== null && (
                <div style={{ background:"#111", border:"1px solid #1E1E1E", padding:"8px 10px", flex:1 }}>
                  <div style={{ fontSize:9, color:"#444", letterSpacing:2 }}>% CHANGE</div>
                  <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, color: parseFloat(tpct) >= 0 ? "#D4FF6E" : "#FF6E6E" }}>
                    {parseFloat(tpct) >= 0 ? "+" : ""}{tpct}%
                  </div>
                </div>
              )}
              <div style={{ background:"#111", border:"1px solid #1E1E1E", padding:"8px 10px", flex:1 }}>
                <div style={{ fontSize:9, color:"#444", letterSpacing:2 }}>LATEST</div>
                <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, color:"#F0EDE6" }}>
                  {met === "volume" ? Math.round(cd[cd.length - 1].y) : cd[cd.length - 1].y}
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ background:"#0A0A0A", border:"1px solid #1A1A1A", padding:"12px 8px 8px" }}>
            <LineChart data={cd} color={GROUP_COLORS[sd.group] || "#D4FF6E"} height={140} />
          </div>

          {/* Session log table */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:11, letterSpacing:3, color:"#444", marginBottom:6 }}>SESSION LOG</div>
            <div style={{ background:"#0F0F0F", border:"1px solid #1A1A1A" }}>
              {sd.entries.slice().reverse().map(function(e, i) {
                var isPR = e.weight === pr.weight && e.date === pr.date;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 12px", borderBottom:"1px solid #161616" }}>
                    <div style={{ fontSize:11, color:"#666" }}>
                      {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" }).toUpperCase()}
                    </div>
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <span style={{ fontSize:12, color:"#555" }}>{e.sets} x {typeof e.reps === "number" ? Math.round(e.reps * 10) / 10 : e.reps}</span>
                      {e.weight > 0 && (
                        <span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:15, color: isPR ? "#D4FF6E" : "#888" }}>
                          {e.weight} LBS {isPR ? "🏆" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Session volume chart */}
      {svols.length >= 2 && (
        <div>
          <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:13, letterSpacing:3, color:"#555", marginBottom:10 }}>TOTAL SESSION VOLUME</div>
          <div style={{ background:"#0A0A0A", border:"1px solid #1A1A1A", padding:"12px 8px 8px" }}>
            <LineChart data={svols} color="#A0D4F5" height={120} />
          </div>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <div style={{ background:"#0F0F0F", border:"1px solid #1A1A1A", padding:"8px 12px", flex:1 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2 }}>BEST SESSION</div>
              <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, color:"#A0D4F5" }}>
                {Math.round(Math.max.apply(null, svols.map(function(d) { return d.y; }))).toLocaleString()} LBS
              </div>
            </div>
            <div style={{ background:"#0F0F0F", border:"1px solid #1A1A1A", padding:"8px 12px", flex:1 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:2 }}>AVG SESSION</div>
              <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, color:"#A0D4F5" }}>
                {Math.round(svols.reduce(function(a, d) { return a + d.y; }, 0) / svols.length).toLocaleString()} LBS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recovery Tab ───────────────────────────────────────────────────────
function MusclePath(props) {
  var d = props.d;
  var group = props.group;
  var fatigue = props.fatigue;
  var onHover = props.onHover;
  var hovered = props.hovered;
  var c = FATIGUE_COLORS[fatigue];
  var isH = hovered === group;
  return (
    <path d={d}
      fill={isH ? c.stroke + "55" : c.fill}
      stroke={c.stroke}
      strokeWidth={isH ? 2 : 1.2}
      style={{ cursor:"pointer", transition:"all .2s" }}
      onMouseEnter={function() { onHover(group); }}
      onMouseLeave={function() { onHover(null); }}
    />
  );
}

function RecoveryTab(props) {
  var workouts = props.workouts;
  var [hov, setHov] = useState(null);

  var groups = ["Chest","Shoulders","Biceps","Triceps","Back","Legs","Core"];
  var fat = {};
  groups.forEach(function(g) { fat[g] = fatigueLevel(daysSince(workouts, g)); });

  var hd = hov ? daysSince(workouts, hov) : null;
  var hf = hov ? fat[hov] : null;

  function mp(group, d) {
    return React.createElement(MusclePath, { key: group + d, d: d, group: group, fatigue: fat[group], onHover: setHov, hovered: hov });
  }

  var hovMsg = "";
  if (hov) {
    if (hd === null) hovMsg = "Never trained";
    else if (hd === 0) hovMsg = "Trained today — rest!";
    else if (hd === 1) hovMsg = "1 day ago — still sore";
    else hovMsg = hd + " days ago — " + FATIGUE_COLORS[hf].label;
  }

  return (
    <div style={{ padding:"0 20px 40px" }}>
      <div style={{ paddingBottom:14, marginBottom:16, borderBottom:"1px solid #1A1A1A" }}>
        <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:13, letterSpacing:3, color:"#555", marginBottom:4 }}>MUSCLE RECOVERY STATUS</div>
        <div style={{ fontSize:12, color:"#333" }}>Tap or hover a muscle to see recovery details.</div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        {Object.keys(FATIGUE_COLORS).map(function(k) {
          var v = FATIGUE_COLORS[k];
          return (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, background:v.fill, border:"1.5px solid " + v.stroke, borderRadius:2 }} />
              <span style={{ fontSize:10, color:"#666", letterSpacing:1 }}>{v.label.toUpperCase()}</span>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      <div style={{ minHeight:36, marginBottom:10 }}>
        {hov && (
          <div style={{ background:"#111", border:"1px solid " + FATIGUE_COLORS[hf].stroke, padding:"8px 14px", display:"inline-block" }}>
            <span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:18, letterSpacing:2, color:FATIGUE_COLORS[hf].stroke }}>{hov}</span>
            <span style={{ fontSize:12, color:"#666", marginLeft:10 }}>{hovMsg}</span>
          </div>
        )}
      </div>

      {/* Body SVG */}
      <svg viewBox="0 0 400 360" style={{ width:"100%", maxWidth:400 }}>
        <text x="90" y="16" textAnchor="middle" fontSize="10" fill="#444" fontFamily="'Bebas Neue',sans-serif" letterSpacing="2">FRONT</text>
        <text x="300" y="16" textAnchor="middle" fontSize="10" fill="#444" fontFamily="'Bebas Neue',sans-serif" letterSpacing="2">BACK</text>
        {/* Head / neck front */}
        <ellipse cx="90" cy="40" rx="18" ry="22" fill="#1A1A1A" stroke="#333" strokeWidth="1" />
        <rect x="83" y="58" width="14" height="10" rx="3" fill="#1A1A1A" stroke="#333" strokeWidth="1" />
        {/* Chest */}
        {mp("Chest", "M62,68 Q70,64 83,68 L83,96 Q74,100 62,96 Z")}
        {mp("Chest", "M97,68 Q110,64 118,68 L118,96 Q106,100 97,96 Z")}
        {/* Shoulders front */}
        {mp("Shoulders", "M54,66 Q62,60 62,68 L62,88 Q54,90 48,84 Q46,76 54,66 Z")}
        {mp("Shoulders", "M118,66 Q126,60 126,68 L132,84 Q126,90 118,88 L118,68 Z")}
        {/* Biceps front */}
        {mp("Biceps", "M46,88 Q54,90 56,100 L52,118 Q44,116 42,106 Z")}
        {mp("Biceps", "M124,88 Q132,84 138,98 Q138,108 134,118 L126,116 Z")}
        {/* Forearms / hands */}
        <rect x="38" y="118" width="16" height="40" rx="6" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        <rect x="126" y="118" width="16" height="40" rx="6" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        <ellipse cx="46" cy="162" rx="9" ry="7" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        <ellipse cx="134" cy="162" rx="9" ry="7" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        {/* Core */}
        {mp("Core", "M76,96 Q83,100 90,100 Q97,100 104,96 L106,148 Q97,152 83,152 Q70,152 74,148 Z")}
        <line x1="90" y1="100" x2="90" y2="148" stroke="#0D0D0D" strokeWidth="1.5" opacity="0.5" />
        <line x1="76" y1="112" x2="104" y2="112" stroke="#0D0D0D" strokeWidth="1" opacity="0.4" />
        <line x1="75" y1="124" x2="105" y2="124" stroke="#0D0D0D" strokeWidth="1" opacity="0.4" />
        <line x1="75" y1="136" x2="106" y2="136" stroke="#0D0D0D" strokeWidth="1" opacity="0.4" />
        {/* Legs quads */}
        {mp("Legs", "M74,152 Q83,156 90,154 L88,230 Q82,234 74,230 Z")}
        {mp("Legs", "M90,154 Q97,156 106,152 L106,230 Q98,234 92,230 Z")}
        <ellipse cx="81" cy="233" rx="10" ry="7" fill="#161616" stroke="#222" strokeWidth="1" />
        <ellipse cx="99" cy="233" rx="10" ry="7" fill="#161616" stroke="#222" strokeWidth="1" />
        {/* Calves front */}
        {mp("Legs", "M72,240 Q81,236 81,240 L80,300 Q74,304 70,298 Z")}
        {mp("Legs", "M99,240 Q107,236 108,240 L110,298 Q106,304 100,300 Z")}
        <ellipse cx="75" cy="306" rx="12" ry="6" fill="#161616" stroke="#222" strokeWidth="1" />
        <ellipse cx="105" cy="306" rx="12" ry="6" fill="#161616" stroke="#222" strokeWidth="1" />
        {/* ── BACK VIEW ── */}
        <ellipse cx="300" cy="40" rx="18" ry="22" fill="#1A1A1A" stroke="#333" strokeWidth="1" />
        <rect x="293" y="58" width="14" height="10" rx="3" fill="#1A1A1A" stroke="#333" strokeWidth="1" />
        {/* Back traps */}
        {mp("Back", "M272,68 Q286,62 300,64 Q314,62 328,68 L326,88 Q314,80 300,82 Q286,80 274,88 Z")}
        {/* Shoulders rear */}
        {mp("Shoulders", "M264,66 Q272,60 272,68 L274,88 Q264,90 258,84 Q256,76 264,66 Z")}
        {mp("Shoulders", "M328,66 Q336,60 336,68 L342,84 Q336,90 326,88 L326,68 Z")}
        {/* Back lats */}
        {mp("Back", "M274,88 Q286,80 300,82 Q314,80 326,88 L320,148 Q310,154 300,152 Q290,154 280,148 Z")}
        {/* Triceps */}
        {mp("Triceps", "M256,88 Q264,90 266,100 L262,118 Q254,116 252,106 Z")}
        {mp("Triceps", "M334,88 Q342,84 348,98 Q348,108 344,118 L336,116 Z")}
        <rect x="248" y="118" width="16" height="40" rx="6" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        <rect x="336" y="118" width="16" height="40" rx="6" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        <ellipse cx="256" cy="162" rx="9" ry="7" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        <ellipse cx="344" cy="162" rx="9" ry="7" fill="#161616" stroke="#2A2A2A" strokeWidth="1" />
        {/* Glutes */}
        {mp("Legs", "M280,148 Q290,154 300,152 Q310,154 320,148 L320,178 Q310,186 300,184 Q290,186 280,178 Z")}
        {/* Hamstrings */}
        {mp("Legs", "M280,178 Q290,186 300,184 L298,230 Q291,234 283,230 Z")}
        {mp("Legs", "M300,184 Q310,186 320,178 L317,230 Q309,234 302,230 Z")}
        <ellipse cx="291" cy="233" rx="10" ry="7" fill="#161616" stroke="#222" strokeWidth="1" />
        <ellipse cx="309" cy="233" rx="10" ry="7" fill="#161616" stroke="#222" strokeWidth="1" />
        {/* Calves back */}
        {mp("Legs", "M282,240 Q291,236 291,240 L290,300 Q284,304 280,298 Z")}
        {mp("Legs", "M309,240 Q317,236 318,240 L320,298 Q316,304 310,300 Z")}
        <ellipse cx="285" cy="306" rx="12" ry="6" fill="#161616" stroke="#222" strokeWidth="1" />
        <ellipse cx="315" cy="306" rx="12" ry="6" fill="#161616" stroke="#222" strokeWidth="1" />
      </svg>

      {/* Status grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:16 }}>
        {groups.map(function(g) {
          var f = fat[g];
          var days = daysSince(workouts, g);
          var c = FATIGUE_COLORS[f];
          return (
            <div key={g} style={{ background:c.fill, border:"1px solid " + c.stroke, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:14, letterSpacing:2, color:c.stroke }}>{g.toUpperCase()}</div>
                <div style={{ fontSize:10, color:c.stroke + "99" }}>{days === null ? "Never" : days === 0 ? "Today" : days + "d ago"}</div>
              </div>
              <div style={{ fontSize:10, color:c.stroke, letterSpacing:1, fontWeight:600 }}>{c.label.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MONTHLY SUMMARY ───────────────────────────────────────────────────
function MonthlySummary(props) {
  var workouts = props.workouts;
  var now = new Date(TODAY + "T12:00:00");
  var thisMonth = TODAY.slice(0, 7);
  var lastMonthDate = new Date(now); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  var lastMonth = lastMonthDate.toISOString().slice(0, 7);

  var months = [];
  // Build last 4 months
  for (var m = 0; m < 4; m++) {
    var d = new Date(now); d.setMonth(d.getMonth() - m);
    var key = d.toISOString().slice(0, 7);
    var label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    var dates = Object.keys(workouts).filter(function(dt) { return dt.startsWith(key); });
    var sessions = dates.length;
    var totalVol = dates.reduce(function(a, dt) { return a + calcVol(workouts[dt] || []); }, 0);
    var totalEx = dates.reduce(function(a, dt) { return a + (workouts[dt] || []).length; }, 0);
    var groupCounts = {};
    dates.forEach(function(dt) {
      (workouts[dt] || []).forEach(function(e) {
        groupCounts[e.group] = (groupCounts[e.group] || 0) + 1;
      });
    });
    var topGroup = Object.keys(groupCounts).sort(function(a, b) { return groupCounts[b] - groupCounts[a]; })[0] || null;
    months.push({ key: key, label: label, sessions: sessions, vol: totalVol, exercises: totalEx, topGroup: topGroup });
  }

  var [open, setOpen] = useState(thisMonth);

  return (
    <div style={{marginBottom:24}}>
      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:10}}>MONTHLY SUMMARY</div>
      {months.map(function(mo, idx) {
        var isOpen = open === mo.key;
        var isCurrent = mo.key === thisMonth;
        return (
          <div key={mo.key} style={{marginBottom:8,border:"1px solid "+(isCurrent?"#2A3A1A":"#1A1A1A"),background:"#0F0F0F"}}>
            <div onClick={function(){setOpen(isOpen ? null : mo.key);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {isCurrent && <div style={{width:6,height:6,background:"#D4FF6E",borderRadius:"50%"}}/>}
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,color:isCurrent?"#F0EDE6":"#888"}}>{mo.label}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:isCurrent?"#D4FF6E":"#555",letterSpacing:1}}>{mo.sessions}</div>
                  <div style={{fontSize:8,color:"#444",letterSpacing:1}}>SESSIONS</div>
                </div>
                <div style={{fontSize:10,color:"#444"}}>{isOpen?"▲":"▼"}</div>
              </div>
            </div>
            {isOpen && mo.sessions > 0 && (
              <div style={{borderTop:"1px solid #1A1A1A",padding:"12px 14px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
                  {[
                    {v:mo.sessions, l:"SESSIONS"},
                    {v:mo.exercises, l:"EXERCISES"},
                    {v:mo.vol>0?Math.round(mo.vol/1000*10)/10+"k":"—", l:"LBS VOL"},
                  ].map(function(s,i){
                    return <div key={i} style={{background:"#161616",padding:"8px",textAlign:"center",borderRadius:2}}>
                      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:"#D4FF6E"}}>{s.v}</div>
                      <div style={{fontSize:8,color:"#444",letterSpacing:1}}>{s.l}</div>
                    </div>;
                  })}
                </div>
                {mo.topGroup && (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:7,height:7,background:GROUP_COLORS[mo.topGroup]||"#888",borderRadius:1}}/>
                    <div style={{fontSize:12,color:"#666"}}>Most trained: <span style={{color:GROUP_COLORS[mo.topGroup]||"#D4FF6E",fontWeight:600}}>{mo.topGroup}</span></div>
                  </div>
                )}
              </div>
            )}
            {isOpen && mo.sessions === 0 && (
              <div style={{borderTop:"1px solid #1A1A1A",padding:"12px 14px",fontSize:12,color:"#333"}}>No sessions logged this month.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── USER SWITCHER ──────────────────────────────────────────────────────
function UserSwitcher(props) {
  var activeUser = props.activeUser;
  var users = props.users;
  var onSwitch = props.onSwitch;
  var onAdd = props.onAdd;
  var onEdit = props.onEdit;
  var onDelete = props.onDelete;
  var onClose = props.onClose;
  var [newName, setNewName] = useState("");
  var [newColor, setNewColor] = useState("#D4FF6E");
  var [editingId, setEditingId] = useState(null);
  var [editName, setEditName] = useState("");
  var [editColor, setEditColor] = useState("");

  var COLORS = ["#D4FF6E","#A0D4F5","#F5A0A0","#F5C8A0","#D4A0F5","#A0F5D4","#F5F0A0","#F5A0D4"];

  function startEdit(u) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditColor(u.color);
  }
  function saveEdit() {
    if (!editName.trim()) return;
    onEdit({id:editingId, name:editName.trim(), color:editColor});
    setEditingId(null);
  }

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#111",border:"1px solid #2A2A2A",padding:20,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:18,letterSpacing:3,color:"#F0EDE6"}}>SELECT USER</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:20}}>x</button>
        </div>

        {/* Existing users */}
        <div style={{marginBottom:16}}>
          {users.map(function(u) {
            var isActive = u.id === activeUser.id;
            var isEditing = editingId === u.id;
            if (isEditing) {
              return (
                <div key={u.id} style={{padding:"12px 14px",marginBottom:6,background:"#0F1A0A",border:"1px solid "+editColor,borderRadius:2}}>
                  <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>NAME</div>
                  <input className="fi" value={editName} onChange={function(e){setEditName(e.target.value);}} autoFocus style={{marginBottom:10}}/>
                  <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>COLOR</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                    {COLORS.map(function(c){
                      return <button key={c} onClick={function(){setEditColor(c);}}
                        style={{width:26,height:26,borderRadius:"50%",background:c,border:"2px solid "+(editColor===c?"#fff":"transparent"),cursor:"pointer"}}/>;
                    })}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={saveEdit} style={{flex:1,background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"8px",cursor:"pointer"}}>SAVE</button>
                    <button onClick={function(){setEditingId(null);}} style={{background:"transparent",border:"1px solid #333",color:"#666",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"8px 12px",cursor:"pointer"}}>CANCEL</button>
                    {users.length > 1 && !isActive && (
                      <button onClick={function(){if(confirm("Delete "+u.name+"? Their workouts will be lost.")) onDelete(u);}}
                        style={{background:"#2A1010",border:"1px solid #5A1010",color:"#FF6E6E",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"8px 12px",cursor:"pointer"}}>DEL</button>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,background:isActive?"#0F1A0A":"#0F0F0F",border:"1px solid "+(isActive?u.color:"#1A1A1A"),borderRadius:2}}>
                <div onClick={function(){onSwitch(u); onClose();}} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer"}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:u.color+"33",border:"2px solid "+u.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Bebas Neue,sans-serif",fontSize:16,color:u.color,flexShrink:0}}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600,color:isActive?u.color:"#C8C5BE"}}>{u.name}</div>
                    <div style={{fontSize:11,color:"#444",marginTop:1}}>User {users.indexOf(u)+1}{isActive?" — Active":""}</div>
                  </div>
                </div>
                <button onClick={function(){startEdit(u);}}
                  style={{background:"#161616",border:"1px solid #2A2A2A",color:"#888",fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:1,padding:"6px 10px",cursor:"pointer"}}>
                  EDIT
                </button>
              </div>
            );
          })}
        </div>

        {/* Add new user */}
        {users.length < 6 && (
          <div style={{borderTop:"1px solid #1A1A1A",paddingTop:14}}>
            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:3,color:"#555",marginBottom:10}}>ADD NEW USER</div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>NAME</div>
              <input className="fi" value={newName} onChange={function(e){setNewName(e.target.value);}} placeholder="e.g. Sarah"/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>COLOR</div>
              <div style={{display:"flex",gap:6}}>
                {COLORS.map(function(c){
                  return <button key={c} onClick={function(){setNewColor(c);}}
                    style={{width:28,height:28,borderRadius:"50%",background:c,border:"2px solid "+(newColor===c?"#fff":"transparent"),cursor:"pointer"}}/>;
                })}
              </div>
            </div>
            <button onClick={function(){
              if (!newName.trim()) return;
              onAdd({id:"user-"+Date.now(), name:newName.trim(), color:newColor});
              setNewName(""); setNewColor("#D4FF6E");
            }} style={{width:"100%",background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:2,padding:"11px",cursor:"pointer"}}>
              ADD USER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BODY MEASUREMENTS TAB ─────────────────────────────────────────────
const BODY_KEY_PREFIX = "body-measurements-v1-";

function BodyTab(props) {
  var activeUser = props.activeUser || {id:"user-1"};
  var bodyKey = BODY_KEY_PREFIX + activeUser.id;

  var MEASUREMENTS = [
    {key:"weight",    label:"Weight",       unit:"lbs", icon:"⚖️"},
    {key:"bodyfat",   label:"Body Fat",     unit:"%",   icon:"📊"},
    {key:"waist",     label:"Waist",        unit:"in",  icon:"📏"},
    {key:"chest",     label:"Chest",        unit:"in",  icon:"📏"},
    {key:"hips",      label:"Hips",         unit:"in",  icon:"📏"},
    {key:"neck",      label:"Neck",         unit:"in",  icon:"📏"},
    {key:"bicep",     label:"Bicep",        unit:"in",  icon:"💪"},
    {key:"thigh",     label:"Thigh",        unit:"in",  icon:"📏"},
    {key:"calf",      label:"Calf",         unit:"in",  icon:"📏"},
    {key:"shoulder",  label:"Shoulders",    unit:"in",  icon:"📏"},
  ];

  var [log, setLog] = useState([]);
  var [loaded, setLoaded] = useState(false);
  var [date, setDate] = useState(TODAY);
  var [values, setValues] = useState({});
  var [notes, setNotes] = useState("");
  var [saved, setSaved] = useState(false);
  var [selected, setSelected] = useState("weight");

  useEffect(function() {
    try { var ls = localStorage.getItem(bodyKey); if (ls) setLog(JSON.parse(ls)); } catch(e) {}
    setLoaded(true);
  }, [activeUser.id]);

  function saveEntry() {
    var hasData = Object.keys(values).some(function(k){ return values[k]; });
    if (!hasData) return;
    var entry = Object.assign({}, values, {date:date, notes:notes, id:Date.now()});
    var next = log.filter(function(e){return e.date!==date;}).concat([entry]).sort(function(a,b){return b.date.localeCompare(a.date);});
    setLog(next);
    try { localStorage.setItem(bodyKey, JSON.stringify(next)); } catch(e) {}
    setNotes("");
    setSaved(true); setTimeout(function(){setSaved(false);},2000);
  }

  function deleteEntry(id) {
    var next = log.filter(function(e){return e.id!==id;});
    setLog(next);
    try { localStorage.setItem(bodyKey, JSON.stringify(next)); } catch(e) {}
  }

  // Latest values for each measurement
  var latest = {};
  if (log.length > 0) {
    var newest = log[0];
    MEASUREMENTS.forEach(function(m){ if (newest[m.key]) latest[m.key] = newest[m.key]; });
  }

  // Change from first to latest
  function getChange(key) {
    var entries = log.filter(function(e){return e[key];}).sort(function(a,b){return a.date.localeCompare(b.date);});
    if (entries.length < 2) return null;
    return (parseFloat(entries[entries.length-1][key]) - parseFloat(entries[0][key])).toFixed(1);
  }

  // Chart data for selected measurement
  var chartEntries = log.filter(function(e){return e[selected];}).sort(function(a,b){return a.date.localeCompare(b.date);});
  var selMeta = MEASUREMENTS.find(function(m){return m.key===selected;}) || MEASUREMENTS[0];

  // Simple inline sparkline
  function MiniChart(cprops) {
    var pts = cprops.points;
    if (!pts || pts.length < 2) return null;
    var vals = pts.map(function(p){return parseFloat(p);});
    var mn=Math.min.apply(null,vals), mx=Math.max.apply(null,vals), rng=mx-mn||1;
    var W=300,H=80,pL=8,pR=8,pT=8,pB=8;
    var iW=W-pL-pR, iH=H-pT-pB;
    function tx(i){return pL+(i/Math.max(pts.length-1,1))*iW;}
    function ty(v){return pT+iH-((v-mn)/rng)*iH;}
    var pathD=vals.map(function(v,i){return (i===0?"M":"L")+tx(i)+","+ty(v);}).join(" ");
    var areaD=pathD+" L"+tx(vals.length-1)+","+(pT+iH)+" L"+tx(0)+","+(pT+iH)+" Z";
    var col=cprops.color||"#D4FF6E";
    return (
      <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:H}} preserveAspectRatio="none">
        <defs><linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.2"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
        <path d={areaD} fill="url(#bgrad)"/>
        <path d={pathD} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {vals.map(function(v,i){return <circle key={i} cx={tx(i)} cy={ty(v)} r="3" fill={col}/>;  })}
      </svg>
    );
  }

  if (!loaded) return <div style={{padding:"40px",textAlign:"center",color:"#444",fontFamily:"Bebas Neue,sans-serif",letterSpacing:3}}>LOADING...</div>;

  return (
    <div style={{padding:"0 20px 60px"}}>

      {/* Latest stats grid */}
      {log.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:10}}>CURRENT STATS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {MEASUREMENTS.filter(function(m){return latest[m.key];}).map(function(m){
              var change = getChange(m.key);
              var isDown = change && parseFloat(change) < 0;
              var isUp = change && parseFloat(change) > 0;
              var goodDown = m.key==="weight"||m.key==="bodyfat"||m.key==="waist"||m.key==="hips";
              return (
                <div key={m.key} onClick={function(){setSelected(m.key);}}
                  style={{background:selected===m.key?"#0F1A0A":"#0F0F0F",border:"1px solid "+(selected===m.key?"#3A5C14":"#1A1A1A"),padding:"10px 10px",cursor:"pointer"}}>
                  <div style={{fontSize:9,color:"#444",letterSpacing:1,marginBottom:3}}>{m.label.toUpperCase()}</div>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:"#D4FF6E",lineHeight:1}}>{latest[m.key]}<span style={{fontSize:10,color:"#555",marginLeft:2}}>{m.unit}</span></div>
                  {change && <div style={{fontSize:9,marginTop:2,color:isDown?(goodDown?"#6ABF3A":"#FF6E6E"):isUp?(goodDown?"#FF6E6E":"#6ABF3A"):"#444"}}>{isUp?"+":""}{change}{m.unit}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart for selected measurement */}
      {chartEntries.length >= 2 && (
        <div style={{background:"#0A0A0A",border:"1px solid #1A1A1A",padding:"12px 8px 4px",marginBottom:16}}>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:6,paddingLeft:6}}>{selMeta.label.toUpperCase()} OVER TIME</div>
          <MiniChart points={chartEntries.map(function(e){return e[selected];})} color="#D4FF6E"/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"0 6px",fontSize:9,color:"#444"}}>
            <span>{new Date(chartEntries[0].date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            <span>{new Date(chartEntries[chartEntries.length-1].date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
          </div>
        </div>
      )}

      {/* Log form */}
      <div style={{background:"#111",border:"1px solid #222",padding:"14px",marginBottom:16}}>
        <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#D4FF6E",marginBottom:12}}>LOG MEASUREMENTS</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>DATE</div>
          <input type="date" className="fi" value={date} onChange={function(e){setDate(e.target.value);}} style={{width:"auto"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          {MEASUREMENTS.map(function(m){
            return (
              <div key={m.key}>
                <div style={{fontSize:10,color:"#666",letterSpacing:1,marginBottom:4}}>{m.label} ({m.unit})</div>
                <input className="fi" type="number" value={values[m.key]||""} onChange={function(e){setValues(function(v){return Object.assign({},v,{[m.key]:e.target.value});});}} placeholder={latest[m.key]||""}/>
              </div>
            );
          })}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:10,color:"#666",letterSpacing:1,marginBottom:4}}>Notes</div>
            <input className="fi" value={notes} onChange={function(e){setNotes(e.target.value);}} placeholder="e.g. Morning, fasted"/>
          </div>
        </div>
        <button onClick={saveEntry} style={{width:"100%",background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:18,letterSpacing:3,padding:"12px",cursor:"pointer"}}>SAVE MEASUREMENTS</button>
        {saved && <div style={{marginTop:8,fontSize:12,color:"#6ABF3A",textAlign:"center"}}>Saved!</div>}
      </div>

      {/* History */}
      {log.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:"#2A2A2A",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:3}}>NO MEASUREMENTS LOGGED YET</div>
      ) : (
        <div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:8}}>HISTORY</div>
          {log.map(function(entry){
            var label = entry.date===TODAY?"TODAY":new Date(entry.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
            var filled = MEASUREMENTS.filter(function(m){return entry[m.key];});
            return (
              <div key={entry.id} style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:2,color:"#888"}}>{label}</div>
                  <button onClick={function(){deleteEntry(entry.id);}} style={{background:"none",border:"none",color:"#2A2A2A",cursor:"pointer",fontSize:14}} onMouseEnter={function(e){e.target.style.color="#FF4444";}} onMouseLeave={function(e){e.target.style.color="#2A2A2A";}}>x</button>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {filled.map(function(m){
                    return <span key={m.key} style={{fontSize:12,color:"#666"}}><span style={{color:"#C8C5BE"}}>{entry[m.key]}{m.unit}</span> {m.label}</span>;
                  })}
                </div>
                {entry.notes && <div style={{fontSize:11,color:"#444",marginTop:4}}>{entry.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── NUTRITION TAB ─────────────────────────────────────────────────────
const NUTR_KEY = "nutrition-log-v1";

function NutritionTab(props) {
  var [log, setLog] = useState({});
  var [loaded, setLoaded] = useState(false);
  var [date, setDate] = useState(TODAY);
  var [calories, setCalories] = useState("");
  var [protein, setProtein] = useState("");
  var [carbs, setCarbs] = useState("");
  var [fat, setFat] = useState("");
  var [water, setWater] = useState("");
  var [meal, setMeal] = useState("breakfast");
  var [notes, setNotes] = useState("");
  var [saved, setSaved] = useState(false);
  var [goals, setGoals] = useState({calories:2000, protein:150, carbs:200, fat:65, water:64});
  var [showGoals, setShowGoals] = useState(false);

  var nutrKey = getNutrKey((props.activeUser||{id:"user-1"}).id);
  var goalsKey = "nutr-goals-" + (props.activeUser||{id:"user-1"}).id;

  useEffect(function() {
    setLog({});
    setLoaded(false);
    try { var ls = localStorage.getItem(nutrKey); if (ls) setLog(JSON.parse(ls)); } catch(e) {}
    try { var g = localStorage.getItem(goalsKey); if (g) setGoals(JSON.parse(g)); } catch(e) {}
    setLoaded(true);
  }, [nutrKey]);

  async function saveEntry() {
    if (!calories && !protein && !water) return;
    var entry = {
      id: Date.now(), meal: meal, date: date,
      calories: parseFloat(calories)||0, protein: parseFloat(protein)||0,
      carbs: parseFloat(carbs)||0, fat: parseFloat(fat)||0,
      water: parseFloat(water)||0, notes: notes,
    };
    var next = Object.assign({}, log, { [date]: (log[date]||[]).concat([entry]) });
    setLog(next);
    try { localStorage.setItem(nutrKey, JSON.stringify(next)); } catch(e) {}
    try { sessionStorage.setItem(nutrKey, JSON.stringify(next)); } catch(e) {}
    setCalories(""); setProtein(""); setCarbs(""); setFat(""); setWater(""); setNotes("");
    setSaved(true); setTimeout(function() { setSaved(false); }, 2000);
  }

  function saveGoals(newGoals) {
    setGoals(newGoals);
    try { localStorage.setItem(goalsKey, JSON.stringify(newGoals)); } catch(e) {}
  }

  async function deleteEntry(d, id) {
    var next = Object.assign({}, log, { [d]: (log[d]||[]).filter(function(e) { return e.id !== id; }) });
    setLog(next);
    try { localStorage.setItem(nutrKey, JSON.stringify(next)); } catch(e) {}
  }

  var MEALS = ["breakfast","lunch","dinner","snack","pre-workout","post-workout"];
  var MEAL_ICONS = {breakfast:"🌅",lunch:"☀️",dinner:"🌙",snack:"🍎","pre-workout":"⚡","post-workout":"💪"};
  var MACRO_COLORS = {calories:"#F5A0A0",protein:"#A0D4F5",carbs:"#F5F0A0",fat:"#F5C8A0",water:"#A0F5D4"};

  // Totals for selected date
  var todayEntries = log[date] || [];
  var totals = todayEntries.reduce(function(a, e) {
    return { calories:a.calories+(e.calories||0), protein:a.protein+(e.protein||0), carbs:a.carbs+(e.carbs||0), fat:a.fat+(e.fat||0), water:a.water+(e.water||0) };
  }, {calories:0,protein:0,carbs:0,fat:0,water:0});

  function pct(val, goal) { return Math.min(100, Math.round(val/goal*100)); }

  var allDates = Object.keys(log).filter(function(d){return (log[d]||[]).length>0;}).sort(function(a,b){return b.localeCompare(a);});

  if (!loaded) return <div style={{padding:"40px",textAlign:"center",color:"#444",fontFamily:"Bebas Neue,sans-serif",letterSpacing:3}}>LOADING...</div>;

  return (
    <div style={{padding:"0 20px 60px"}}>

      {/* Date selector */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:4}}>NUTRITION LOG</div>
          <input type="date" className="fi" value={date} onChange={function(e){setDate(e.target.value);}} style={{width:"auto",fontSize:13}}/>
        </div>
        <button onClick={function(){setShowGoals(function(s){return !s;});}}
          style={{background:"#161616",border:"1px solid #2A2A2A",color:"#666",fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,padding:"8px 12px",cursor:"pointer"}}>
          SET GOALS
        </button>
      </div>

      {/* Goals editor */}
      {showGoals && (
        <div style={{background:"#111",border:"1px solid #2A2A2A",padding:"14px",marginBottom:16}}>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:3,color:"#555",marginBottom:10}}>DAILY GOALS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["calories","Cal","kcal"],["protein","Protein","g"],["carbs","Carbs","g"],["fat","Fat","g"],["water","Water","oz"]].map(function(f){
              return <div key={f[0]}>
                <div style={{fontSize:10,color:"#666",letterSpacing:1,marginBottom:4}}>{f[1].toUpperCase()} ({f[2]})</div>
                <input className="fi" type="number" value={goals[f[0]]} onChange={function(e){saveGoals(Object.assign({},goals,{[f[0]]:parseFloat(e.target.value)||0}));}}/>
              </div>;
            })}
          </div>
        </div>
      )}

      {/* Daily progress bars */}
      <div style={{background:"#111",border:"1px solid #1A1A1A",padding:"14px",marginBottom:16}}>
        <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:10}}>TODAY'S TOTALS</div>
        {[
          {key:"calories",label:"Calories",unit:"kcal",val:totals.calories,goal:goals.calories},
          {key:"protein", label:"Protein", unit:"g",   val:totals.protein, goal:goals.protein},
          {key:"carbs",   label:"Carbs",   unit:"g",   val:totals.carbs,   goal:goals.carbs},
          {key:"fat",     label:"Fat",     unit:"g",   val:totals.fat,     goal:goals.fat},
          {key:"water",   label:"Water",   unit:"oz",  val:totals.water,   goal:goals.water},
        ].map(function(m){
          var p = pct(m.val, m.goal);
          var over = m.val > m.goal;
          var col = MACRO_COLORS[m.key];
          return (
            <div key={m.key} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#888"}}>{m.label}</span>
                <span style={{fontSize:12,color:over?"#FF8040":col}}>{Math.round(m.val)}<span style={{color:"#444"}}>/{m.goal}{m.unit}</span></span>
              </div>
              <div style={{background:"#1A1A1A",borderRadius:2,height:6,overflow:"hidden"}}>
                <div style={{width:p+"%",height:"100%",background:over?"#FF8040":col,borderRadius:2,transition:"width .3s"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log form */}
      <div style={{background:"#111",border:"1px solid #222",padding:"14px",marginBottom:16}}>
        <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#D4FF6E",marginBottom:12}}>+ LOG MEAL</div>

        {/* Meal type */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
          {MEALS.map(function(m){
            var active = meal===m;
            return <button key={m} onClick={function(){setMeal(m);}}
              style={{background:active?"#D4FF6E20":"#161616",border:"1px solid "+(active?"#D4FF6E":"#2A2A2A"),color:active?"#D4FF6E":"#555",fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:1,padding:"5px 8px",cursor:"pointer"}}>
              {MEAL_ICONS[m]} {m.toUpperCase()}
            </button>;
          })}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:4}}>CALORIES (kcal)</div><input className="fi" type="number" value={calories} onChange={function(e){setCalories(e.target.value);}} placeholder="450"/></div>
          <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:4}}>PROTEIN (g)</div><input className="fi" type="number" value={protein} onChange={function(e){setProtein(e.target.value);}} placeholder="40"/></div>
          <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:4}}>CARBS (g)</div><input className="fi" type="number" value={carbs} onChange={function(e){setCarbs(e.target.value);}} placeholder="50"/></div>
          <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:4}}>FAT (g)</div><input className="fi" type="number" value={fat} onChange={function(e){setFat(e.target.value);}} placeholder="15"/></div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:4}}>WATER (oz)</div><input className="fi" type="number" value={water} onChange={function(e){setWater(e.target.value);}} placeholder="16"/></div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:4}}>NOTES</div><input className="fi" value={notes} onChange={function(e){setNotes(e.target.value);}} placeholder="e.g. Chicken and rice"/></div>
        </div>
        <button onClick={saveEntry} style={{width:"100%",background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:18,letterSpacing:3,padding:"12px",cursor:"pointer"}}>LOG MEAL</button>
        {saved && <div style={{marginTop:8,fontSize:12,color:"#6ABF3A",textAlign:"center"}}>Saved!</div>}
      </div>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:8}}>
            {date===TODAY?"TODAY'S MEALS":new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}).toUpperCase()}
          </div>
          {todayEntries.map(function(e){
            return (
              <div key={e.id} style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:14}}>{MEAL_ICONS[e.meal]}</span>
                    <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:1,color:"#888"}}>{e.meal.toUpperCase()}</span>
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {e.calories>0&&<span style={{fontSize:11,color:MACRO_COLORS.calories}}>{e.calories}kcal</span>}
                    {e.protein>0&&<span style={{fontSize:11,color:MACRO_COLORS.protein}}>{e.protein}g protein</span>}
                    {e.carbs>0&&<span style={{fontSize:11,color:MACRO_COLORS.carbs}}>{e.carbs}g carbs</span>}
                    {e.fat>0&&<span style={{fontSize:11,color:MACRO_COLORS.fat}}>{e.fat}g fat</span>}
                    {e.water>0&&<span style={{fontSize:11,color:MACRO_COLORS.water}}>{e.water}oz water</span>}
                  </div>
                  {e.notes&&<div style={{fontSize:11,color:"#444",marginTop:3}}>{e.notes}</div>}
                </div>
                <button onClick={function(){deleteEntry(date,e.id);}} style={{background:"none",border:"none",color:"#2A2A2A",cursor:"pointer",fontSize:14,padding:"0 4px",marginLeft:8}} onMouseEnter={function(ev){ev.target.style.color="#FF4444";}} onMouseLeave={function(ev){ev.target.style.color="#2A2A2A";}}>x</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Past dates summary */}
      {allDates.filter(function(d){return d!==date;}).length > 0 && (
        <div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:8}}>PAST DAYS</div>
          {allDates.filter(function(d){return d!==date;}).slice(0,7).map(function(d){
            var entries = log[d]||[];
            var t = entries.reduce(function(a,e){return {calories:a.calories+(e.calories||0),protein:a.protein+(e.protein||0),water:a.water+(e.water||0)};},{calories:0,protein:0,water:0});
            var lbl = d===TODAY?"Today":new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
            return (
              <div key={d} onClick={function(){setDate(d);}} style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"10px 14px",marginBottom:6,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:1,color:"#888"}}>{lbl}</div>
                <div style={{display:"flex",gap:12}}>
                  {t.calories>0&&<span style={{fontSize:11,color:MACRO_COLORS.calories}}>{Math.round(t.calories)}kcal</span>}
                  {t.protein>0&&<span style={{fontSize:11,color:MACRO_COLORS.protein}}>{Math.round(t.protein)}g pro</span>}
                  {t.water>0&&<span style={{fontSize:11,color:MACRO_COLORS.water}}>{Math.round(t.water)}oz H2O</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── CARDIO TAB ─────────────────────────────────────────────────────────
function CardioTab(props) {
  var CTYPES = [
    { key:"run",   label:"Run",      icon:"🏃", color:"#F5A0A0" },
    { key:"walk",  label:"Walk",     icon:"🚶", color:"#A0F5D4" },
    { key:"yoga",  label:"Hot Yoga", icon:"🧘", color:"#F5C8A0" },
    { key:"cycle", label:"Cycle",    icon:"🚴", color:"#A0D4F5" },
    { key:"swim",  label:"Swim",     icon:"🏊", color:"#D4A0F5" },
    { key:"other", label:"Other",    icon:"⚡", color:"#F5F0A0" },
  ];
  var YSTYLES = ["Bikram","Hot Vinyasa","Hot Power","Yin","Restorative","Other"];
  var FEELS = ["","😫","😓","😐","💪","🔥"];
  var [log, setLog] = useState({});
  var [loaded, setLoaded] = useState(false);
  var [type, setType] = useState("run");
  var [date, setDate] = useState(TODAY);
  var [distance, setDistance] = useState("");
  var [duration, setDuration] = useState("");
  var [pace, setPace] = useState("");
  var [temp, setTemp] = useState("");
  var [yStyle, setYStyle] = useState("Hot Vinyasa");
  var [notes, setNotes] = useState("");
  var [feel, setFeel] = useState("3");
  var [saved, setSaved] = useState(false);

  var uid = (props.activeUser||{id:"user-1"}).id;
  var cardioKey = getCardioKey(uid);

  useEffect(function() {
    setLog({});
    setLoaded(false);
    var loaded = null;
    try { var ls = localStorage.getItem(cardioKey); if (ls) loaded = JSON.parse(ls); } catch(e) {}
    if (!loaded) {
      try { var s = sessionStorage.getItem(cardioKey); if (s) loaded = JSON.parse(s); } catch(e) {}
    }
    if (!loaded) loaded = {};
    // Inject cardio seeds for user-1 if missing
    if (uid === "user-1") {
      Object.keys(CARDIO_SEEDS).forEach(function(d) {
        if (!loaded[d] || loaded[d].length === 0) loaded[d] = CARDIO_SEEDS[d];
      });
    }
    setLog(loaded);
    setLoaded(true);
  }, [cardioKey, uid]);

  async function saveIt() {
    if (!duration) return;
    var ct = CTYPES.find(function(c) { return c.key === type; });
    var e = { id:Date.now(), type:type, label:ct.label, icon:ct.icon, color:ct.color, date:date, duration:parseFloat(duration)||0, distance:parseFloat(distance)||0, pace:pace, temp:temp, style:yStyle, notes:notes, feel:parseInt(feel) };
    var next = Object.assign({}, log, { [date]: (log[date]||[]).concat([e]) });
    setLog(next);
    try { localStorage.setItem(cardioKey, JSON.stringify(next)); } catch(ex) {}
    try { sessionStorage.setItem(cardioKey, JSON.stringify(next)); } catch(ex) {}
    setDistance(""); setDuration(""); setPace(""); setTemp(""); setNotes(""); setFeel("3");
    setSaved(true); setTimeout(function() { setSaved(false); }, 2000);
  }

  async function delIt(d, id) {
    var next = Object.assign({}, log, { [d]: (log[d]||[]).filter(function(e) { return e.id !== id; }) });
    setLog(next);
    try { localStorage.setItem(cardioKey, JSON.stringify(next)); } catch(ex) {}
    try { sessionStorage.setItem(cardioKey, JSON.stringify(next)); } catch(ex) {}
  }

  var ct = CTYPES.find(function(c) { return c.key === type; });
  var allDates = Object.keys(log).filter(function(d) { return (log[d]||[]).length > 0; }).sort(function(a,b) { return b.localeCompare(a); });
  var totalRuns=0, totalRunMi=0, totalWalkMi=0, totalYogaMins=0;
  allDates.forEach(function(d) {
    (log[d]||[]).forEach(function(e) {
      if (e.type==="run") { totalRuns++; totalRunMi+=e.distance||0; }
      if (e.type==="walk") totalWalkMi+=e.distance||0;
      if (e.type==="yoga") totalYogaMins+=e.duration||0;
    });
  });

  if (!loaded) return <div style={{padding:"40px",textAlign:"center",color:"#444",fontFamily:"Bebas Neue,sans-serif",letterSpacing:3}}>LOADING...</div>;

  function injectTodaySeed() {
    var seedToday = CARDIO_SEEDS[TODAY];
    if (!seedToday) return;
    var next = Object.assign({}, log, { [TODAY]: (log[TODAY]||[]).concat(seedToday) });
    setLog(next);
    try { localStorage.setItem(cardioKey, JSON.stringify(next)); } catch(e) {}
    try { sessionStorage.setItem(cardioKey, JSON.stringify(next)); } catch(e) {}
  }

  var canInjectToday = uid === "user-1" && CARDIO_SEEDS[TODAY] && (!log[TODAY] || log[TODAY].length === 0);

  return (
    <div style={{padding:"0 20px 60px"}}>
      {canInjectToday && (
        <div style={{background:"#0F1A0A",border:"1px solid #3A5C14",padding:"12px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div>
            <div style={{fontSize:10,color:"#6ABF3A",letterSpacing:2,marginBottom:2}}>READY TO IMPORT</div>
            <div style={{fontSize:13,color:"#C8C5BE"}}>Today: Run 3.7mi @ 10:00/mi + Hot Power yoga 60min</div>
          </div>
          <button onClick={injectTodaySeed} style={{background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:2,padding:"10px 14px",cursor:"pointer",whiteSpace:"nowrap"}}>
            + IMPORT
          </button>
        </div>
      )}
      <div style={{display:"flex",borderBottom:"1px solid #1A1A1A",marginBottom:20}}>
        {[{v:totalRuns,l:"RUNS"},{v:totalRunMi.toFixed(1)+"mi",l:"RUN DIST"},{v:totalWalkMi.toFixed(1)+"mi",l:"WALKED"},{v:Math.round(totalYogaMins)+"m",l:"YOGA"}].map(function(s,i) {
          return <div key={i} style={{flex:1,padding:"12px 0",borderRight:i<3?"1px solid #1A1A1A":"none",textAlign:"center"}}><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:"#D4FF6E"}}>{s.v}</div><div style={{fontSize:8,color:"#444",letterSpacing:1}}>{s.l}</div></div>;
        })}
      </div>
      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:8}}>ACTIVITY TYPE</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {CTYPES.map(function(c) {
          var active = type===c.key;
          return <button key={c.key} onClick={function() { setType(c.key); }} style={{background:active?c.color+"33":"#161616",border:"1px solid "+(active?c.color:"#2A2A2A"),color:active?c.color:"#666",fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,padding:"7px 10px",cursor:"pointer"}}>{c.icon} {c.label.toUpperCase()}</button>;
        })}
      </div>
      <div style={{background:"#111",border:"1px solid #222",padding:"16px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>{ct.icon}</span>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,letterSpacing:3,color:ct.color}}>LOG {ct.label.toUpperCase()}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>DATE</div><input className="fi" type="date" value={date} onChange={function(e){setDate(e.target.value);}}/></div>
          <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>DURATION (MINS)</div><input className="fi" type="number" value={duration} onChange={function(e){setDuration(e.target.value);}} placeholder="60"/></div>
          {(type==="run"||type==="walk"||type==="cycle"||type==="swim") && (
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>DISTANCE (MILES)</div><input className="fi" type="number" value={distance} onChange={function(e){setDistance(e.target.value);}} placeholder="3.1"/></div>
          )}
          {type==="run" && (
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>PACE (MIN/MILE)</div><input className="fi" value={pace} onChange={function(e){setPace(e.target.value);}} placeholder="9:30"/></div>
          )}
          {type==="yoga" && (
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>ROOM TEMP (F)</div><input className="fi" type="number" value={temp} onChange={function(e){setTemp(e.target.value);}} placeholder="105"/></div>
          )}
          {type==="yoga" && (
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>STYLE</div><select className="fi" value={yStyle} onChange={function(e){setYStyle(e.target.value);}}>{YSTYLES.map(function(s){return <option key={s} value={s}>{s}</option>;})}</select></div>
          )}
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>HOW DID IT FEEL?</div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4,5].map(function(n) {
                return <button key={n} onClick={function(){setFeel(String(n));}} style={{flex:1,padding:"10px 0",background:feel===String(n)?ct.color+"33":"#161616",border:"1px solid "+(feel===String(n)?ct.color:"#2A2A2A"),fontSize:18,cursor:"pointer",borderRadius:2}}>{FEELS[n]}</button>;
              })}
            </div>
          </div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>NOTES</div><input className="fi" value={notes} onChange={function(e){setNotes(e.target.value);}} placeholder="Route, how you felt..."/></div>
        </div>
        <button onClick={saveIt} style={{width:"100%",background:ct.color,color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:18,letterSpacing:3,padding:"13px",cursor:"pointer"}}>LOG {ct.label.toUpperCase()}</button>
        {saved && <div style={{marginTop:8,fontSize:12,color:"#6ABF3A",textAlign:"center"}}>Saved!</div>}
      </div>
      {allDates.length===0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:"#2A2A2A",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:3}}>NO CARDIO LOGGED YET</div>
      ) : allDates.map(function(d) {
        var entries = log[d]||[];
        var label = d===TODAY ? "TODAY" : new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}).toUpperCase();
        return (
          <div key={d} style={{marginBottom:10}}>
            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:2,color:"#555",marginBottom:6}}>{label}</div>
            {entries.map(function(e) {
              return (
                <div key={e.id} style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>{e.icon}</span>
                    <div>
                      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,letterSpacing:2,color:e.color}}>{e.label.toUpperCase()}</div>
                      <div style={{fontSize:12,color:"#555",marginTop:2}}>{e.duration}min{e.distance>0?" · "+e.distance+"mi":""}{e.pace?" · "+e.pace+"/mi":""}{e.type==="yoga"&&e.style?" · "+e.style:""}{e.temp?" · "+e.temp+"F":""}{e.feel?" · "+FEELS[e.feel]:""}</div>
                      {e.notes ? <div style={{fontSize:11,color:"#444",marginTop:2}}>{e.notes}</div> : null}
                    </div>
                  </div>
                  <button onClick={function(){delIt(d,e.id);}} style={{background:"none",border:"none",color:"#2A2A2A",cursor:"pointer",fontSize:14,padding:"0 4px"}} onMouseEnter={function(ev){ev.target.style.color="#FF4444";}} onMouseLeave={function(ev){ev.target.style.color="#2A2A2A";}}>x</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────



function ToolsTab(props) {
  var workouts = props.workouts;
  var persist = props.persist;
  var activeUser = props.activeUser || {id:"user-1", name:"User 1"};
  var users = props.users || [activeUser];

  // ── Rest Timer state
  var [timerSecs, setTimerSecs] = useState(90);
  var [timeLeft, setTimeLeft] = useState(null);
  var [timerRunning, setTimerRunning] = useState(false);
  var timerRef = useRef(null);

  // ── Body weight state
  var [bwInput, setBwInput] = useState("");
  var [bwLog, setBwLog] = useState({});

  // ── Templates state
  var [templates, setTemplates] = useState({});
  var [tplName, setTplName] = useState("");
  var [tplMsg, setTplMsg] = useState("");

  // ── Active tools tab
  var [tool, setTool] = useState("timer");

  // Load bw + templates from storage
  useEffect(function() {
    try { var s = sessionStorage.getItem("bw-log"); if(s) setBwLog(JSON.parse(s)); } catch(e){}
    try { var t = sessionStorage.getItem("wk-templates"); if(t) setTemplates(JSON.parse(t)); } catch(e){}
  }, []);

  function saveBw() {
    if (!bwInput) return;
    var next = Object.assign({}, bwLog, {[TODAY]: parseFloat(bwInput)});
    setBwLog(next);
    try { sessionStorage.setItem("bw-log", JSON.stringify(next)); } catch(e){}
    setBwInput("");
  }

  function saveTemplate() {
    var todayExs = workouts[TODAY] || [];
    if (!tplName.trim() || todayExs.length === 0) { setTplMsg("Name your template and log exercises first!"); return; }
    var next = Object.assign({}, templates, {[tplName.trim()]: todayExs.map(function(e){ return {group:e.group,name:e.name,sets:e.sets,reps:e.reps,weight:e.weight}; })});
    setTemplates(next);
    try { sessionStorage.setItem("wk-templates", JSON.stringify(next)); } catch(e){}
    setTplMsg("Saved: " + tplName.trim());
    setTplName("");
  }

  async function loadTemplate(name) {
    var exs = templates[name];
    if (!exs) return;
    var newExs = exs.map(function(e,i){ return Object.assign({},e,{id:Date.now()+i}); });
    var today = workouts[TODAY] || [];
    await persist(Object.assign({}, workouts, {[TODAY]: today.concat(newExs)}));
    setTplMsg("Loaded: " + name + " into today!");
  }

  function deleteTemplate(name) {
    var next = Object.assign({}, templates);
    delete next[name];
    setTemplates(next);
    try { sessionStorage.setItem("wk-templates", JSON.stringify(next)); } catch(e){}
  }

  // Timer logic
  useEffect(function() {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(function() { setTimeLeft(function(t){ return t-1; }); }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return function() { clearTimeout(timerRef.current); };
  }, [timerRunning, timeLeft]);

  function startTimer(secs) {
    clearTimeout(timerRef.current);
    setTimerSecs(secs);
    setTimeLeft(secs);
    setTimerRunning(true);
  }
  function stopTimer() { setTimerRunning(false); clearTimeout(timerRef.current); setTimeLeft(null); }

  // 1RM calc
  var [rmSets, setRmSets] = useState("");
  var [rmReps, setRmReps] = useState("");
  var [rmWeight, setRmWeight] = useState("");
  var rm = (rmWeight && rmReps) ? Math.round(parseFloat(rmWeight) / (1.0278 - 0.0278 * parseInt(rmReps))) : null;

  // Warmup calculator state
  var [wuWeight, setWuWeight] = useState("");
  var [wuReps, setWuReps] = useState("5");
  var [wuBar, setWuBar] = useState("45");

  // Plate calculator state
  var [plateTarget, setPlateTarget] = useState("");
  var [plateBar, setPlateBar] = useState("45");
  var [plateUnit, setPlateUnit] = useState("lbs");

  var bwDates = Object.keys(bwLog).sort();
  var toolBtns = ["timer","templates","bodyweight","streak","1rm","warmup","plates","backup"];

  function btnStyle(t) { return {background:tool===t?"#D4FF6E20":"transparent",border:"1px solid "+(tool===t?"#D4FF6E":"#2A2A2A"),color:tool===t?"#D4FF6E":"#555",fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:2,padding:"5px 10px",cursor:"pointer"}; }
  function sectionTitle(t) { return React.createElement("div", {style:{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:12}}, t); }
  function card(children) { return React.createElement("div", {style:{background:"#111",border:"1px solid #1A1A1A",padding:"16px",marginBottom:16}}, children); }

  return (
    <div style={{padding:"0 20px 60px"}}>
      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:14}}>TOOLS</div>
      {(function() {
        var last = null;
        try { last = localStorage.getItem("wk-last-backup"); } catch(e) {}
        var days = last ? Math.floor((new Date() - new Date(last)) / 86400000) : 999;
        if (days < 7) return null;
        return (
          <div onClick={function(){setTool("backup");}} style={{background:"#2A2A0A",border:"1px solid #C8B840",padding:"10px 14px",marginBottom:14,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,color:"#F5E080"}}>⚠ {last ? "Backup is "+days+" days old" : "You've never backed up"}</div>
            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,color:"#F5E080"}}>BACK UP →</div>
          </div>
        );
      })()}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
        {toolBtns.map(function(t){ return <button key={t} style={btnStyle(t)} onClick={function(){setTool(t);}}>{t.toUpperCase()}</button>; })}
      </div>

      {tool==="timer" && card(
        <div>
          {sectionTitle("REST TIMER")}
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:72,color:timeLeft===0?"#FF3A3A":timerRunning?"#D4FF6E":"#F0EDE6",letterSpacing:4,lineHeight:1}}>
              {timeLeft!==null ? Math.floor(timeLeft/60)+":"+(timeLeft%60<10?"0":"")+timeLeft%60 : "0:"+timerSecs}
            </div>
            {timeLeft===0 && <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:18,color:"#FF3A3A",letterSpacing:3,marginTop:4}}>REST OVER — GO!</div>}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[60,90,120].map(function(s){ return <button key={s} onClick={function(){startTimer(s);}} style={{flex:1,background:timerSecs===s&&timerRunning?"#D4FF6E20":"#161616",border:"1px solid "+(timerSecs===s&&timerRunning?"#D4FF6E":"#2A2A2A"),color:timerSecs===s&&timerRunning?"#D4FF6E":"#888",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:2,padding:"12px",cursor:"pointer"}}>{s}s</button>; })}
          </div>
          <button onClick={stopTimer} style={{width:"100%",background:"transparent",border:"1px solid #333",color:"#555",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"10px",cursor:"pointer"}}>RESET</button>
        </div>
      )}

      {tool==="templates" && card(
        <div>
          {sectionTitle("WORKOUT TEMPLATES")}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>SAVE TODAY AS TEMPLATE</div>
            <div style={{display:"flex",gap:8}}>
              <input className="fi" value={tplName} onChange={function(e){setTplName(e.target.value);}} placeholder="Template name e.g. Leg Day" style={{flex:1}}/>
              <button onClick={saveTemplate} style={{background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"0 16px",cursor:"pointer"}}>SAVE</button>
            </div>
            {tplMsg&&<div style={{fontSize:12,color:"#6ABF3A",marginTop:6}}>{tplMsg}</div>}
          </div>
          {Object.keys(templates).length===0
            ? <div style={{fontSize:13,color:"#444"}}>No templates yet. Log a workout and save it as a template to reuse it.</div>
            : Object.keys(templates).map(function(name){
                var t=templates[name];
                return <div key={name} style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,letterSpacing:2,color:"#F0EDE6"}}>{name}</div>
                    <div style={{fontSize:11,color:"#555",marginTop:2}}>{t.length} exercises</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={function(){loadTemplate(name);}} style={{background:"#D4FF6E20",border:"1px solid #D4FF6E",color:"#D4FF6E",fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,padding:"6px 12px",cursor:"pointer"}}>LOAD</button>
                    <button onClick={function(){deleteTemplate(name);}} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:14}} onMouseEnter={function(e){e.target.style.color="#FF4444";}} onMouseLeave={function(e){e.target.style.color="#333";}}>x</button>
                  </div>
                </div>;
              })
          }
        </div>
      )}

      {tool==="bodyweight" && card(
        <div>
          {sectionTitle("BODY WEIGHT TRACKER")}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <input className="fi" value={bwInput} onChange={function(e){setBwInput(e.target.value);}} placeholder="Today's weight (lbs)" type="number" style={{flex:1}}/>
            <button onClick={saveBw} style={{background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"0 16px",cursor:"pointer"}}>LOG</button>
          </div>
          {bwDates.length>=2 && (
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"8px 12px",flex:1}}>
                  <div style={{fontSize:9,color:"#444",letterSpacing:2}}>CURRENT</div>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:22,color:"#D4FF6E"}}>{bwLog[bwDates[bwDates.length-1]]} LBS</div>
                </div>
                <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"8px 12px",flex:1}}>
                  <div style={{fontSize:9,color:"#444",letterSpacing:2}}>CHANGE</div>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:22,color:bwLog[bwDates[bwDates.length-1]]-bwLog[bwDates[0]]<=0?"#6ABF3A":"#FF6E6E"}}>
                    {bwLog[bwDates[bwDates.length-1]]-bwLog[bwDates[0]]>=0?"+":""}{(bwLog[bwDates[bwDates.length-1]]-bwLog[bwDates[0]]).toFixed(1)} LBS
                  </div>
                </div>
              </div>
            </div>
          )}
          {bwDates.length===0
            ? <div style={{fontSize:13,color:"#444"}}>No weight logged yet. Enter your weight above to start tracking.</div>
            : <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A"}}>
                {bwDates.slice().reverse().slice(0,10).map(function(d,i){
                  return <div key={d} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderBottom:i<Math.min(bwDates.length,10)-1?"1px solid #161616":"none"}}>
                    <div style={{fontSize:12,color:"#666"}}>{new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase()}</div>
                    <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:16,color:"#F0EDE6"}}>{bwLog[d]} LBS</div>
                  </div>;
                })}
              </div>
          }
        </div>
      )}

      {tool==="streak" && card(
        (function(){
          function getStreak() {
            var streak=0, d=new Date(TODAY+"T12:00:00");
            while(true){
              var ds=d.toISOString().split("T")[0];
              if(!(workouts[ds]&&workouts[ds].length>0)) break;
              streak++; d.setDate(d.getDate()-1);
            }
            return streak;
          }
          function getLongestStreak() {
            var dates=Object.keys(workouts).filter(function(d){return (workouts[d]||[]).length>0;}).sort();
            var best=0,cur=0,prev=null;
            dates.forEach(function(d){
              if(prev){var diff=Math.round((new Date(d+"T12:00:00")-new Date(prev+"T12:00:00"))/86400000);cur=diff===1?cur+1:1;}else{cur=1;}
              if(cur>best)best=cur; prev=d;
            });
            return best;
          }
          var calCells2=[];
          var calToday2=new Date(TODAY+"T12:00:00");
          for(var ci2=27;ci2>=0;ci2--){var cd2=new Date(calToday2);cd2.setDate(cd2.getDate()-ci2);var ds2=cd2.toISOString().split("T")[0];calCells2.push({ds:ds2,hasWork:(workouts[ds2]||[]).length>0,isToday:ds2===TODAY,day:cd2.getDate()});}
          return (
        <div>
          {sectionTitle("CONSISTENCY TRACKER")}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:4}}>CURRENT STREAK</div>
              <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:40,color:"#D4FF6E",lineHeight:1}}>{getStreak()}</div>
              <div style={{fontSize:10,color:"#555",marginTop:2}}>DAYS</div>
            </div>
            <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:4}}>LONGEST STREAK</div>
              <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:40,color:"#A0D4F5",lineHeight:1}}>{getLongestStreak()}</div>
              <div style={{fontSize:10,color:"#555",marginTop:2}}>DAYS</div>
            </div>
            <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:4}}>TOTAL SESSIONS</div>
              <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:40,color:"#F5C8A0",lineHeight:1}}>{Object.keys(workouts).filter(function(d){return (workouts[d]||[]).length>0;}).length}</div>
              <div style={{fontSize:10,color:"#555",marginTop:2}}>SESSIONS</div>
            </div>
          </div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#444",marginBottom:8}}>LAST 4 WEEKS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
            {["S","M","T","W","T","F","S"].map(function(d,i){return <div key={i} style={{fontSize:8,color:"#333",textAlign:"center"}}>{d}</div>;})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {Array.from({length:new Date(calCells2[0].ds+"T12:00:00").getDay()}).map(function(_,i){return <div key={"e"+i}/>;})}
            {calCells2.map(function(c){
              return <div key={c.ds} title={c.ds} style={{aspectRatio:"1",background:c.hasWork?"#D4FF6E":c.isToday?"#2A2A2A":"#161616",borderRadius:3,outline:c.isToday?"1px solid #555":"none"}}/>;
            })}
          </div>
        </div>
          );
        })()
      )}

      {tool==="1rm" && card(
        <div>
          {sectionTitle("1RM CALCULATOR (Epley Formula)")}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>WEIGHT (LBS)</div><input className="fi" value={rmWeight} onChange={function(e){setRmWeight(e.target.value);}} placeholder="135" type="number"/></div>
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>REPS DONE</div><input className="fi" value={rmReps} onChange={function(e){setRmReps(e.target.value);}} placeholder="8" type="number"/></div>
            <div><div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>SETS</div><input className="fi" value={rmSets} onChange={function(e){setRmSets(e.target.value);}} placeholder="3" type="number"/></div>
          </div>
          {rm && (
            <div>
              <div style={{background:"#0F1A0A",border:"1px solid #3A5C14",padding:"16px",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:10,color:"#6ABF3A",letterSpacing:2,marginBottom:4}}>ESTIMATED 1 REP MAX</div>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:52,color:"#D4FF6E",lineHeight:1,letterSpacing:3}}>{rm} LBS</div>
              </div>
              <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#444",marginBottom:8}}>PERCENTAGE BREAKDOWN</div>
              <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A"}}>
                {[[100,"1 RM"],[95,"2 RM"],[90,"4 RM"],[85,"6 RM"],[80,"8 RM"],[75,"10 RM"],[70,"12 RM"]].map(function(r,i){
                  return <div key={r[0]} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",borderBottom:i<6?"1px solid #161616":"none"}}>
                    <div style={{fontSize:12,color:"#666"}}>{r[1]} ({r[0]}%)</div>
                    <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#F0EDE6"}}>{Math.round(rm*r[0]/100)} LBS</div>
                  </div>;
                })}
              </div>
            </div>
          )}
          {!rm && <div style={{fontSize:13,color:"#444"}}>Enter weight and reps above to calculate your estimated 1 rep max.</div>}
        </div>

      )}

      {tool==="warmup" && card(
        <div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:12}}>WARMUP WEIGHT CALCULATOR</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>WORKING WEIGHT (LBS)</div>
              <input className="fi" type="number" value={wuWeight} onChange={function(e){setWuWeight(e.target.value);}} placeholder="225"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>REPS PER SET</div>
              <input className="fi" type="number" value={wuReps} onChange={function(e){setWuReps(e.target.value);}} placeholder="5"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>BAR WEIGHT (LBS)</div>
              <select className="fi" value={wuBar} onChange={function(e){setWuBar(e.target.value);}}>
                <option value="45">45 (Olympic)</option>
                <option value="35">35 (Women)</option>
                <option value="15">15 (EZ bar)</option>
                <option value="0">0 (Dumbbell)</option>
              </select>
            </div>
          </div>
          {wuWeight && parseFloat(wuWeight) > 0 ? (function(){
            var working = parseFloat(wuWeight);
            var bar = parseFloat(wuBar);
            var reps = parseInt(wuReps) || 5;
            var sets = [
              {pct:0,   label:"Bar only",   reps:10, note:"Groove the pattern"},
              {pct:0.4, label:"40%",        reps:8,  note:"Light activation"},
              {pct:0.6, label:"60%",        reps:5,  note:"Building up"},
              {pct:0.75,label:"75%",        reps:3,  note:"Getting close"},
              {pct:0.9, label:"90%",        reps:1,  note:"Final prep"},
              {pct:1.0, label:"Working",    reps:reps, note:"Main sets"},
            ];
            function roundToPlate(lbs) {
              if (lbs <= bar) return bar;
              var plates = Math.round((lbs - bar) / 2 / 2.5) * 2.5;
              return bar + plates * 2;
            }
            return (
              <div>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#444",marginBottom:8}}>WARMUP PROGRESSION</div>
                <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A"}}>
                  {sets.map(function(s,i){
                    var lbs = s.pct === 0 ? bar : roundToPlate(working * s.pct);
                    var isWorking = s.pct === 1.0;
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 12px",borderBottom:i<sets.length-1?"1px solid #161616":"none",background:isWorking?"#0F1A0A":"transparent"}}>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:2,color:isWorking?"#D4FF6E":"#777"}}>{s.label}</div>
                          <div style={{fontSize:11,color:"#444",marginTop:1}}>{s.note}</div>
                        </div>
                        <div style={{textAlign:"right",marginLeft:12}}>
                          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:22,color:isWorking?"#D4FF6E":"#F0EDE6",letterSpacing:1}}>{lbs}</div>
                          <div style={{fontSize:10,color:"#555"}}>LBS x {s.reps}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:12,background:"#111",border:"1px solid #1A1A1A",padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:"#555",letterSpacing:2,marginBottom:4}}>PLATE MATH ({wuBar}lb bar)</div>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:14,color:"#888",letterSpacing:1}}>
                    Working: {working}lbs = {wuBar}lb bar + {((working - parseFloat(wuBar)) / 2).toFixed(1)}lbs each side
                  </div>
                </div>
              </div>
            );
          })() : <div style={{fontSize:13,color:"#444"}}>Enter your working weight above to see warmup sets.</div>}
        </div>
      )}

      {tool==="backup" && card(
        <div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:12}}>BACKUP & RESTORE</div>

          {(function() {
            var last = null;
            try { last = localStorage.getItem("wk-last-backup"); } catch(e) {}
            if (!last) {
              return (
                <div style={{background:"#2A1010",border:"1px solid #5A1010",padding:"10px 14px",marginBottom:14}}>
                  <div style={{fontSize:13,color:"#FF8080"}}>⚠ You have never backed up. Download one now to protect your data.</div>
                </div>
              );
            }
            var days = Math.floor((new Date() - new Date(last)) / 86400000);
            var lastLabel = new Date(last).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
            var stale = days >= 7;
            return (
              <div style={{background:stale?"#2A2A0A":"#0F1A0A",border:"1px solid "+(stale?"#C8B840":"#3A5C14"),padding:"10px 14px",marginBottom:14}}>
                <div style={{fontSize:13,color:stale?"#F5E080":"#6ABF3A"}}>
                  {stale ? "⚠ " : "✓ "}Last backup: {days===0?"today":days===1?"yesterday":days+" days ago"} ({lastLabel})
                  {stale ? " — time for a fresh backup!" : ""}
                </div>
              </div>
            );
          })()}

          <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#A0D4F5",letterSpacing:2,marginBottom:6}}>EXPORT</div>
            <div style={{fontSize:12,color:"#777",lineHeight:1.5,marginBottom:10}}>
              Downloads ALL your data (every user) as a JSON file. Save it to your phone or cloud drive in case anything breaks. Recommended: weekly.
            </div>
            <button onClick={function(){
              try {
                var allData = { exported: new Date().toISOString(), version: 1, users: [], data: {} };
                users.forEach(function(u) {
                  allData.users.push(u);
                  var wkts = null, card = null, nutr = null, body = null, goals = null;
                  try { var w = localStorage.getItem(getStorageKey(u.id)); if (w) wkts = JSON.parse(w); } catch(e) {}
                  try { var c = localStorage.getItem(getCardioKey(u.id)); if (c) card = JSON.parse(c); } catch(e) {}
                  try { var n = localStorage.getItem(getNutrKey(u.id)); if (n) nutr = JSON.parse(n); } catch(e) {}
                  try { var b = localStorage.getItem(BODY_KEY_PREFIX + u.id); if (b) body = JSON.parse(b); } catch(e) {}
                  try { var g = localStorage.getItem("nutr-goals-" + u.id); if (g) goals = JSON.parse(g); } catch(e) {}
                  allData.data[u.id] = { workouts: wkts, cardio: card, nutrition: nutr, body: body, goals: goals };
                });
                var blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = "workout-backup-" + TODAY + ".json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                try { localStorage.setItem("wk-last-backup", new Date().toISOString()); } catch(e) {}
              } catch(e) {
                alert("Export failed: " + e.message);
              }
            }} style={{width:"100%",background:"#A0D4F5",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:15,letterSpacing:2,padding:"11px",cursor:"pointer"}}>
              ⬇ DOWNLOAD BACKUP
            </button>
          </div>

          <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#F5C8A0",letterSpacing:2,marginBottom:6}}>IMPORT</div>
            <div style={{fontSize:12,color:"#777",lineHeight:1.5,marginBottom:10}}>
              Restore from a backup file. This will OVERWRITE current data for any user found in the backup. Take a fresh backup first if unsure.
            </div>
            <input type="file" accept=".json,application/json" id="restore-file-input" style={{display:"none"}}
              onChange={function(ev){
                var file = ev.target.files && ev.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(e) {
                  try {
                    var loaded = JSON.parse(e.target.result);
                    if (!loaded.data || !loaded.users) { alert("Invalid backup file."); return; }
                    if (!confirm("Restore backup from " + (loaded.exported||"unknown date") + "? This overwrites matching users.")) return;
                    // Save users list
                    try { localStorage.setItem(USERS_KEY, JSON.stringify({users:loaded.users, active:activeUser})); } catch(e) {}
                    // Save each user's data
                    loaded.users.forEach(function(u) {
                      var d = loaded.data[u.id] || {};
                      try { if (d.workouts) localStorage.setItem(getStorageKey(u.id), JSON.stringify(d.workouts)); } catch(e) {}
                      try { if (d.cardio) localStorage.setItem(getCardioKey(u.id), JSON.stringify(d.cardio)); } catch(e) {}
                      try { if (d.nutrition) localStorage.setItem(getNutrKey(u.id), JSON.stringify(d.nutrition)); } catch(e) {}
                      try { if (d.body) localStorage.setItem(BODY_KEY_PREFIX + u.id, JSON.stringify(d.body)); } catch(e) {}
                      try { if (d.goals) localStorage.setItem("nutr-goals-" + u.id, JSON.stringify(d.goals)); } catch(e) {}
                    });
                    alert("Restore complete! Reload the app to see your data.");
                  } catch(err) {
                    alert("Restore failed: " + err.message);
                  }
                };
                reader.readAsText(file);
              }}/>
            <button onClick={function(){var el=document.getElementById("restore-file-input"); if (el) el.click();}}
              style={{width:"100%",background:"transparent",border:"1px solid #F5C8A0",color:"#F5C8A0",fontFamily:"Bebas Neue,sans-serif",fontSize:15,letterSpacing:2,padding:"11px",cursor:"pointer"}}>
              ⬆ RESTORE FROM FILE
            </button>
          </div>

          <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#6ABF3A",letterSpacing:2,marginBottom:6}}>AUTO-SAVED RESTORE POINT</div>
            <div style={{fontSize:12,color:"#777",lineHeight:1.5,marginBottom:10}}>
              The app automatically saves a restore point inside itself every time you log a workout — no file needed. Use this if your current data looks wrong.
            </div>
            {(function() {
              var snap = null;
              try { var s = localStorage.getItem("wk-autobackup-" + activeUser.id); if (s) snap = JSON.parse(s); } catch(e) {}
              if (!snap) return <div style={{fontSize:12,color:"#444"}}>No auto-backup yet. Log a workout to create one.</div>;
              var savedLabel = new Date(snap.savedAt).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
              var sessionCount = snap.data && snap.data[activeUser.id] && snap.data[activeUser.id].workouts ? Object.keys(snap.data[activeUser.id].workouts).length : 0;
              return (
                <div>
                  <div style={{fontSize:12,color:"#6ABF3A",marginBottom:10}}>Last auto-save: {savedLabel} ({sessionCount} sessions)</div>
                  <button onClick={function(){
                    if (!confirm("Restore "+activeUser.name+"'s workouts from the auto-saved point ("+savedLabel+")? This overwrites current workout data.")) return;
                    try {
                      var d = snap.data[activeUser.id];
                      if (d && d.workouts) {
                        localStorage.setItem(getStorageKey(activeUser.id), JSON.stringify(d.workouts));
                        alert("Restored! Reload the app to see your data.");
                      }
                    } catch(e) { alert("Restore failed: " + e.message); }
                  }} style={{width:"100%",background:"transparent",border:"1px solid #6ABF3A",color:"#6ABF3A",fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,padding:"10px",cursor:"pointer"}}>
                    ↺ RESTORE FROM AUTO-SAVE
                  </button>
                </div>
              );
            })()}
          </div>

          <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px"}}>
            <div style={{fontSize:11,color:"#555",letterSpacing:2,marginBottom:6}}>STORAGE STATS</div>
            <div style={{fontSize:12,color:"#666",lineHeight:1.8}}>
              <div>Active user: <span style={{color:activeUser.color||"#D4FF6E"}}>{activeUser.name}</span></div>
              <div>Total users: <span style={{color:"#C8C5BE"}}>{users.length}</span></div>
              <div>Workouts: <span style={{color:"#C8C5BE"}}>{Object.keys(workouts).length} sessions</span></div>
            </div>
          </div>
        </div>
      )}

      {tool==="plates" && card(
        <div>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:3,color:"#555",marginBottom:12}}>PLATE CALCULATOR</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>TARGET WEIGHT</div>
              <input className="fi" type="number" value={plateTarget} onChange={function(e){setPlateTarget(e.target.value);}} placeholder="225"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>BAR WEIGHT</div>
              <select className="fi" value={plateBar} onChange={function(e){setPlateBar(e.target.value);}}>
                <option value="45">45 lb Olympic</option>
                <option value="35">35 lb Women</option>
                <option value="15">15 lb EZ bar</option>
                <option value="25">25 lb Fixed</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:5}}>UNIT</div>
              <select className="fi" value={plateUnit} onChange={function(e){setPlateUnit(e.target.value);}}>
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          {plateTarget && parseFloat(plateTarget) > 0 ? (function(){
            var target = parseFloat(plateTarget);
            var bar = parseFloat(plateBar);
            var isKg = plateUnit === "kg";
            var availablePlates = isKg
              ? [25, 20, 15, 10, 5, 2.5, 1.25]
              : [45, 35, 25, 10, 5, 2.5];

            if (target < bar) {
              return <div style={{fontSize:13,color:"#FF6E6E",padding:"10px 0"}}>Target weight must be greater than bar weight ({bar} {plateUnit}).</div>;
            }

            var perSide = (target - bar) / 2;
            if (perSide < 0) {
              return <div style={{fontSize:13,color:"#FF6E6E"}}>Target too light for this bar.</div>;
            }

            // Greedy plate algorithm
            var remaining = perSide;
            var plateList = [];
            availablePlates.forEach(function(p) {
              while (remaining >= p - 0.001) {
                plateList.push(p);
                remaining -= p;
              }
            });
            var remainder = Math.round(remaining * 1000) / 1000;
            var actual = bar + plateList.reduce(function(a,p){return a+p;},0)*2;

            var plateCounts = {};
            plateList.forEach(function(p){plateCounts[p]=(plateCounts[p]||0)+1;});
            var plateColors = {45:"#F5A0A0",35:"#F5C8A0",25:"#F5F0A0",10:"#C8F5A0",5:"#A0D4F5",2.5:"#D4A0F5",1.25:"#E0E0E0",20:"#F5A0A0",15:"#F5C8A0",1.25:"#E0E0E0"};

            return (
              <div>
                <div style={{background:"#0F1A0A",border:"1px solid #3A5C14",padding:"12px 16px",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#6ABF3A",letterSpacing:2,marginBottom:4}}>EACH SIDE OF THE BAR</div>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:32,color:"#D4FF6E",letterSpacing:2,lineHeight:1}}>{perSide} {plateUnit}</div>
                  {remainder > 0 && <div style={{fontSize:11,color:"#FF8040",marginTop:4}}>Note: rounded to {actual} {plateUnit} (nearest available plate)</div>}
                </div>

                {plateList.length > 0 ? (
                  <div>
                    <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#444",marginBottom:8}}>LOAD EACH SIDE</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                      {plateList.map(function(p,i){
                        return (
                          <div key={i} style={{background:plateColors[p]+"33",border:"2px solid "+(plateColors[p]||"#888"),borderRadius:4,padding:"8px 12px",textAlign:"center",minWidth:48}}>
                            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:plateColors[p]||"#D4FF6E",lineHeight:1}}>{p}</div>
                            <div style={{fontSize:8,color:"#555",letterSpacing:1}}>{plateUnit}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#444",marginBottom:8}}>SUMMARY</div>
                    <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A"}}>
                      {Object.keys(plateCounts).sort(function(a,b){return parseFloat(b)-parseFloat(a);}).map(function(p,i,arr){
                        return (
                          <div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderBottom:i<arr.length-1?"1px solid #161616":"none"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:10,height:10,background:plateColors[p]||"#888",borderRadius:2}}/>
                              <span style={{fontSize:13,color:"#C8C5BE"}}>{p} {plateUnit} plates</span>
                            </div>
                            <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:16,color:"#F0EDE6"}}>{plateCounts[p]} x 2 = {plateCounts[p]*2} total</span>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:"#0F1A0A",borderTop:"1px solid #3A5C14"}}>
                        <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:2,color:"#6ABF3A"}}>TOTAL ON BAR</span>
                        <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:18,color:"#D4FF6E"}}>{actual} {plateUnit}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{fontSize:13,color:"#444",padding:"10px 0"}}>Just the bar — no plates needed.</div>
                )}
              </div>
            );
          })() : <div style={{fontSize:13,color:"#444"}}>Enter your target weight above to see which plates to load.</div>}
        </div>
      )}
    </div>
  );
}

export default function App() {
  var DEFAULT_USER = {id:"user-1",name:"User 1",color:"#D4FF6E"};
  var [users, setUsers] = useState([DEFAULT_USER]);
  var [activeUser, setActiveUser] = useState(DEFAULT_USER);
  var activeUserRef = useRef(DEFAULT_USER);
  var [showUserSwitcher, setShowUserSwitcher] = useState(false);
  var [workouts, setWorkouts] = useState({});
  var [loaded, setLoaded] = useState(false);
  var [tab, setTab] = useState("TODAY");
  var [logDate, setLogDate] = useState(TODAY);
  var [todayCardio, setTodayCardio] = useState([]);
  var [todayNutrition, setTodayNutrition] = useState([]);

  // Load today's cardio and nutrition for snapshot
  useEffect(function() {
    try {
      var ckey = getCardioKey(activeUser.id);
      var cls = localStorage.getItem(ckey);
      var clog = cls ? JSON.parse(cls) : {};
      setTodayCardio(clog[TODAY] || []);
    } catch(e) { setTodayCardio([]); }
    try {
      var nkey = getNutrKey(activeUser.id);
      var nls = localStorage.getItem(nkey);
      var nlog = nls ? JSON.parse(nls) : {};
      setTodayNutrition(nlog[TODAY] || []);
    } catch(e) { setTodayNutrition([]); }
  }, [activeUser.id, tab]);
  var [name, setName] = useState("");
  var [showSugg, setShowSugg] = useState(false);
  var [weightMode, setWeightMode] = useState("barbell"); // barbell | single | pair
  var [showGenerate, setShowGenerate] = useState(false);
  var [genLoading, setGenLoading] = useState(false);
  var [genPlan, setGenPlan] = useState(null);
  var [genError, setGenError] = useState(null);
  var [activeTemplate, setActiveTemplate] = useState(null);
  var [supersetMode, setSupersetMode] = useState(false);
  var [supersetGroupId, setSupersetGroupId] = useState(null);
  var [group, setGroup] = useState("Back");
  var [sets, setSets] = useState("");
  var [reps, setReps] = useState("");
  var [weight, setWeight] = useState("");
  var [note, setNote] = useState("");
  var [flash, setFlash] = useState(null);
  var [saved, setSaved] = useState(false);
  var [saveErr, setSaveErr] = useState(false);
  var [openCard, setOpenCard] = useState(null);
  var [editingId, setEditingId] = useState(null);
  var [editFields, setEditFields] = useState({});
  var nameRef = useRef();

  var [storageWorks, setStorageWorks] = useState(true);

  useEffect(function() {
    // Test if localStorage actually persists
    try {
      localStorage.setItem("__wk_test", "1");
      var t = localStorage.getItem("__wk_test");
      localStorage.removeItem("__wk_test");
      setStorageWorks(t === "1");
    } catch(e) { setStorageWorks(false); }
  }, []);

  useEffect(function() {
    (async function() {
      // Load users list
      var savedUsers = [DEFAULT_USER];
      var savedActive = DEFAULT_USER;
      try {
        var ul = localStorage.getItem(USERS_KEY);
        if (ul) {
          var udata = JSON.parse(ul);
          if (udata.users && udata.users.length > 0) savedUsers = udata.users;
          if (udata.active && udata.active.id) savedActive = udata.active;
        }
      } catch(e) {}
      setUsers(savedUsers);
      setActiveUser(savedActive);
      activeUserRef.current = savedActive;
      // Load workout data for active user
      var uid = savedActive.id;
      var userKey = getStorageKey(uid);
      var parsed = null;
      // 1. localStorage — survives app closes
      try { var ls = localStorage.getItem(userKey) || localStorage.getItem(STORAGE_KEY); if (ls) parsed = JSON.parse(ls); } catch(e) {}
      // 2. window.storage fallback
      if (!parsed) {
        try {
          if (window.storage && typeof window.storage.get === "function") {
            var r = await window.storage.get(STORAGE_KEY);
            if (r && r.value) parsed = JSON.parse(r.value);
          }
        } catch(e) {}
      }
      // 3. sessionStorage fallback
      if (!parsed) { try { var s = sessionStorage.getItem(STORAGE_KEY); if (s) parsed = JSON.parse(s); } catch(e) {} }
      // 4. in-memory fallback
      if (!parsed && window.__wkBak) { try { parsed = JSON.parse(window.__wkBak); } catch(e) {} }
      if (!parsed) parsed = {};
      // Only seed the original user-1 (Collin), never inject into other users
      if (uid === "user-1") {
        if (!parsed[SEED_DATE]) parsed[SEED_DATE] = SEED_EX;
        if (!parsed[SEED_DATE2]) parsed[SEED_DATE2] = SEED_EX2;
        if (!parsed[SEED_DATE3]) parsed[SEED_DATE3] = SEED_EX3;
        if (!parsed[SEED_DATE4]) parsed[SEED_DATE4] = SEED_EX4;
      }
      setWorkouts(parsed);
      setLoaded(true);
    })();
  }, []);

  var persist = useCallback(async function(next) { // eslint-disable-next-line
    setWorkouts(next);
    var data = JSON.stringify(next);
    var ok = false;
    // 1. localStorage — survives app closes, most reliable for published artifacts
    try {
      var key = getStorageKey(activeUserRef.current.id);
      localStorage.setItem(key, data);
      // Redundant timestamped copy for recovery
      localStorage.setItem(key + "-lastsave", new Date().toISOString());
      ok = true;
    } catch(e) { console.warn('localStorage failed:', e); }
    // 2. window.storage fallback
    if (!ok) {
      try {
        if (window.storage && typeof window.storage.set === "function") {
          await window.storage.set(STORAGE_KEY, data);
          ok = true;
        }
      } catch(e) {}
    }
    // 3. sessionStorage fallback
    if (!ok) {
      try { sessionStorage.setItem(STORAGE_KEY, data); ok = true; } catch(e) {}
    }
    // 4. in-memory last resort
    if (!ok) { window.__wkBak = data; ok = true; }
    setSaved(ok);
    setSaveErr(!ok);
    if (ok) {
      // Auto-snapshot to in-app restore point (no file needed)
      try {
        var snap = { savedAt: new Date().toISOString(), data: {} };
        snap.data[activeUserRef.current.id] = { workouts: next };
        localStorage.setItem("wk-autobackup-" + activeUserRef.current.id, JSON.stringify(snap));
      } catch(e) {}
      setTimeout(function() { setSaved(false); }, 2000);
    }
  }, []);

  function autoBackupToStorage() {
    // Save an in-app restore snapshot of ALL users (no file needed)
    try {
      var snap = { savedAt: new Date().toISOString(), users: users, data: {} };
      users.forEach(function(u) {
        var d = {};
        try { var w = localStorage.getItem(getStorageKey(u.id)); if (w) d.workouts = JSON.parse(w); } catch(e) {}
        try { var c = localStorage.getItem(getCardioKey(u.id)); if (c) d.cardio = JSON.parse(c); } catch(e) {}
        try { var n = localStorage.getItem(getNutrKey(u.id)); if (n) d.nutrition = JSON.parse(n); } catch(e) {}
        try { var b = localStorage.getItem(BODY_KEY_PREFIX + u.id); if (b) d.body = JSON.parse(b); } catch(e) {}
        snap.data[u.id] = d;
      });
      localStorage.setItem("wk-autobackup", JSON.stringify(snap));
    } catch(e) {}
  }

  function downloadBackupFile() {
    try {
      var allData = { exported: new Date().toISOString(), version: 1, users: [], data: {} };
      users.forEach(function(u) {
        allData.users.push(u);
        var d = {};
        try { var w = localStorage.getItem(getStorageKey(u.id)); if (w) d.workouts = JSON.parse(w); } catch(e) {}
        try { var c = localStorage.getItem(getCardioKey(u.id)); if (c) d.cardio = JSON.parse(c); } catch(e) {}
        try { var n = localStorage.getItem(getNutrKey(u.id)); if (n) d.nutrition = JSON.parse(n); } catch(e) {}
        try { var b = localStorage.getItem(BODY_KEY_PREFIX + u.id); if (b) d.body = JSON.parse(b); } catch(e) {}
        try { var g = localStorage.getItem("nutr-goals-" + u.id); if (g) d.goals = JSON.parse(g); } catch(e) {}
        allData.data[u.id] = d;
      });
      var blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "workout-backup-" + TODAY + ".json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      try { localStorage.setItem("wk-last-backup", new Date().toISOString()); } catch(e) {}
    } catch(e) { alert("Backup failed: " + e.message); }
  }

  function switchUser(u, userList) {
    var list = userList || users;
    // Save to localStorage first
    try { localStorage.setItem(USERS_KEY, JSON.stringify({users:list, active:u})); } catch(e) {}
    // Load this user's workouts synchronously before setting state
    var userKey = getStorageKey(u.id);
    var parsed = null;
    try { var ls = localStorage.getItem(userKey); if (ls) parsed = JSON.parse(ls); } catch(e) {}
    if (!parsed) parsed = {};
    // Only seed the original user-1, never inject into other users
    if (u.id === "user-1") {
      if (!parsed[SEED_DATE]) parsed[SEED_DATE] = SEED_EX;
      if (!parsed[SEED_DATE2]) parsed[SEED_DATE2] = SEED_EX2;
      if (!parsed[SEED_DATE3]) parsed[SEED_DATE3] = SEED_EX3;
      if (!parsed[SEED_DATE4]) parsed[SEED_DATE4] = SEED_EX4;
    } else {
      // Remove any seed data that was accidentally injected into this user
      var seedIds = [1,2,3,4,5,6,7,8,9,10,11,12,13,101,102,103,104,105,106,201,202,203,204,205,301,302,303,304,305,306];
      [SEED_DATE, SEED_DATE2, SEED_DATE3, SEED_DATE4].forEach(function(sd) {
        if (parsed[sd]) {
          var clean = parsed[sd].filter(function(e) { return seedIds.indexOf(e.id) === -1; });
          if (clean.length === 0) delete parsed[sd];
          else parsed[sd] = clean;
        }
      });
    }
    // Set all state together to avoid partial renders
    activeUserRef.current = u;
    setWorkouts(parsed);
    setActiveUser(u);
    setLogDate(TODAY);
  }

  function addUser(u) {
    var next = users.concat([u]);
    setUsers(next);
    activeUserRef.current = u;
    // Save full user list FIRST, then switch — pass next list directly to avoid stale closure
    try { localStorage.setItem(USERS_KEY, JSON.stringify({users:next, active:u})); } catch(e) {}
    switchUser(u, next);
  }

  function editUser(updated) {
    var next = users.map(function(u) { return u.id === updated.id ? updated : u; });
    setUsers(next);
    // If the edited user is active, update activeUser too
    if (activeUser.id === updated.id) {
      setActiveUser(updated);
      activeUserRef.current = updated;
    }
    try {
      var currentActive = activeUser.id === updated.id ? updated : activeUser;
      localStorage.setItem(USERS_KEY, JSON.stringify({users:next, active:currentActive}));
    } catch(e) {}
  }

  function deleteUser(u) {
    if (users.length <= 1) return;
    if (u.id === activeUser.id) return; // safety
    var next = users.filter(function(x) { return x.id !== u.id; });
    setUsers(next);
    // Remove this user's data
    try {
      localStorage.removeItem(getStorageKey(u.id));
      localStorage.removeItem(getCardioKey(u.id));
      localStorage.removeItem(getNutrKey(u.id));
      localStorage.removeItem(BODY_KEY_PREFIX + u.id);
    } catch(e) {}
    try { localStorage.setItem(USERS_KEY, JSON.stringify({users:next, active:activeUser})); } catch(e) {}
  }

  async function addExercise() {
    if (!name.trim()) return;
    var ssId = null;
    if (supersetMode) {
      if (!supersetGroupId) {
        var newSsId = "ss-" + Date.now();
        setSupersetGroupId(newSsId);
        ssId = newSsId;
      } else {
        ssId = supersetGroupId;
      }
    } else {
      setSupersetGroupId(null);
    }
    var rawWeight = parseFloat(weight) || "";
    var loggedWeight = rawWeight;
    var weightNote = "";
    if (rawWeight && weightMode === "pair") {
      loggedWeight = rawWeight; // store per-hand, show as "25 lbs x2"
      weightNote = "x2 dumbbells (" + (rawWeight*2) + " lbs total)";
    } else if (rawWeight && weightMode === "single") {
      weightNote = "single dumbbell/cable";
    }
    var ex = {
      id: Date.now(), group: group, name: name.trim(),
      sets: parseInt(sets) || 1,
      reps: reps.includes("/") ? reps : (parseInt(reps) || 1),
      weight: loggedWeight,
      weightMode: weightMode,
      note: (note.trim() || weightNote) || undefined,
      supersetId: ssId || undefined,
    };
    var existing = workouts[logDate] || [];
    await persist(Object.assign({}, workouts, { [logDate]: existing.concat([ex]) }));
    setName(""); setSets(""); setReps(""); setWeight(""); setNote("");
    setFlash(ex.name);
    setTimeout(function() { setFlash(null); }, 2000);
    if (nameRef.current) nameRef.current.focus();
  }

  async function loadPlanIntoToday(exercises) {
    var newExs = exercises.map(function(e, i) { return Object.assign({}, e, { id: Date.now() + i }); });
    var existing = workouts[logDate] || [];
    await persist(Object.assign({}, workouts, { [logDate]: existing.concat(newExs) }));
    setShowGenerate(false);
    setGenPlan(null);
    setActiveTemplate(null);
  }

  async function generateAIPlan() {
    setGenLoading(true); setGenError(null); setGenPlan(null);
    var dates = Object.keys(workouts).sort(function(a,b){return b.localeCompare(a);});
    var fatigueInfo = ["Chest","Shoulders","Back","Biceps","Triceps","Legs","Core"].map(function(g){
      var d = daysSince(workouts,g);
      return g+": "+(d===null?"never":d===0?"today":d+"d ago");
    }).join(", ");
    var recentSessions = dates.slice(0,7).map(function(date){
      var exs=workouts[date]||[];
      return date+": "+[...new Set(exs.map(function(e){return e.group;}))].join(",");
    }).join("\n");
    var schema = '{"title":"string","focus":"string","exercises":[{"name":"string","group":"string","sets":3,"reps":10,"weight":""}]}';
    var prompt = "You are a personal trainer. Based on this data, generate an optimal workout. Recovery: " + fatigueInfo + ". Recent sessions: " + recentSessions + ". Respond with ONLY raw JSON matching this schema, no markdown: " + schema + ". Include 5-8 exercises. For weight use a number or empty string.";
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      var data = await res.json();
      console.log("API response:", data);
      // Try multiple response shapes
      var text = "";
      if (data && Array.isArray(data.content)) {
        text = data.content.map(function(b){ return (b && b.text) || ""; }).join("");
      } else if (data && typeof data.content === "string") {
        text = data.content;
      } else if (data && data.completion) {
        text = data.completion;
      } else if (typeof data === "string") {
        text = data;
      }
      text = (text || "").trim();
      if (!text) {
        throw new Error("Empty response. Try again.");
      }
      // Strip markdown code fences if present
      text = text.replace(/^[`]*json\n?/i, "").replace(/[`]*$/, "").trim();
      var start = text.indexOf("{"), end = text.lastIndexOf("}");
      if (start === -1 || end === -1) {
        throw new Error("Response not JSON: " + text.slice(0, 80));
      }
      var parsed = JSON.parse(text.slice(start, end+1));
      if (!parsed.exercises || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
        throw new Error("Plan has no exercises");
      }
      setGenPlan(parsed);
    } catch(e) {
      console.error("AI generation error:", e);
      setGenError(e.message || "Generation failed. Try a pre-built template.");
    }
    setGenLoading(false);
  }

  async function deleteEx(date, id) {
    var updated = Object.assign({}, workouts, { [date]: (workouts[date] || []).filter(function(e) { return e.id !== id; }) });
    await persist(updated);
  }

  var todayExs = workouts[logDate] || [];
  var byGroup = {};
  todayExs.forEach(function(e) { if (!byGroup[e.group]) byGroup[e.group] = []; byGroup[e.group].push(e); });
  var vol = calcVol(todayExs);
  var pastDates = Object.keys(workouts).sort(function(a, b) { return b.localeCompare(a); });

  if (!loaded) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0D0D0D", color:"#D4FF6E", fontSize:22, fontFamily:"monospace", letterSpacing:4 }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", color:"#F0EDE6", fontFamily:"Barlow Condensed,Arial Narrow,sans-serif", paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input, select { font-family: 'Barlow Condensed', sans-serif; }
        .fi { background:#161616; border:1px solid #2A2A2A; color:#F0EDE6; padding:10px 12px; font-size:15px; width:100%; outline:none; transition:border-color .2s; }
        .fi:focus { border-color:#D4FF6E; }
        select option { background:#1A1A1A; color:#F0EDE6; }
        .tb { background:none; border:none; color:#555; font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:2px; cursor:pointer; padding:8px 0; border-bottom:2px solid transparent; white-space:nowrap; transition:color .15s,border-color .15s; }
        .tb.act { color:#D4FF6E; border-bottom-color:#D4FF6E; }
        .er { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #1E1E1E; }
        .er:last-child { border-bottom:none; }
        .db { background:none; border:none; color:#333; cursor:pointer; font-size:15px; padding:0 4px; transition:color .15s; }
        .db:hover { color:#FF4444; }
        .fl { font-size:10px; letter-spacing:2px; color:#666; text-transform:uppercase; margin-bottom:5px; }
        .ab { background:#D4FF6E; color:#0D0D0D; border:none; padding:13px 28px; font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:2px; cursor:pointer; width:100%; }
        .ab:hover { opacity:0.85; }
      `}</style>

      {/* Sticky header */}
      <div style={{ background:"#0D0D0D", borderBottom:"1px solid #1E1E1E", padding:"16px 20px 0", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
          <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:26, letterSpacing:4, lineHeight:1 }}>WORKOUT LOG</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {saved && <span style={{ fontSize:10, color:"#6ABF3A", letterSpacing:1 }}>✓ SAVED</span>}
            {saveErr && <span style={{ fontSize:10, color:"#FF3A3A", letterSpacing:1 }}>SAVE FAILED</span>}
            <div style={{ fontSize:11, color:"#444", letterSpacing:1 }}>
              {new Date(TODAY + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" }).toUpperCase()}
            </div>
            <button onClick={function(){setShowUserSwitcher(true);}} title={"Switch user: "+activeUser.name}
              style={{width:30,height:30,borderRadius:"50%",background:activeUser.color+"33",border:"2px solid "+activeUser.color,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:"Bebas Neue,sans-serif",fontSize:13,color:activeUser.color,flexShrink:0}}>
              {activeUser.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
        <div style={{ display:"flex", gap:18, borderBottom:"1px solid #1E1E1E", overflowX:"auto" }}>
          {["TODAY","HISTORY","PROGRESS","RECOVERY","CARDIO","NUTRITION","BODY","TOOLS"].map(function(t) {
            return <button key={t} className={"tb" + (tab === t ? " act" : "")} onClick={function() { setTab(t); }}>{t}</button>;
          })}
        </div>
      </div>

      {!storageWorks && (
        <div style={{background:"#2A1010",border:"1px solid #FF3A3A",margin:"12px 20px",padding:"12px 14px"}}>
          <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:14,letterSpacing:2,color:"#FF6E6E",marginBottom:4}}>⚠ DATA WON'T SAVE HERE</div>
          <div style={{fontSize:12,color:"#FFA0A0",lineHeight:1.5}}>
            This browser blocks storage. Open in Safari and use "Add to Home Screen" so your workouts persist. Until then, your data will be lost when you close the app.
          </div>
        </div>
      )}

      {/* ── TODAY ── */}
      {/* key forces full remount on user switch — clears all tab state */}
      <div key={activeUser.id} style={{display:"contents"}}>
      {tab === "TODAY" && (
        <div style={{ padding:"0 20px" }}>
          <div style={{ display:"flex", gap:20, padding:"14px 0", borderBottom:"1px solid #1A1A1A", marginBottom:18 }}>
            <div><span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:26, color:"#D4FF6E" }}>{todayExs.length}</span><span style={{ fontSize:10, color:"#555", marginLeft:5, letterSpacing:1 }}>EXERCISES</span></div>
            {vol > 0 && <div><span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:26, color:"#D4FF6E" }}>{Math.round(vol).toLocaleString()}</span><span style={{ fontSize:10, color:"#555", marginLeft:5, letterSpacing:1 }}>LBS</span></div>}
            <div><span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:26, color:"#D4FF6E" }}>{Object.keys(byGroup).length}</span><span style={{ fontSize:10, color:"#555", marginLeft:5, letterSpacing:1 }}>GROUPS</span></div>
          </div>

          {/* ── Today Snapshot ── */}
          <div style={{background:"#0F0F0F",border:"1px solid #1A1A1A",padding:"12px 14px",marginBottom:16}}>
            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:8,display:"flex",justifyContent:"space-between"}}>
              <span>TODAY ALSO</span>
              <span style={{color:"#333",fontSize:9}}>{todayCardio.length} cardio · {todayNutrition.length} meals</span>
            </div>
            {(todayCardio.length === 0 && todayNutrition.length === 0) && (
              <div style={{fontSize:12,color:"#444"}}>No cardio or nutrition logged today yet. Go to <span style={{color:"#A0F5D4"}}>CARDIO</span> or <span style={{color:"#F5A0A0"}}>NUTRITION</span> tab to add.</div>
            )}
              {todayCardio.length > 0 && (
                <div style={{marginBottom: todayNutrition.length > 0 ? 8 : 0}}>
                  {todayCardio.map(function(c, i) {
                    return (
                      <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>{c.icon}</span>
                          <span style={{fontSize:13,color:c.color}}>{c.label}</span>
                        </div>
                        <span style={{fontSize:12,color:"#888"}}>
                          {c.duration}min{c.distance>0 ? " · "+c.distance+"mi" : ""}{c.pace ? " · "+c.pace+"/mi" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {todayNutrition.length > 0 && (function() {
                var tot = todayNutrition.reduce(function(a,e){return {cal:a.cal+(e.calories||0),pro:a.pro+(e.protein||0),wat:a.wat+(e.water||0),meals:a.meals+1};},{cal:0,pro:0,wat:0,meals:0});
                return (
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:16}}>🍽️</span>
                      <span style={{fontSize:13,color:"#F5A0A0"}}>{tot.meals} meal{tot.meals!==1?"s":""}</span>
                    </div>
                    <span style={{fontSize:12,color:"#888"}}>
                      {tot.cal>0?Math.round(tot.cal)+"kcal":""}{tot.pro>0?" · "+Math.round(tot.pro)+"g pro":""}{tot.wat>0?" · "+Math.round(tot.wat)+"oz":""}
                    </span>
                  </div>
                );
              })()}
          </div>

          {/* ── Log Date Picker ── */}
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:3}}>LOGGING TO</div>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:2,color:logDate===TODAY?"#D4FF6E":"#F5C8A0"}}>
                  {logDate===TODAY ? "TODAY" : new Date(logDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase()}
                </div>
              </div>
              <input type="date" value={logDate} max={TODAY} onChange={function(e){var v=e.target.value;if(!v){setLogDate(TODAY);return;}if(v>TODAY){setLogDate(TODAY);return;}setLogDate(v);}}
                style={{background:"#161616",border:"1px solid "+(logDate===TODAY?"#2A2A2A":"#F5C8A0"),color:"#C8C5BE",padding:"8px 10px",fontFamily:"Barlow Condensed,sans-serif",fontSize:13,outline:"none"}}/>
              <button onClick={function(){setLogDate(TODAY);}}
                style={{background:logDate===TODAY?"#1A1A0A":"#2A2A0A",border:"1px solid "+(logDate===TODAY?"#444":"#D4FF6E"),color:logDate===TODAY?"#666":"#D4FF6E",fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:1,padding:"8px 12px",cursor:"pointer"}}>
                ↻ TODAY
              </button>
            </div>
            {logDate !== TODAY && (
              <div style={{fontSize:11,color:"#F5C8A0",marginTop:6}}>⏪ Backfilling a past workout</div>
            )}
          </div>

          {/* ── Quick Log Row (one-tap workout logging) ── */}
          <div style={{marginBottom:12}}>
            <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:6}}>⚡ I JUST DID...</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {WORKOUT_TEMPLATES.map(function(t){
                return <button key={"qq"+t.key} onClick={function(){loadPlanIntoToday(t.exercises);}}
                  style={{flex:"1 1 30%",background:t.color+"22",border:"1px solid "+t.color,color:t.color,fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,padding:"10px 8px",cursor:"pointer"}}>
                  {t.icon} {t.label.toUpperCase()}
                </button>;
              })}
            </div>
            {(function() {
              // Find most recent non-today session
              var pastDates = Object.keys(workouts).filter(function(d){return d!==TODAY && (workouts[d]||[]).length>0;}).sort(function(a,b){return b.localeCompare(a);});
              if (pastDates.length === 0) return null;
              var lastDate = pastDates[0];
              var lastExs = workouts[lastDate] || [];
              var lastGroups = [...new Set(lastExs.map(function(e){return e.group;}))].slice(0,3).join(", ");
              var label = new Date(lastDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
              return (
                <button onClick={function(){
                  // Strip ids and keep weights from last session
                  var copies = lastExs.map(function(e,i){
                    return { id: Date.now()+i, group:e.group, name:e.name, sets:e.sets, reps:e.reps, weight:e.weight, weightMode:e.weightMode, note:e.note };
                  });
                  loadPlanIntoToday(copies);
                }}
                style={{width:"100%",background:"#161616",border:"1px dashed #444",color:"#888",fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:1,padding:"10px",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span>↻ COPY LAST SESSION</span>
                  <span style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"none"}}>{label} · {lastExs.length} ex · {lastGroups}</span>
                </button>
              );
            })()}
            {/* Copy from same weekday */}
            {(function() {
              var todayDow = new Date(TODAY+"T12:00:00").getDay();
              var dowName = ["SUN","MON","TUE","WED","THU","FRI","SAT"][todayDow];
              var sameDowDates = Object.keys(workouts).filter(function(d){
                return d!==TODAY && (workouts[d]||[]).length>0 && new Date(d+"T12:00:00").getDay()===todayDow;
              }).sort(function(a,b){return b.localeCompare(a);});
              if (sameDowDates.length === 0) return null;
              var lastSameDow = sameDowDates[0];
              var exs = workouts[lastSameDow] || [];
              var dowGroups = [...new Set(exs.map(function(e){return e.group;}))].slice(0,3).join(", ");
              var dowLabel = new Date(lastSameDow+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase();
              return (
                <button onClick={function(){
                  var copies = exs.map(function(e,i){
                    return { id: Date.now()+i+1000, group:e.group, name:e.name, sets:e.sets, reps:e.reps, weight:e.weight, weightMode:e.weightMode, note:e.note };
                  });
                  loadPlanIntoToday(copies);
                }}
                style={{width:"100%",background:"#161616",border:"1px dashed #444",color:"#888",fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:1,padding:"10px",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>📅 COPY LAST {dowName}</span>
                  <span style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"none"}}>{dowLabel} · {exs.length} ex · {dowGroups}</span>
                </button>
              );
            })()}
          </div>

          {/* ── Generate Workout Panel ── */}
          <div style={{marginBottom:16}}>
            <button onClick={function(){setShowGenerate(function(s){return !s;});setGenPlan(null);setGenError(null);setActiveTemplate(null);}}
              style={{width:"100%",background:showGenerate?"#1A1A0A":"#161616",border:"1px solid "+(showGenerate?"#D4FF6E":"#2A2A2A"),color:showGenerate?"#D4FF6E":"#666",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:3,padding:"12px",cursor:"pointer"}}>
              {showGenerate?"▲ CLOSE":"⚡ GENERATE WORKOUT"}
            </button>

            {showGenerate && (
              <div style={{background:"#0D0D0D",border:"1px solid #222",borderTop:"none",padding:"14px"}}>

                {/* Quick log — one-tap log */}
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#D4FF6E",marginBottom:8}}>⚡ I JUST DID...</div>
                <div style={{fontSize:11,color:"#555",marginBottom:8}}>One tap to instantly log a standard session</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {WORKOUT_TEMPLATES.map(function(t){
                    return <button key={"q"+t.key} onClick={function(){loadPlanIntoToday(t.exercises);}}
                      style={{background:t.color+"22",border:"1px solid "+t.color,color:t.color,fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,padding:"8px 12px",cursor:"pointer"}}>
                      {t.icon} {t.label.toUpperCase()}
                    </button>;
                  })}
                </div>

                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{flex:1,height:1,background:"#1A1A1A"}}/>
                  <div style={{fontSize:10,color:"#444",letterSpacing:2}}>OR PREVIEW FIRST</div>
                  <div style={{flex:1,height:1,background:"#1A1A1A"}}/>
                </div>

                {/* Pre-built templates */}
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:3,color:"#555",marginBottom:8}}>PREVIEW TEMPLATES</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {WORKOUT_TEMPLATES.map(function(t){
                    var isActive = activeTemplate===t.key;
                    return <button key={t.key} onClick={function(){setActiveTemplate(isActive?null:t.key);setGenPlan(null);}}
                      style={{background:isActive?t.color+"22":"#161616",border:"1px solid "+(isActive?t.color:"#2A2A2A"),color:isActive?t.color:"#666",fontFamily:"Bebas Neue,sans-serif",fontSize:12,letterSpacing:1,padding:"6px 10px",cursor:"pointer"}}>
                      {t.icon} {t.label.toUpperCase()}
                    </button>;
                  })}
                </div>

                {/* Template preview */}
                {activeTemplate && (function(){
                  var tpl = WORKOUT_TEMPLATES.find(function(t){return t.key===activeTemplate;});
                  if (!tpl) return null;
                  return (
                    <div style={{marginBottom:14}}>
                      <div style={{background:"#111",border:"1px solid #1A1A1A",padding:"10px 14px",marginBottom:8}}>
                        {tpl.exercises.map(function(ex,i){
                          return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<tpl.exercises.length-1?"1px solid #1A1A1A":"none"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:5,height:5,background:GROUP_COLORS[ex.group]||"#888",borderRadius:1}}/>
                              <span style={{fontSize:13,color:"#C8C5BE"}}>{ex.name}</span>
                            </div>
                            <span style={{fontSize:12,color:"#555"}}>{ex.sets}x{ex.reps}</span>
                          </div>;
                        })}
                      </div>
                      <button onClick={function(){loadPlanIntoToday(tpl.exercises);}}
                        style={{width:"100%",background:tpl.color,color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:3,padding:"11px",cursor:"pointer"}}>
                        LOAD {tpl.label.toUpperCase()} INTO TODAY
                      </button>
                    </div>
                  );
                })()}

                {/* AI divider */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{flex:1,height:1,background:"#1A1A1A"}}/>
                  <div style={{fontSize:10,color:"#444",letterSpacing:2}}>OR USE AI</div>
                  <div style={{flex:1,height:1,background:"#1A1A1A"}}/>
                </div>

                {/* AI generate button */}
                <button onClick={generateAIPlan} disabled={genLoading}
                  style={{width:"100%",background:genLoading?"#1A1A1A":"#D4FF6E20",border:"1px solid "+(genLoading?"#2A2A2A":"#D4FF6E"),color:genLoading?"#444":"#D4FF6E",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:3,padding:"11px",cursor:genLoading?"default":"pointer",marginBottom:10}}>
                  {genLoading?"ANALYZING YOUR HISTORY...":"⚡ AI: BUILD MY OPTIMAL WORKOUT"}
                </button>

                {genError && <div style={{fontSize:12,color:"#FF6E6E",marginBottom:10}}>{genError}</div>}

                {/* AI plan preview */}
                {genPlan && !genLoading && (
                  <div>
                    <div style={{background:"#0F1A0A",border:"1px solid #3A5C14",padding:"10px 14px",marginBottom:8}}>
                      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:16,color:"#D4FF6E",letterSpacing:2,marginBottom:2}}>{genPlan.title||"AI Workout"}</div>
                      <div style={{fontSize:12,color:"#6ABF3A"}}>{genPlan.focus}</div>
                    </div>
                    <div style={{background:"#111",border:"1px solid #1A1A1A",padding:"10px 14px",marginBottom:8}}>
                      {(genPlan.exercises||[]).map(function(ex,i){
                        return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<genPlan.exercises.length-1?"1px solid #1A1A1A":"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:5,height:5,background:GROUP_COLORS[ex.group]||"#888",borderRadius:1}}/>
                            <span style={{fontSize:13,color:"#C8C5BE"}}>{ex.name}</span>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <span style={{fontSize:12,color:"#555"}}>{ex.sets}x{ex.reps}</span>
                            {ex.weight?<span style={{fontSize:12,color:"#D4FF6E",marginLeft:6}}>{ex.weight}lbs</span>:null}
                          </div>
                        </div>;
                      })}
                    </div>
                    <button onClick={function(){loadPlanIntoToday(genPlan.exercises||[]);}}
                      style={{width:"100%",background:"#D4FF6E",color:"#0D0D0D",border:"none",fontFamily:"Bebas Neue,sans-serif",fontSize:16,letterSpacing:3,padding:"11px",cursor:"pointer"}}>
                      LOAD AI WORKOUT INTO TODAY
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ background:"#111", border:"1px solid #222", padding:"16px", marginBottom:22 }}>
            <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:15, letterSpacing:3, color:"#D4FF6E", marginBottom:12 }}>+ LOG EXERCISE</div>
            <div style={{ marginBottom:10, position:"relative" }}>
              <div className="fl">Exercise Name</div>
              <input ref={nameRef} className="fi" value={name}
                onChange={function(e) { setName(e.target.value); setShowSugg(true); }}
                onFocus={function() { setShowSugg(true); }}
                onBlur={function() { setTimeout(function() { setShowSugg(false); }, 150); }}
                onKeyDown={function(e) { if (e.key === "Enter") { addExercise(); setShowSugg(false); } }}
                placeholder="Type to search exercises..." autoComplete="off" />
              {showSugg && (function() {
                var allEx = [];
                // First: previously logged exercises matching query
                var logged = [];
                Object.values(workouts).forEach(function(exs) {
                  exs.forEach(function(ex) { if (logged.indexOf(ex.name) === -1) logged.push(ex.name); });
                });
                var query = name.trim().toLowerCase();
                var libAll = [];
                var grpLib = EXERCISE_LIBRARY[group] || [];
                // Group-specific first, then all others
                var otherLib = [];
                Object.keys(EXERCISE_LIBRARY).forEach(function(g) {
                  if (g !== group) EXERCISE_LIBRARY[g].forEach(function(e) { otherLib.push(e); });
                });
                var combined = grpLib.concat(otherLib);
                var filtered = (query.length > 0
                  ? combined.filter(function(e) { return e.toLowerCase().includes(query); })
                  : grpLib
                ).slice(0, 8);
                // Add logged exercises that match
                var loggedMatches = logged.filter(function(e) {
                  return e.toLowerCase().includes(query) && filtered.indexOf(e) === -1;
                }).slice(0, 3);
                var suggestions = loggedMatches.concat(filtered).slice(0, 8);
                if (suggestions.length === 0) return null;
                return (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#1A1A1A", border:"1px solid #333", zIndex:100, maxHeight:220, overflowY:"auto" }}>
                    {loggedMatches.length > 0 && <div style={{ fontSize:9,color:"#555",letterSpacing:2,padding:"6px 12px 2px" }}>RECENTLY LOGGED</div>}
                    {loggedMatches.map(function(s) {
                      return <div key={"l"+s} onMouseDown={function() { setName(s); setShowSugg(false); nameRef.current && nameRef.current.blur(); }}
                        style={{ padding:"10px 12px", cursor:"pointer", fontSize:14, color:"#D4FF6E", borderBottom:"1px solid #222" }}
                        onMouseEnter={function(e) { e.target.style.background="#2A2A2A"; }}
                        onMouseLeave={function(e) { e.target.style.background="transparent"; }}>
                        ★ {s}
                      </div>;
                    })}
                    {filtered.length > 0 && <div style={{ fontSize:9,color:"#555",letterSpacing:2,padding:"6px 12px 2px" }}>{group.toUpperCase()}</div>}
                    {filtered.map(function(s) {
                      return <div key={"f"+s} onMouseDown={function() { setName(s); setShowSugg(false); }}
                        style={{ padding:"10px 12px", cursor:"pointer", fontSize:14, color:"#C8C5BE", borderBottom:"1px solid #1E1E1E" }}
                        onMouseEnter={function(e) { e.target.style.background="#2A2A2A"; }}
                        onMouseLeave={function(e) { e.target.style.background="transparent"; }}>
                        {s}
                      </div>;
                    })}
                  </div>
                );
              })()}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div>
                <div className="fl">Muscle Group</div>
                <select className="fi" value={group} onChange={function(e) { setGroup(e.target.value); }}>
                  {MUSCLE_GROUPS.map(function(g) { return <option key={g} value={g}>{g}</option>; })}
                </select>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}><div className="fl">Sets</div><input className="fi" value={sets} onChange={function(e) { setSets(e.target.value); }} placeholder="3" /></div>
                <div style={{ flex:1 }}><div className="fl">Reps</div><input className="fi" value={reps} onChange={function(e) { setReps(e.target.value); }} placeholder="10" /></div>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <div className="fl">Weight</div>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  {[
                    {key:"barbell", label:"Barbell", hint:"Both hands"},
                    {key:"single",  label:"Single",  hint:"1 dumbbell/cable"},
                    {key:"pair",    label:"Pair",     hint:"2 dumbbells"},
                  ].map(function(m){
                    var active = weightMode===m.key;
                    return <button key={m.key} onClick={function(){setWeightMode(m.key);}}
                      style={{flex:1,background:active?"#D4FF6E20":"#161616",border:"1px solid "+(active?"#D4FF6E":"#2A2A2A"),color:active?"#D4FF6E":"#555",fontFamily:"Bebas Neue,sans-serif",fontSize:11,letterSpacing:1,padding:"7px 4px",cursor:"pointer",textAlign:"center"}}>
                      <div>{m.label.toUpperCase()}</div>
                      <div style={{fontSize:9,color:active?"#6ABF3A":"#333",marginTop:1}}>{m.hint}</div>
                    </button>;
                  })}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input className="fi" value={weight} onChange={function(e){setWeight(e.target.value);}} placeholder={weightMode==="barbell"?"Total lbs (e.g. 135)":weightMode==="pair"?"Each dumbbell (e.g. 25)":"Weight (e.g. 50)"} style={{flex:1}} type="number"/>
                  {weight && weightMode==="pair" && (
                    <div style={{background:"#161616",border:"1px solid #2A2A2A",padding:"10px 12px",whiteSpace:"nowrap"}}>
                      <div style={{fontSize:9,color:"#555",letterSpacing:1}}>TOTAL</div>
                      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:16,color:"#D4FF6E"}}>{parseFloat(weight)*2} lbs</div>
                    </div>
                  )}
                  {weight && weightMode==="barbell" && (
                    <div style={{background:"#161616",border:"1px solid #2A2A2A",padding:"10px 12px",whiteSpace:"nowrap"}}>
                      <div style={{fontSize:9,color:"#555",letterSpacing:1}}>EACH SIDE</div>
                      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:16,color:"#D4FF6E"}}>{(Math.max(0,parseFloat(weight)-45)/2).toFixed(1)} lbs</div>
                    </div>
                  )}
                </div>
                {weight && weightMode==="pair" && <div style={{fontSize:10,color:"#6ABF3A",marginTop:4}}>Logging as {weight} lbs per hand ({parseFloat(weight)*2} lbs total)</div>}
                {weight && weightMode==="single" && <div style={{fontSize:10,color:"#A0D4F5",marginTop:4}}>Logging as {weight} lbs (one dumbbell/cable)</div>}
                {weight && weightMode==="barbell" && <div style={{fontSize:10,color:"#F5C8A0",marginTop:4}}>Logging as {weight} lbs total (both hands on bar)</div>}
              </div>
              <div><div className="fl">Note</div><input className="fi" value={note} onChange={function(e) { setNote(e.target.value); }} placeholder="Optional" /></div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:0}}>
              <button className="ab" style={{flex:1}} onClick={addExercise}>ADD TO LOG</button>
              <button onClick={function(){setSupersetMode(function(m){return !m;});}} style={{background:supersetMode?"#F5C8A020":"#161616",border:"1px solid "+(supersetMode?"#F5C8A0":"#2A2A2A"),color:supersetMode?"#F5C8A0":"#555",fontFamily:"Bebas Neue,sans-serif",fontSize:13,letterSpacing:1,padding:"0 14px",cursor:"pointer",whiteSpace:"nowrap"}}>
                {supersetMode?"SUPERSET ON":"SUPERSET"}
              </button>
            </div>
            {supersetMode && <div style={{marginTop:6,fontSize:11,color:"#F5C8A0",letterSpacing:1}}>Superset mode: exercises added will be linked together</div>}
            {flash && flash !== 'WORKOUT COMPLETE' && <div style={{ marginTop:10, fontSize:13, color:"#D4FF6E", letterSpacing:1 }}>✓ {flash} added!</div>}
            {flash === 'WORKOUT COMPLETE' && (
              <div style={{ marginTop:10, background:"#0F1A0A", border:"1px solid #6ABF3A", padding:"12px 16px", textAlign:"center" }}>
                <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:20, color:"#6ABF3A", letterSpacing:3 }}>WORKOUT COMPLETE 💪</div>
                <div style={{ fontSize:12, color:"#6ABF3A99", marginTop:4, marginBottom:10 }}>{todayExs.length} exercises logged · {vol > 0 ? Math.round(vol).toLocaleString() + ' lbs moved' : 'Great session!'}</div>
                <button onClick={downloadBackupFile} style={{ background:"#6ABF3A", color:"#0D0D0D", border:"none", fontFamily:"Bebas Neue,sans-serif", fontSize:13, letterSpacing:2, padding:"9px 16px", cursor:"pointer", width:"100%" }}>
                  ⬇ BACK UP MY DATA NOW
                </button>
              </div>
            )}
          </div>

          {todayExs.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <button onClick={function() {
                var msg = todayExs.length + ' exercises logged. Great work today!';
                setFlash('WORKOUT COMPLETE');
                setTimeout(function() { setFlash(null); }, 4000);
              }} style={{ width:"100%", background:"transparent", border:"2px solid #6ABF3A", color:"#6ABF3A", fontFamily:"Bebas Neue,sans-serif", fontSize:22, letterSpacing:3, padding:"14px", cursor:"pointer" }}>
                ✓ DONE WITH WORKOUT
              </button>
            </div>
          )}

          {todayExs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"50px 0", color:"#2A2A2A", fontFamily:"Bebas Neue,sans-serif", fontSize:18, letterSpacing:3 }}>NO EXERCISES YET</div>
          ) : (function() {
            // Group by superset then by muscle group for display
            var supersetColors = ["#F5C8A0","#A0D4F5","#F5A0D4","#C8F5A0","#D4A0F5","#F5F0A0"];
            var ssColorMap = {};
            var ssIdx = 0;
            todayExs.forEach(function(ex) {
              if (ex.supersetId && !ssColorMap[ex.supersetId]) {
                ssColorMap[ex.supersetId] = supersetColors[ssIdx % supersetColors.length];
                ssIdx++;
              }
            });
            return Object.keys(byGroup).map(function(grp) {
            var exs = byGroup[grp];
            return (
              <div key={grp} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:8, height:8, background:GROUP_COLORS[grp] || "#888", borderRadius:1 }} />
                  <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:15, letterSpacing:3, color:"#666" }}>{grp.toUpperCase()}</div>
                  <div style={{ flex:1, height:1, background:"#1A1A1A" }} />
                </div>
                <div style={{ background:"#111", border:"1px solid #1A1A1A", padding:"0 14px" }}>
                  {exs.map(function(ex) {
                    var ssColor = ex.supersetId ? ssColorMap[ex.supersetId] : null;
                    return (
                      <div key={ex.id} style={{ borderBottom:"1px solid #1E1E1E" }}>
                        {editingId === ex.id ? (
                          <div style={{ padding:"10px 0" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                              <div style={{ gridColumn:"1/-1" }}>
                                <div className="fl">Exercise Name</div>
                                <input className="fi" value={editFields.name || ""} onChange={function(e) { setEditFields(function(p) { return Object.assign({},p,{name:e.target.value}); }); }} />
                              </div>
                              <div>
                                <div className="fl">Muscle Group</div>
                                <select className="fi" value={editFields.group || "Back"} onChange={function(e) { setEditFields(function(p) { return Object.assign({},p,{group:e.target.value}); }); }}>
                                  {MUSCLE_GROUPS.map(function(g) { return React.createElement("option",{key:g,value:g},g); })}
                                </select>
                              </div>
                              <div style={{ display:"flex", gap:6 }}>
                                <div style={{ flex:1 }}>
                                  <div className="fl">Sets</div>
                                  <input className="fi" value={editFields.sets || ""} onChange={function(e) { setEditFields(function(p) { return Object.assign({},p,{sets:e.target.value}); }); }} />
                                </div>
                                <div style={{ flex:1 }}>
                                  <div className="fl">Reps</div>
                                  <input className="fi" value={editFields.reps || ""} onChange={function(e) { setEditFields(function(p) { return Object.assign({},p,{reps:e.target.value}); }); }} />
                                </div>
                              </div>
                              <div>
                                <div className="fl">Weight (lbs)</div>
                                <input className="fi" value={editFields.weight || ""} onChange={function(e) { setEditFields(function(p) { return Object.assign({},p,{weight:e.target.value}); }); }} />
                              </div>
                              <div>
                                <div className="fl">Note</div>
                                <input className="fi" value={editFields.note || ""} onChange={function(e) { setEditFields(function(p) { return Object.assign({},p,{note:e.target.value}); }); }} />
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={async function() {
                                var updated = (workouts[logDate] || []).map(function(e) {
                                  if (e.id !== ex.id) return e;
                                  return Object.assign({}, e, {
                                    name: editFields.name || e.name,
                                    group: editFields.group || e.group,
                                    sets: parseInt(editFields.sets) || e.sets,
                                    reps: (editFields.reps || "").includes("/") ? editFields.reps : (parseInt(editFields.reps) || e.reps),
                                    weight: parseFloat(editFields.weight) || "",
                                    note: editFields.note || undefined,
                                  });
                                });
                                await persist(Object.assign({}, workouts, { [logDate]: updated }));
                                setEditingId(null);
                              }} style={{ flex:1, background:"#D4FF6E", color:"#0D0D0D", border:"none", fontFamily:"Bebas Neue,sans-serif", fontSize:16, letterSpacing:2, padding:"10px", cursor:"pointer" }}>
                                SAVE
                              </button>
                              <button onClick={function() { setEditingId(null); }} style={{ background:"transparent", border:"1px solid #333", color:"#666", fontFamily:"Bebas Neue,sans-serif", fontSize:16, letterSpacing:2, padding:"10px 16px", cursor:"pointer" }}>
                                CANCEL
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="er" style={{ borderBottom:"none", borderLeft: ssColor ? "3px solid "+ssColor : "none", paddingLeft: ssColor ? 8 : 0 }}>
                            <div style={{ flex:1 }}>
                              {ssColor && <div style={{ fontSize:9, color:ssColor, letterSpacing:2, marginBottom:2 }}>SUPERSET</div>}
                              <div style={{ fontSize:15, fontWeight:600, color:"#F0EDE6" }}>{ex.name}</div>
                              <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{fmtDetail(ex)}</div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              {ex.weight ? <div style={{ textAlign:"right" }}><span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:20, color:GROUP_COLORS[grp] || "#D4FF6E" }}>{ex.weight}</span><span style={{ fontSize:9, color:"#444", marginLeft:3 }}>LBS</span></div> : null}
                              <button style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:13, fontFamily:"Bebas Neue,sans-serif", letterSpacing:1, padding:"0 4px" }} onClick={function() {
                                setEditingId(ex.id);
                                setEditFields({ name:ex.name, group:ex.group, sets:String(ex.sets), reps:String(ex.reps), weight:String(ex.weight||""), note:ex.note||"" });
                              }}>EDIT</button>
                              <button className="db" onClick={function() { deleteEx(logDate, ex.id); }}>✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
          })()}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "HISTORY" && (
        <div style={{ padding:"0 20px" }}>
          <div style={{ display:"flex", borderBottom:"1px solid #1A1A1A", marginBottom:20 }}>
            {[
              { v: Object.keys(workouts).length, l:"SESSIONS" },
              { v: Object.values(workouts).reduce(function(a, e) { return a + e.length; }, 0), l:"EXERCISES" },
              { v: Math.round(Object.values(workouts).reduce(function(a, e) { return a + calcVol(e); }, 0) / 1000) + "k", l:"LBS" },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ flex:1, padding:"14px 0", borderRight:i < 2 ? "1px solid #1A1A1A" : "none", textAlign:"center" }}>
                  <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:28, color:"#D4FF6E", letterSpacing:2 }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"#444", letterSpacing:2 }}>{s.l}</div>
                </div>
              );
            })}
          </div>
          {/* ── Monthly Summary ── */}
          <MonthlySummary workouts={workouts} />

          {pastDates.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#2A2A2A", fontFamily:"Bebas Neue,sans-serif", fontSize:16, letterSpacing:3 }}>NO PAST SESSIONS YET</div>
          ) : pastDates.map(function(date) {
            var exs = workouts[date] || [];
            var v = calcVol(exs);
            var groups = [...new Set(exs.map(function(e) { return e.group; }))];
            var isOpen = openCard === date;
            var byG = {};
            exs.forEach(function(e) { if (!byG[e.group]) byG[e.group] = []; byG[e.group].push(e); });
            var label = date === TODAY ? "TODAY" : new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" }).toUpperCase();
            return (
              <div key={date} style={{ background:"#0F0F0F", border:"1px solid #1A1A1A", marginBottom:8 }}>
                <div onClick={function() { setOpenCard(isOpen ? null : date); }}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", cursor:"pointer" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                      <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:15, letterSpacing:2, color:"#F0EDE6" }}>{label}</div>
                      <div style={{ fontSize:10, color:"#444" }}>{isOpen ? "▲" : "▼"}</div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {groups.map(function(g) {
                        return <span key={g} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#555" }}><span style={{ width:6, height:6, background:GROUP_COLORS[g] || "#555", borderRadius:1, display:"inline-block" }} />{g}</span>;
                      })}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:14, textAlign:"right" }}>
                    <div><div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:22, color:"#D4FF6E" }}>{exs.length}</div><div style={{ fontSize:9, color:"#444" }}>EXER</div></div>
                    {v > 0 && <div><div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:22, color:"#D4FF6E" }}>{Math.round(v / 1000 * 10) / 10}k</div><div style={{ fontSize:9, color:"#444" }}>LBS</div></div>}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop:"1px solid #1A1A1A", padding:"0 16px 14px" }}>
                    {Object.keys(byG).map(function(grp) {
                      return (
                        <div key={grp} style={{ marginTop:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                            <div style={{ width:7, height:7, background:GROUP_COLORS[grp] || "#888", borderRadius:1 }} />
                            <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:12, letterSpacing:2, color:"#555" }}>{grp.toUpperCase()}</div>
                          </div>
                          {byG[grp].map(function(ex) {
                            return (
                              <div key={ex.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #161616" }}>
                                <div>
                                  <div style={{ fontSize:14, fontWeight:600, color:"#B0ADA6" }}>{ex.name}</div>
                                  <div style={{ fontSize:12, color:"#555", marginTop:1 }}>{fmtDetail(ex)}</div>
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  {ex.weight ? <span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:17, color:GROUP_COLORS[grp] || "#D4FF6E" }}>{ex.weight}<span style={{ fontSize:9, color:"#444", marginLeft:2 }}>LBS</span></span> : null}
                                  <button onClick={function() { deleteEx(date, ex.id); }} style={{ background:"none", border:"none", color:"#2A2A2A", cursor:"pointer", fontSize:14, padding:"0 2px" }} onMouseEnter={function(e) { e.target.style.color="#FF4444"; }} onMouseLeave={function(e) { e.target.style.color="#2A2A2A"; }}>✕</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab === "PROGRESS" && <ProgressTab workouts={workouts} />}

      {/* ── RECOVERY ── */}
      {tab === "RECOVERY" && <RecoveryTab workouts={workouts} />}

      {/* ── CARDIO ── */}
      {tab === "CARDIO" && <CardioTab activeUser={activeUser} />}

      {/* ── TOOLS ── */}
      {tab === "NUTRITION" && <NutritionTab activeUser={activeUser} />}
      {tab === "BODY" && <BodyTab activeUser={activeUser} />}
      {tab === "TOOLS" && <ToolsTab workouts={workouts} persist={persist} activeUser={activeUser} users={users} />}

      </div>

      {showUserSwitcher && (
        <UserSwitcher
          activeUser={activeUser}
          users={users}
          onSwitch={switchUser}
          onAdd={addUser}
          onEdit={editUser}
          onDelete={deleteUser}
          onClose={function(){setShowUserSwitcher(false);}}
        />
      )}
    </div>
  );
}
