// ============================================================
//  Mirror Habit Tracker — iOS Scriptable Widget v2.0
//  Dark UI · Smart layout · Tap to open log
// ============================================================
//
//  SETUP:
//  1. Paste this entire script into Scriptable app
//  2. Replace API_TOKEN below with your token from
//     Mirror → Profile → Mobile Setup → API Token
//  3. Add a Scriptable widget to home screen
//  4. Long-press widget → Edit Widget → Script → select this
//
// ============================================================

const API_TOKEN  = "YOUR_API_TOKEN_HERE"
const BASE_URL   = "https://mirror-pwa.vercel.app"
const WIDGET_API = `${BASE_URL}/api/habits/widget` 

// ── Palette ─────────────────────────────────────────────────
const C = {
  bg:          new Color("#0F0F1E"),
  surface:     new Color("#1A1A2E"),
  surfaceAlt:  new Color("#16213E"),
  brand:       new Color("#6C63FF"),
  brandDim:    new Color("#2D2860"),
  success:     new Color("#10B981"),
  successDim:  new Color("#064E3B"),
  amber:       new Color("#F59E0B"),
  amberDim:    new Color("#451A03"),
  textPrimary: new Color("#F0F0FF"),
  textMuted:   new Color("#8888AA"),
  separator:   new Color("#2A2A45"),
  allday:      new Color("#818CF8"),
}

// ── Fonts ────────────────────────────────────────────────────
const F = {
  title:  Font.boldSystemFont(15),
  label:  Font.mediumSystemFont(13),
  small:  Font.systemFont(11),
  tiny:   Font.systemFont(9),
  icon:   Font.systemFont(16),
  bigNum: Font.boldSystemFont(24),
}

// ============================================================
//  FETCH
// ============================================================

async function fetchHabits() {
  const req = new Request(WIDGET_API)
  req.headers = {
    "Authorization": `Bearer ${API_TOKEN}`,
    "Content-Type":  "application/json",
  }
  req.timeoutInterval = 10
  return await req.loadJSON()
}

// ============================================================
//  HELPERS
// ============================================================

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  })
}

function addProgressBar(container, done, total, width) {
  const pct   = total === 0 ? 0 : done / total
  const track = container.addStack()
  track.size            = new Size(width, 5)
  track.cornerRadius    = 3
  track.backgroundColor = C.separator
  const fill = track.addStack()
  fill.size            = new Size(Math.max(5, width * pct), 5)
  fill.cornerRadius    = 3
  fill.backgroundColor = pct === 1 ? C.success : C.brand
}

function statusBadge(row, status) {
  const badge = row.addStack()
  badge.cornerRadius = 10
  badge.setPadding(3, 9, 3, 9)

  if (status === "done" || status === "partial") {
    badge.backgroundColor = C.successDim
    const t = badge.addText(status === "done" ? "Done ✓" : "Partial")
    t.font      = F.tiny
    t.textColor = C.success
  } else if (status === "honest_slip") {
    badge.backgroundColor = C.amberDim
    const t = badge.addText("Slip")
    t.font      = F.tiny
    t.textColor = C.amber
  } else {
    badge.backgroundColor = C.brandDim
    const t = badge.addText("Log →")
    t.font      = F.tiny
    t.textColor = C.brand
  }
}

// ============================================================
//  SMALL WIDGET — progress + next pending habit
// ============================================================

