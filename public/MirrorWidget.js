// Mirror Habit Tracker Widget for iOS (Scriptable)
// Installation: Copy this entire script into Scriptable app, then add widget to home screen

// ========== CONFIGURATION ==========
// Get your API token from Mirror app → Settings → Mobile Setup
const API_TOKEN = "YOUR_API_TOKEN_HERE"
const API_URL = "https://mirror-pwa.vercel.app/api/habits/widget"

// Widget appearance
const WIDGET_BG_COLOR = new Color("#F9F9FC")
const BRAND_COLOR = new Color("#2D2D7B")
const ACCENT_COLOR = new Color("#6C63FF")
const SUCCESS_COLOR = new Color("#0D9E75")
const MUTED_COLOR = new Color("#666666")

// ========== MAIN WIDGET CODE ==========

async function createWidget() {
  const widget = new ListWidget()
  widget.backgroundColor = WIDGET_BG_COLOR
  widget.setPadding(16, 16, 16, 16)

  try {
    // Fetch habits data from Mirror API
    const req = new Request(API_URL)
    req.headers = {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    }
    
    const data = await req.loadJSON()
    
    if (!data) {
      throw new Error("No response from server")
    }
    
    if (!data.habits || !Array.isArray(data.habits)) {
      throw new Error(`Invalid data: ${JSON.stringify(data).substring(0, 100)}`)
    }
    
    console.log(`Loaded ${data.habits.length} habits`)

    // Header
    const header = widget.addStack()
    header.layoutHorizontally()
    header.centerAlignContent()
    
    const titleText = header.addText("🪞 Mirror")
    titleText.font = Font.boldSystemFont(16)
    titleText.textColor = BRAND_COLOR
    
    header.addSpacer()
    
    const dateText = header.addText(formatDate(new Date()))
    dateText.font = Font.systemFont(10)
    dateText.textColor = MUTED_COLOR
    
    widget.addSpacer(12)

    // Habits list (show up to 5 habits)
    const habits = data.habits.slice(0, 5)
    
    if (habits.length === 0) {
      const emptyText = widget.addText("No habits tracked yet")
      emptyText.font = Font.systemFont(12)
      emptyText.textColor = MUTED_COLOR
      emptyText.centerAlignText()
      
      widget.addSpacer(8)
      
      const hintText = widget.addText("Add habits in the Mirror app")
      hintText.font = Font.systemFont(10)
      hintText.textColor = MUTED_COLOR
      hintText.textOpacity = 0.7
      hintText.centerAlignText()
    } else {
      for (let i = 0; i < habits.length; i++) {
        const habit = habits[i]
        
        const habitStack = widget.addStack()
        habitStack.layoutHorizontally()
        habitStack.centerAlignContent()
        habitStack.setPadding(6, 0, 6, 0)
        
        // Icon
        const iconText = habitStack.addText(habit.icon)
        iconText.font = Font.systemFont(14)
        
        habitStack.addSpacer(8)
        
        // Name
        const nameText = habitStack.addText(habit.name)
        nameText.font = Font.systemFont(12)
        nameText.textColor = BRAND_COLOR
        nameText.lineLimit = 1
        
        habitStack.addSpacer()
        
        // Status indicator
        if (habit.today_status === 'done' || habit.today_status === 'partial') {
          const checkText = habitStack.addText("✓")
          checkText.font = Font.boldSystemFont(14)
          checkText.textColor = SUCCESS_COLOR
        } else if (habit.display_type === 'streak' && habit.current_streak > 0) {
          const streakText = habitStack.addText(`${habit.current_streak}🔥`)
          streakText.font = Font.systemFont(11)
          streakText.textColor = ACCENT_COLOR
        } else if (habit.display_type === 'counter' && habit.today_value) {
          const valueText = habitStack.addText(`${habit.today_value}${habit.today_unit || ''}`)
          valueText.font = Font.systemFont(10)
          valueText.textColor = ACCENT_COLOR
        } else {
          const dotText = habitStack.addText("○")
          dotText.font = Font.systemFont(14)
          dotText.textColor = MUTED_COLOR
        }
        
        if (i < habits.length - 1) {
          widget.addSpacer(4)
        }
      }
    }

    widget.addSpacer()

    // Footer - completion stats
    const completed = habits.filter(h => h.today_status === 'done' || h.today_status === 'partial').length
    const total = habits.length
    
    if (total > 0) {
      const footerStack = widget.addStack()
      footerStack.layoutHorizontally()
      footerStack.centerAlignContent()
      
      const statsText = footerStack.addText(`${completed}/${total} today`)
      statsText.font = Font.systemFont(10)
      statsText.textColor = completed === total ? SUCCESS_COLOR : MUTED_COLOR
      
      footerStack.addSpacer()
      
      const tapText = footerStack.addText("Tap to open")
      tapText.font = Font.systemFont(9)
      tapText.textColor = MUTED_COLOR
      tapText.textOpacity = 0.6
    }

    // Set widget URL to open Mirror app
    widget.url = API_URL.replace('/api/habits/widget', '/log')
    
    // Set refresh interval (15 minutes)
    widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000)

  } catch (error) {
    // Error state
    const errorTitle = widget.addText("⚠️ Mirror Widget")
    errorTitle.font = Font.boldSystemFont(14)
    errorTitle.textColor = BRAND_COLOR
    
    widget.addSpacer(8)
    
    const errorMsg = widget.addText(error.message || "Failed to load habits")
    errorMsg.font = Font.systemFont(11)
    errorMsg.textColor = MUTED_COLOR
    errorMsg.lineLimit = 3
    
    widget.addSpacer(8)
    
    const helpText = widget.addText("Check your API token in the script")
    helpText.font = Font.systemFont(9)
    helpText.textColor = MUTED_COLOR
    helpText.textOpacity = 0.7
  }

  return widget
}

function formatDate(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

// ========== RUN WIDGET ==========

if (config.runsInWidget) {
  // Running as widget
  const widget = await createWidget()
  Script.setWidget(widget)
} else {
  // Running in app (for preview)
  const widget = await createWidget()
  widget.presentMedium()
}

Script.complete()
