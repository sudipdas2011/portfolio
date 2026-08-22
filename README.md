# WELCOME TO MY CREATIVE PORTFOLIO // V2

hi!

this is basically a breakdown of my new portfolio and some of the stuff i messed around with while making it.

I didn't really want to make another portfolio that looks like every other portfolio site. So the whole thing is built around **sharp edges, brutalist layouts and interaction**.

It's supposed to feel a bit weird and alive when you're moving around on it.

---

## The design idea

The main idea was pretty simple: the site should react to you instead of just sitting there.

### No rounded corners

I kept pretty much everything sharp. no soft cards, no huge rounded buttons, no "modern SaaS" look.

thick borders, straight lines, overlapping elements and big type.

### High contrast

I wanted the different parts of the interface to feel like they're cutting into each other instead of blending together.

So when stuff overlaps, the colours and shapes change very quickly. It gives the whole thing a more graphic feel.

### Keeping the page locked

I also disabled the normal browser text highlighting and image dragging because it looked kinda messy with the interactions.

So when you're moving around the cards and background stuff, the page stays where it's supposed to.

---

## Some of the stuff i built:

### 1. The shape-shifting cursor — `CustomCursor.jsx`

I didn't want to use the normal mouse pointer.

The cursor starts as a really small square when you're just moving around empty space.

Then when you move over something interactive — a heading, link, rotating card etc — it stretches out and frames that thing.

There's also a little more going on in the background.

If you stop moving the mouse, the cursor can still detect the cards rotating underneath it and lock onto them. So it doesn't just wait for mouse movement to work.

And when moving quickly between things, it tries to switch focus straight away instead of going back to the tiny square every time.

That part took a while to get feeling right.

---

### 2. The kinetic guide arrow — `ArrowGuide.jsx`

There's another pointer system that only really shows up near the bottom of the screen.

When the mouse enters roughly the bottom 25% of the viewport, the normal cursor disappears and turns into this little geometric arrow.

The arrow also checks the movement speed of the mouse.

When you're moving slowly, it can stay aimed towards the target at the bottom.

When you suddenly move really fast, it stops caring about the target and points in the direction you're moving instead.

I also added an allow-list so it only works where I actually want it to. Once you leave the hero section, it shuts itself off.

---

### 3. The orbiting cards — `RevolvingStage.jsx`

The center of the hero has a rotating wheel of cards.

These are currently just some references / images I took from Pinterest because, well, I needed something to put there while working on the actual portfolio. I do make my own art, I just don't have the drawing tablet situation sorted yet.

The interesting bit is that the cards are rotating around the main text but they still stay upright.

The stage rotates, then the cards counter-rotate by the same amount so they don't end up sideways or upside down.

It sounds simple, but getting it to stay consistent all the way around the orbit was one of those small annoying things.

---

### 4. The scroll observer — `WhoAmI.jsx`

The second main section is a full-screen dark section.

I didn't want the text animation to start the moment the section appears, because then it just feels like the animation is happening because the browser says so.

So I used an intersection observer and a scroll threshold.

The text stays hidden for a bit and then starts rising once you've gone further into the section. It's around the 75% setup I used for the section, although the actual trigger is tuned around the visible area.

This makes the text feel a little more intentional when it appears.

---

## How the project is organised

```text
src/

├── assets/
│   └── cards/               # case study images and graphics

├── components/
│   ├── ArrowGuide.jsx       # kinetic guide pointer
│   ├── BrutalistLoader.jsx  # glitchy terminal style loader
│   ├── CustomCursor.jsx     # custom tracking cursor
│   ├── RevolvingStage.jsx   # rotating card stage
│   └── TextRise.jsx         # character / text rise animation

├── hooks/
│   └── useAssetLoader.js    # image loading counter

├── pages/
│   ├── Hero.jsx             # main landing section
│   └── WhoAmI.jsx           # second dark section

├── App.jsx                  # main app shell
└── App.css                  # layout, typography and fullscreen stuff
```

I started out with more of the hero calculations sitting inside `App.jsx`, which got messy pretty quickly.

So in the latest update I moved the Hero related stuff into `Hero.jsx` and the second section into `WhoAmI.jsx`.

Much easier to work with now.

---

## How i used AI?

I did use AI while making this.

Mostly **Google Gemini** for debugging, figuring out technical stuff and fixing problems with deployment and config files.

It wasn't really generating the whole project for me. A lot of the annoying bugs and "why is this not working" moments were where it was useful.

---

## Latest update

The latest update was mostly a big cleanup of the layout and the code structure.

I moved the Hero calculations out of the main `App.jsx` file and split the sections into their own page modules.

So now the project is a lot less messy than the first version.

And yeah, it's live now and working properly :)

there's probably still a bunch of stuff i want to change, but this version is finally in a place where i'm happy with it.