async function buildSmall(data) {
  const w = new ListWidget()
  w.backgroundColor = C.bg
  w.setPadding(14, 14, 14, 14)
  w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000)

  const timed   = data.today_habits  || []
  const allday  = data.allday_habits || []
  const summary = data.summary       || {}
  const done    = summary.completed  || 0
  const total   = summary.total      || 0

  // Header
  const hdr = w.addStack()
  hdr.layoutHorizontally()
  hdr.centerAlignContent()
  const logo = hdr.addText("🪞 Mirror")
  logo.font      = F.small
  logo.textColor = C.brand
  hdr.addSpacer()
  const dt = hdr.addText(todayLabel())
  dt.font      = F.tiny
  dt.textColor = C.textMuted

  w.addSpacer(10)

  // Big % number
  const pctStr  = total === 0 ? "—" : `${Math.round((done / total) * 100)}%` 
  const bigRow  = w.addStack()
  bigRow.layoutHorizontally()
  bigRow.centerAlignContent()
  const bigTxt = bigRow.addText(pctStr)
  bigTxt.font      = F.bigNum
  bigTxt.textColor = done === total && total > 0 ? C.success : C.textPrimary
  bigRow.addSpacer()
  const frac = bigRow.addText(`${done}/${total}`)
  frac.font      = F.small
  frac.textColor = C.textMuted

  w.addSpacer(6)
  addProgressBar(w, done, total, 112)
  w.addSpacer(10)

  // Next pending
  const next = timed.find(h => h.status === "pending")
    || allday.find(h => h.status === "pending")

  if (next) {
    const lbl = w.addText("NEXT UP")
    lbl.font      = F.tiny
    lbl.textColor = C.textMuted
    w.addSpacer(4)

    const card = w.addStack()
    card.layoutHorizontally()
    card.centerAlignContent()
    card.spacing        = 6
    card.cornerRadius   = 8
    card.backgroundColor = C.surface
    card.setPadding(8, 10, 8, 10)

    const ico = card.addText(next.icon_emoji || "✦")
    ico.font = F.icon

    const col = card.addStack()
    col.layoutVertically()
    const nm = col.addText(next.name)
    nm.font      = F.label
    nm.textColor = C.textPrimary
    nm.lineLimit = 1
    if (next.reminder_time) {
      const rt = col.addText(next.reminder_time)
      rt.font      = F.tiny
      rt.textColor = C.brand
    }

    card.addSpacer()
    const arr = card.addText("›")
    arr.font      = Font.boldSystemFont(20)
    arr.textColor = C.brandDim

    w.url = `${BASE_URL}/log?habit_id=${next.id}` 
  } else {
    w.addSpacer(4)
    const msg = w.addText(done === total && total > 0 ? "All done today ✓" : "No habits yet")
    msg.font      = F.label
    msg.textColor = done === total && total > 0 ? C.success : C.textMuted
    msg.centerAlignText()
    w.url = `${BASE_URL}/log` 
  }

  w.addSpacer()
  return w
}

// ============================================================
//  MEDIUM WIDGET — timed list + all-day strip
// ============================================================

async function buildMedium(data) {
  const w = new ListWidget()
  w.backgroundColor = C.bg
  w.setPadding(14, 16, 12, 16)
  w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000)

  const timed   = (data.today_habits  || []).slice(0, 4)
  const allday  = (data.allday_habits || []).slice(0, 2)
  const summary = data.summary        || {}
  const done    = summary.completed   || 0
  const total   = summary.total       || 0

  // ── Header ──
  const hdr = w.addStack()
  hdr.layoutHorizontally()
  hdr.centerAlignContent()
  const logo = hdr.addText("🪞 Mirror")
  logo.font      = F.title
  logo.textColor = C.brand
  hdr.addSpacer()
  const stat = hdr.addText(`${done}/${total} done`)
  stat.font      = F.small
  stat.textColor = done === total && total > 0 ? C.success : C.textMuted

  w.addSpacer(5)
  addProgressBar(w, done, total, 280)
  w.addSpacer(8)

  // ── Timed habits ──
  if (timed.length === 0 && allday.length === 0) {
    const empty = w.addText("No habits today — open Mirror to get started")
    empty.font      = F.small
    empty.textColor = C.textMuted
    empty.centerAlignText()
  }

  for (let i = 0; i < timed.length; i++) {
    const h = timed[i]
    if (i > 0) w.addSpacer(4)

    const row = w.addStack()
    row.layoutHorizontally()
    row.centerAlignContent()
    row.cornerRadius    = 8
    row.backgroundColor = i % 2 === 0 ? C.surface : C.surfaceAlt
    row.setPadding(7, 10, 7, 10)

    const ico = row.addText(h.icon_emoji || "✦")
    ico.font = F.icon
    row.addSpacer(8)

    const col = row.addStack()
    col.layoutVertically()
    col.spacing = 1
    const nm = col.addText(h.name)
    nm.font      = F.label
    nm.textColor = (h.status === "done" || h.status === "partial") ? C.textMuted : C.textPrimary
    nm.lineLimit = 1
    if (h.reminder_time) {
      const rt = col.addText(h.reminder_time)
      rt.font      = F.tiny
      rt.textColor = C.brand
    }

    row.addSpacer()
    statusBadge(row, h.status)
  }

  // ── All-day strip ──
  if (allday.length > 0) {
    w.addSpacer(8)
    const lbl = w.addText("ALL DAY")
    lbl.font      = F.tiny
    lbl.textColor = C.textMuted
    w.addSpacer(4)

    const strip = w.addStack()
    strip.layoutHorizontally()
    strip.spacing = 6

    for (const h of allday) {
      const pill = strip.addStack()
      pill.layoutHorizontally()
      pill.centerAlignContent()
      pill.spacing      = 5
      pill.cornerRadius = 12
      pill.setPadding(5, 10, 5, 10)
      pill.backgroundColor =
        h.status === "done"         ? C.successDim :
        h.status === "honest_slip"  ? C.amberDim   : C.surface

      const pico = pill.addText(h.icon_emoji || "✦")
      pico.font = F.small
      const pnm = pill.addText(h.name)
      pnm.font      = F.small
      pnm.lineLimit = 1
      pnm.textColor =
        h.status === "done"        ? C.success :
        h.status === "honest_slip" ? C.amber   : C.allday
    }
    strip.addSpacer()
  }

  w.addSpacer()

  // Footer
  const foot = w.addStack()
  foot.layoutHorizontally()
  const hint = foot.addText("Tap → open Mirror to log")
  hint.font         = F.tiny
  hint.textColor    = C.textMuted
  hint.textOpacity  = 0.45

  w.url = `${BASE_URL}/log` 
  return w
}

