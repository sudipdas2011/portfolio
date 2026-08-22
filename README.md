# ⚡ WELCOME TO MY CREATIVE PORTFOLIO // V2

hi! this is the raw breakdown of my new portfolio.
I wanted to build a place that doesn't look like any other standard, boring template website. everything here is built around SHARP, BRUTALIST AND INTERACTIVE VIBES.

if you're checking out my code or just want to see how the features talk to each other, here is the full map of my journey!

---

## 🎨 the design ideation

The goal was simple: make a website that feels alive and responsive to how you move. 
*   **no smooth corners:** everything has sharp edges & thick lines.
*   **high-contrast fields:** when elements overlap, they cut through each other's colors instantly.
*   **site lockdown:** i disabled annoying browser text highlighting and image dragging. you can hover on the cards, and the background elements stay locked & clean.

---

## 🛠️ cool features & custom systems

### 1. the shape-shifting smart cursor (`CustomCursor.jsx`)
I ditched the standard browser mouse arrow for a custom tracking block. 
*   **the tiny box:** when you move over open space, it stays as a sharp, tiny square tracking your pointer.
*   **the snap frame:** the exact millisecond your mouse passes over any headline, text link, or rotating card, the cursor instantly stretches out like an elastic band to perfectly frame the exact bounds of that object.
*   **proactive background scanning:** it has an automatic scanner running inside it. if you keep your mouse completely still, the cursor still captures and frames the cards rotating underneath it. if you slide fast between objects, it chains focus instantly instead of shrinking back down.

### 2. the kinetic guide arrow (`ArrowGuide.jsx`)
I wanted a system to guide users visually, so i built a guiding pointer.
*   **the bottom zone trigger:** when your mouse slips into the bottom 25% sector of the screen, the regular square cursor shrinks away to nothing, and changes to a geometric arrow.
*   **velocity & speed math:** it tracks how fast you move your pointer. if you move slowly, the arrow stays trained on a specific target at the bottom edge. if you whip your cursor quickly across the screen, it breaks target and rotates to point exactly in the direction the cursor is moving.
*   **the lock list:** it knows exactly where it must be activated. i gave it an allow-list, so the arrow guide automatically shuts off the exact second you scroll out of the hero area down to other sections.

### 3. the orbiting cards (`RevolvingStage.jsx`)
In the center area, i built an endless rotating wheel to showcase my work assets(actually taken from pinterest for now, atually i make art but i needed an digital drawing tablet for so..).
*   **upright rotation tracking:** while the whole wheel is spinning around the headline text, a counter-rotation formula tells the cards to continuously rotate back by the exact same angle. this keeps every single card in perfectly upright all the way around the track.

### 4. the scroll observer (`WhoAmI.jsx`)
I broke the site into modular pages, and built a second full-screen section with a dark theme.
*   **the 75% gate:** i set up an intersection observer that blocks the page text from animating too early. the letters stay hidden until you scroll past the halfway mark of the section, making the text rise feel intentional and make it noticed.

---

## 📦 how the files are mapped

```text
src/
├── assets/
│   └── cards/            # case study images and graphics
├── components/
│   ├── ArrowGuide.jsx    # the smart kinetic guide pointer
│   ├── BrutalistLoader.jsx # the glitchy terminal line boot loader
│   ├── CustomCursor.jsx  # the shape-shifting inversion block
│   ├── RevolvingStage.jsx# the oval orbiting wheel manager
│   └── TextRise.jsx      # the sliding character animation text engine
├── hooks/
│   └── useAssetLoader.js # loading counter for images
├── pages/
│   ├── Hero.jsx          # section 1: the main landing area
│   └── WhoAmI.jsx        # section 2: the dark intersection panels
├── App.jsx               # the master orchestrator mounting shell
└── App.css               # typography alignments and fullscreen sizes
```

---

## 🚀 what i built in the latest update

This was a massive layout cleanup session. i moved all the Hero section calculations out of the main `App.jsx` file and transferred them into separate pages modules (`Hero.jsx` and `WhoAmI.jsx`). 

The whole project is officially live and running smoothly!
