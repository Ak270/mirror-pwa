// ============================================================
//  Mirror Habit Tracker — iOS Scriptable Widget v3.0
//  Dark UI · All habits · Streaks · Running totals · Live status
// ============================================================
//
//  SETUP:
//  1. Paste this entire script into Scriptable app
//  2. Replace API_TOKEN below with your token from:
//     Mirror app → Settings → Mobile Setup → Copy API Token
//  3. Add a Scriptable widget to your Home Screen
//  4. Long-press widget → Edit Widget → Script → select this
//
// ============================================================

const API_TOKEN  = "YOUR_API_TOKEN_HERE"
const BASE_URL   = "https://mirror-pwa.vercel.app"
const WIDGET_API = `${BASE_URL}/api/habits/widget`

// ── Colours ─────────────────────────────────────────────────
const C = {
  bg:       new Color("#0f0f11"),
  card:     new Color("#1a1a1f"),
  border:   new Color("#2a2a32"),
  title:    new Color("#f5f0e8"),
  muted:    new Color("#8a8a9a"),
  done:     new Color("#4ade80"),
  partial:  new Color("#facc15"),
  pending:  new Color("#6b6b7a"),
  slip:     new Color("#f87171"),
  accent:   new Color("#a78bfa"),
  water:    new Color("#60a5fa"),
  streak:   new Color("#fb923c"),
}

// ── Status helpers ───────────────────────────────────────────
function statusColor(s) {
  if (s === "done")         return C.done
  if (s === "partial")      return C.partial
  if (s === "honest_slip")  return C.slip
  return C.pending
}

function statusDot(s) {
  if (s === "done")         return "●"
  if (s === "partial")      return "◐"
  if (s === "honest_slip")  return "✗"
  return "○"
}

function statusLabel(s) {
  if (s === "done")         return "Done"
  if (s === "partial")      return "Partial"
  if (s === "honest_slip")  return "Slip"
  if (s === "skip")         return "Skip"
  return "Pending"
}

function fmtTime(t) {
  if (!t) return ""
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "pm" : "am"
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, "0")}${ampm}`
}

// ── Fetch data ───────────────────────────────────────────────
async function fetchData() {
  const req = new Request(WIDGET_API)
  req.headers = { "Authorization": `Bearer ${API_TOKEN}` }
  req.timeoutInterval = 10

  try {
    const json = await req.loadJSON()

    if (json.error) {
      const isExpired = json.error === "Unauthorized" ||
        (typeof json.error === "string" && json.error.toLowerCase().includes("token"))
      return {
        error: true,
        expired: isExpired,
        message: json.error,
      }
    }

    return {
      today_habits:  json.today_habits  ?? [],
      allday_habits: json.allday_habits ?? [],
      summary:       json.summary       ?? { total: 0, completed: 0, pending: 0 },
      date:          json.date          ?? "",
    }
  } catch (e) {
    return { error: true, expired: false, message: String(e) }
  }
}

// ── Build widget ─────────────────────────────────────────────
async function buildWidget(size) {
  const data = await fetchData()
  const w    = new ListWidget()
  w.backgroundColor = C.bg
  w.setPadding(14, 14, 14, 14)

  // ── Error state ──
  if (data.error) {
    const icon  = w.addText(data.expired ? "🔑" : "⚠️")
    icon.font   = Font.systemFont(28)
    w.addSpacer(6)

    const msg  = w.addText(
      data.expired
        ? "Token expired"
        : "Could not load"
    )
    msg.textColor  = C.slip
    msg.font       = Font.boldSystemFont(13)

    w.addSpacer(4)
    const sub  = w.addText(
      data.expired
        ? "Mirror → Settings → Mobile Setup → Copy fresh token"
        : data.message
    )
    sub.textColor   = C.muted
    sub.font        = Font.systemFont(10)
    sub.lineLimit   = 3

    w.url = `${BASE_URL}/profile`
    return w
  }

  const allHabits = [...(data.today_habits ?? []), ...(data.allday_habits ?? [])]

  // ── Header ──
  const header = w.addStack()
  header.layoutHorizontally()
  header.centerAlignContent()

  const title       = header.addText("Mirror")
  title.textColor   = C.title
  title.font        = Font.boldSystemFont(15)
  header.addSpacer()

  const { completed, total } = data.summary
  const badge       = header.addText(`${completed}/${total}`)
  badge.textColor   = completed === total && total > 0 ? C.done : C.muted
  badge.font        = Font.boldSystemFont(12)

  w.addSpacer(8)

  // ── Separator ──
  const sep     = w.addStack()
  sep.backgroundColor = C.border
  sep.size            = new Size(0, 1)
  w.addSpacer(8)

  // Decide how many rows to show based on widget size
  const maxRows = size === "small" ? 3 : size === "medium" ? 5 : 10

  if (allHabits.length === 0) {
    const empty     = w.addText("No habits yet")
    empty.textColor = C.muted
    empty.font      = Font.italicSystemFont(12)
    w.url           = BASE_URL
    return w
  }

  const visible = allHabits.slice(0, maxRows)

  for (const h of visible) {
    const row = w.addStack()
    row.layoutHorizontally()
    row.centerAlignContent()
    row.spacing = 6

    // Status dot
    const dot     = row.addText(statusDot(h.status))
    dot.textColor = statusColor(h.status)
    dot.font      = Font.boldSystemFont(11)

    // Emoji
    const em    = row.addText(h.icon_emoji ?? "●")
    em.font     = Font.systemFont(13)

    // Name stack
    const nameStack = row.addStack()
    nameStack.layoutVertically()
    nameStack.size = new Size(0, 0)

    const nameText      = nameStack.addText(h.name)
    nameText.textColor  = h.status === "done" || h.status === "partial" ? C.muted : C.title
    nameText.font       = Font.systemFont(12)
    nameText.lineLimit  = 1

    // Sub-line: quantity progress OR time OR streak
    let subLine = ""
    if (h.running_total !== null && h.daily_target) {
      const unit = h.daily_target_unit ?? ""
      subLine = `${h.running_total}/${h.daily_target} ${unit}`.trim()
    } else if (h.reminder_time) {
      subLine = fmtTime(h.reminder_time)
    }
    if (subLine) {
      const sub      = nameStack.addText(subLine)
      sub.textColor  = h.goal_met ? C.done : C.muted
      sub.font       = Font.systemFont(9)
    }

    row.addSpacer()

    // Streak badge (show if ≥ 2)
    if (h.current_streak >= 2) {
      const strk     = row.addText(`${h.current_streak}🔥`)
      strk.font      = Font.boldSystemFont(9)
      strk.textColor = C.streak
    }

    w.addSpacer(4)
  }

  // Overflow indicator
  if (allHabits.length > maxRows) {
    const more      = w.addText(`+${allHabits.length - maxRows} more`)
    more.textColor  = C.muted
    more.font       = Font.italicSystemFont(10)
  }

  w.addSpacer()

  // Footer: last updated
  const now     = new Date()
  const hh      = String(now.getHours()).padStart(2, "0")
  const mm      = String(now.getMinutes()).padStart(2, "0")
  const footer  = w.addText(`Updated ${hh}:${mm}`)
  footer.textColor = C.muted
  footer.font      = Font.systemFont(8)

  w.url          = `${BASE_URL}/log`
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000)

  return w
}

// ── Run ──────────────────────────────────────────────────────
const size = config.widgetFamily ?? "medium"

if (config.runsInWidget) {
  const widget = await buildWidget(size)
  Script.setWidget(widget)
} else {
  // Preview in app
  const widget = await buildWidget("large")
  widget.presentLarge()
}

Script.complete()