// ============================================================
//  LARGE — same as medium but more rows
// ============================================================

async function buildLarge(data) {
  data.today_habits  = (data.today_habits  || []).slice(0, 7)
  data.allday_habits = (data.allday_habits || []).slice(0, 3)
  return buildMedium(data)
}

// ============================================================
//  ERROR STATE
// ============================================================

function buildError(msg) {
  const w = new ListWidget()
  w.backgroundColor = C.bg
  w.setPadding(16, 16, 16, 16)
  const title = w.addText("🪞 Mirror")
  title.font      = F.title
  title.textColor = C.brand
  w.addSpacer(8)
  
  // Check if it's an auth error
  const isAuthError = msg && (msg.includes("Unauthorized") || msg.includes("401"))
  
  if (isAuthError) {
    const err = w.addText("⚠️ Token Expired")
    err.font      = F.label
    err.textColor = C.amber
    w.addSpacer(8)
    const hint = w.addText("Your API token has expired.\n\n1. Open Mirror app\n2. Go to Profile → API Token\n3. Copy new token\n4. Replace API_TOKEN in this script")
    hint.font      = F.tiny
    hint.textColor = C.textMuted
    hint.lineLimit = 8
  } else {
    const err = w.addText("⚠️ " + (msg || "Could not load habits"))
    err.font      = F.small
    err.textColor = C.amber
    err.lineLimit = 3
    w.addSpacer(8)
    const hint = w.addText("Check API_TOKEN at the top of this script.\nGet it: Mirror → Profile → API Token")
    hint.font      = F.tiny
    hint.textColor = C.textMuted
  }
  
  w.url = `${BASE_URL}/profile` 
  return w
}

// ============================================================
//  NORMALISE API RESPONSE
//  Handles both old shape (habits[]) and new shape (today_habits + allday_habits)
// ============================================================

function normaliseData(raw) {
  const norm = h => ({
    ...h,
    status:     h.status     || h.today_status || "pending",
    icon_emoji: h.icon_emoji || h.icon          || "✦",
  })

  if (raw.today_habits || raw.allday_habits) {
    return {
      today_habits:  (raw.today_habits  || []).map(norm),
      allday_habits: (raw.allday_habits || []).map(norm),
      summary:       raw.summary || {},
    }
  }

  // Old API shape fallback
  const all = (raw.habits || []).map(norm)
  const done = all.filter(h => h.status === "done" || h.status === "partial").length
  return {
    today_habits:  all.filter(h => h.reminder_time),
    allday_habits: all.filter(h => !h.reminder_time),
    summary: { total: all.length, completed: done, pending: all.length - done },
  }
}

// ============================================================
//  RUN
// ============================================================

let widget

try {
  const raw  = await fetchHabits()
  const data = normaliseData(raw)

  const family = config.widgetFamily
  if      (family === "small") widget = await buildSmall(data)
  else if (family === "large") widget = await buildLarge(data)
  else                         widget = await buildMedium(data)
} catch (e) {
  widget = buildError(e.message)
}

if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  await widget.presentMedium()   // preview in Scriptable app
}

Script.complete()
