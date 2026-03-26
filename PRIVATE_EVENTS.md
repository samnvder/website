# PRIVATE EVENTS & BANQUETS — ROUTING & INFO

## PURPOSE

This file governs how to handle inquiries about private events, banquets, facility rentals, and catering. **The bot responds briefly and CCs Nicolette** — she handles the details.

---

## 🔴 CRITICAL ROUTING RULE

**Private event inquiries get a brief response + CC to Nicolette.** The bot acknowledges, provides helpful links, praises Nicolette, and copies her so she can take over.

| Event Type | Who Handles | Contact |
|------------|-------------|---------|
| **Banquet Hall** | Nicolette | events@southendclub.com |
| **Garden Gazebo** | Nicolette | events@southendclub.com |
| **Pool Parties** (Kids & Adult) | Nicolette | events@southendclub.com |
| **The Lounge** (Private Events) | Sam | lounge@southendclub.com |

---

## STAFF CONTACT — REQUIRED FORMAT

### Nicolette (Events Coordinator)
- **Email:** events@southendclub.com
- **Handles:** All non-lounge private events — banquets, weddings, corporate events, pool parties, gazebo events
- **⚠️ REQUIRED FORMAT:**
```html
Nicolette (<a href="mailto:events@southendclub.com">events@southendclub.com</a>)
```

### Sam (Lounge Events)
- **Email:** lounge@southendclub.com
- **Handles:** Private events in The Lounge only
- **⚠️ REQUIRED FORMAT:**
```html
Sam (<a href="mailto:lounge@southendclub.com">lounge@southendclub.com</a>)
```

---

## DETECTION KEYWORDS

Route to Nicolette when email contains:

**Event Type Keywords:**
- `book the function room` / `function room`
- `banquet` / `banquet hall`
- `private event` / `host an event`
- `wedding` / `reception`
- `corporate event` / `corporate retreat`
- `seminar` / `workshop` / `conference`
- `birthday party` / `anniversary party`
- `bar mitzvah` / `bat mitzvah`
- `baby shower` / `bridal shower`
- `pool party`
- `rent the space` / `rent your venue`
- `event venue` / `venue rental`
- `gazebo`
- `catering for [X] people` / `food and beverage for [X] pax`
- `host [X] guests`

**Context Clues (person is NOT interested in membership):**
- "hold off on joining" + event request
- "not looking to join" + event request
- Only asking about event space, no membership questions
- Multi-day event booking (seminars, retreats)

---

## EVENT VENUES — REFERENCE INFO

### The Banquet Hall
- **Capacity:** Up to 250 guests
- **Size:** 4,000 sq. ft.
- **Features:**
  - Sculpted ceilings with customizable LED lighting
  - Spacious dance floor
  - Fully equipped bar
  - In-house catering with customizable menus
  - Full event coordination and day-of support
- **Event Types:** Weddings, receptions, corporate events, milestone celebrations, bar/bat mitzvahs, graduations, family reunions, baptisms
- **URL:** https://southendclub.com/events/

### The Garden Gazebo
- **Capacity:** Up to 100 guests
- **Features:**
  - Outdoor setting with grassy area
  - Water pond
  - Flower-covered gazebo
- **Event Types:** Wedding ceremonies, birthday parties, showers, outdoor get-togethers
- **URL:** https://southendclub.com/events/

### The Lounge (Private Events)
- **Capacity:** Up to 90 guests
- **Features:**
  - Natural light by day, vibrant ambiance by night
  - Flexible seating arrangements
  - Long modern bar
  - Polished marble floors
  - Extensive gourmet food catalog
- **Event Types:** Cocktail parties, intimate sit-down dining, casual to polished events
- **Contact:** Sam at lounge@southendclub.com
- **URL:** https://southendclub.com/events/

### Pool Parties
- **Kids Pool Parties:**
  - Capacity: Up to 25 children (plus adults)
  - Includes: Pool access, tables, chairs, lifeguard
  - Optional: Garden Gazebo combo
  - In-house catering available
- **Adult Poolside Events:**
  - Casual to sophisticated poolside celebrations
  - Simple to elegant catering options
- **URL:** https://southendclub.com/events/

---

## LINKS — EVENTS

### Events Main Page
- **URL:** https://southendclub.com/events/
- **Use Case:** General information about all event venues
- **Format (Email HTML):** `<a href="https://southendclub.com/events/">explore our event venues</a>`

### Schedule a Viewing
- **Use Case:** Direct prospects to tour event spaces
- **Contact:** events@southendclub.com

### Event Inquiry Submission
- **URL:** https://southendclub.com/events/ (form on page)
- **Use Case:** Submit event inquiry online

---

## RESPONSE TEMPLATES

### When Someone Asks About Booking Events (Non-Lounge)
**Bot CCs: events@southendclub.com**

```html
We'd love to host your event! You can <a href="https://southendclub.com/events/">explore our event venues here</a> — we have our beautiful banquet hall, garden gazebo, and poolside options.<br><br>

I've copied Nicolette (<a href="mailto:events@southendclub.com">events@southendclub.com</a>), our events coordinator — she's wonderful and will take great care of you. She can walk you through availability, setup options, and create a custom catering package for your group.
```

### When Someone Asks About Lounge Events
**Bot does NOT CC Nicolette — Sam handles directly**

```html
The Lounge is perfect for cocktail parties and intimate gatherings — I handle those directly.<br><br>

Tell me more about what you're envisioning and I can check availability. You can also <a href="https://southendclub.com/events/">see the space and our other venues here</a>.
```

### When Someone Was a Membership Prospect But Shifted to Events Only
**Bot CCs: events@southendclub.com**

```html
No problem on the membership — completely understand.<br><br>

For the event you're planning, I've copied Nicolette (<a href="mailto:events@southendclub.com">events@southendclub.com</a>), our events coordinator — she's wonderful and will take great care of you. She can discuss availability, setup options, and catering packages.<br><br>

You can also <a href="https://southendclub.com/events/">explore our event spaces here</a>.
```

---

## ONLINE AGENT BEHAVIOR

When the online bot receives an event inquiry:

1. **Responds briefly** with helpful links
2. **CCs Nicolette** (events@southendclub.com) — except for Lounge events
3. **Praises Nicolette** — "she's wonderful and will take great care of you"
4. **Lets Nicolette handle details** — availability, pricing, setup, catering

## MANUAL AGENT WORKFLOW

When you (Sam) receive an email that's purely about events (not membership):

1. **Route appropriately:**
   - Banquet/Gazebo/Pool Party → CC Nicolette
   - Lounge events → Handle directly
2. **Use the templates above** to draft a warm handoff

---

*Last updated: January 2026*
