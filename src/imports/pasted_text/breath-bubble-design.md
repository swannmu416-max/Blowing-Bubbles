**I. Overall Page Structure (Single Page App)**
It is recommended to build your product as a single-page immersive interactive website (WebGL / Canvas style).

Page Layout Structure (Top to Bottom)
------------------------------------------------
[Top Bar]
------------------------------------------------
[Main Visual Area (Camera + Bubble Interaction Core Area)]
------------------------------------------------
[Control Panel (Bubble Parameters / Physics Engine Adjustment)]
------------------------------------------------
[Status Feedback Area (Mouth Tracking / Data Visualization)]
------------------------------------------------

**II. Figma Frame Design (1440px Desktop)**

1️⃣ **Top Bar (Minimalist Navigation)**
Component Structure:
* Left: Product Name `[Breath Bubble AI]`
* Center: Status Indicator `[Camera: ON 👄]`
* Right: Settings / Privacy Policy `[⚙ Settings]`

UI Style:
* Semi-transparent glassmorphism
* Gaussian blur background
* Thin border 1px white 10% opacity

2️⃣ **Core Area (Most Important!)**
👉 This is the core interaction loop of the product.

Layout: Left-Right structure or Full-screen immersive (Full-screen recommended)

🔵 Left: Camera + Facial Recognition Layer
Components:
┌────────────────────┐
│  Camera Feed       │
│  (WebRTC Video)    │
│                    │
│  Face Mesh Overlay │
│  - landmarks       │
│  - Mouth Tracking  │
│  (MAR: Mouth Aspect Ratio)│
└────────────────────┘

Design Details:
* Video border radius: 16px
* Outer glowing stroke (changes color based on "blowing/mouth open status")
    * Idle (Mouth closed): #4D96FF (Calm Blue)
    * Charging (Mouth opening): #FFD93D (Charging Yellow)
    * Release (Bubble flying out): #6BCB77 (Energetic Green)

🫧 Right: Bubble Generation Area (Canvas)
Visual Hierarchy:
`[Background Canvas]`
→ Bubble Physics Engine System (Gravity, Wind)
→ Floating Bubbles
→ Interactive Collisions

Bubble Design Guidelines:
* shape: perfect circle
* gradient: inner: white 40%, outer: transparent
* blur: 10px
* motion: Size determined by mouth open duration, floats upward after closing mouth (float + drift + upward)

**Dynamic Rules (Core Interaction Mechanism):**
* **Trigger Generation:** When the mouth is detected as open (Mouth Aspect Ratio > Threshold), an initial bubble is generated in the center of the Canvas / at the corresponding mouth position.
* **Size Control (Mouth Size):** The wider the mouth is opened, the faster the bubble expands horizontally.
* **Charging Control (Duration):** The longer the mouth remains open, the bubble volume continuously increases.
* **Release Mechanism:** When the mouth closes, the bubble detaches from the generation point and starts floating upward.

3️⃣ **Control Panel (Interaction Panel)**
👉 Placed at the bottom, like a "mixing console", to control physical feedback.

Layout: Horizontal control bar
* Breath Sensitivity [──────●──────] 
* Gravity/Wind [────●────────] (Controls bubble rising speed)
* Surface Tension Factor [──●──────────] (Controls the bubble's stability before entering an overflow state)

UI Style:
* iOS-style slider
* Slider glow (changes color following the mouth status)

4️⃣ **Data Feedback Area (Core of AI Technical Implementation Feel)**
👉 This replaces subjective emotions with hardcore data, demonstrating a strong grasp of technical metrics.

Left Small Card (Tracking Card)
👄 Current Status
Blowing... (MAR: 0.65)

Right Data Visualization
👉 **Live Tracking Chart:**

1.  **Mouth Openness (Dynamic bar for mouth opening amplitude):** Real-time reflection of the current mouth opening amplitude.
    `Openness: 0% [███████░░░░░░] 100%`
2.  **Duration (Charging Timer):** Starts counting seconds when the mouth opens, filling up a circular progress bar.
    `Hold Time: 2.4s`

**III. Visual Style System (Design System)**
🎨 Color System

| Status | Color | Applicable Scenario |
| :--- | :--- | :--- |
| **Idle** | `#4D96FF` | Default interface color, border for closed mouth status |
| **Blowing (Charging)**| `#FFD93D` | Data bar when mouth is open, camera stroke |
| **Release (Completed)**| `#6BCB77` | Instant animation feedback when the bubble successfully flies out |
| **Background** | `#0B0F1A` | Global immersive dark background |

✨ UI Style Keywords:
Glassmorphism, Soft glow, Fluid physics, Dark immersive background, Floating particles

**IV. Interaction Design**

1️⃣ **Page Entry Animation**
* Camera fade in
* UI fade in, prompt text: "Open your mouth to blow a bubble"

2️⃣ **Core Behavior Trigger Feedback**
* **Instant of Opening Mouth:** A small point of light / tiny bubble appears in the center of the page or at the mouth position, and the UI data bar is instantly activated (turns from blue to yellow).
* **Continuous Open Mouth:** The bubble grows continuously accompanied by slight jittering (simulating the airflow of blowing), with fine particles converging towards the bubble (feeling of charging).
* **Instant of Closing Mouth:** The bubble stops growing, gains an initial upward velocity, the border flashes green once, and the bubble slowly ascends.

**V. Figma Page Frame Structure**

Frame 1440x900
│
├── Top Bar (H:60)
│
├── Main Area (H:650)
│   ├── Camera Panel (50%) [Includes mouth landmarks tracking UI]
│   └── Bubble Canvas (50%) [Physics collision and floating]
│
├── Control Panel (H:120)
│   ├── Slider 1 (Sensitivity)
│   ├── Slider 2 (Wind Speed)
│   ├── Slider 3 (Surface Tension Factor)
│
├── Tracking Dashboard (H:70) [Real-time MAR value and charging duration]

**VI. Result Modal & Achievement System (Game Mechanics & Viral Loop)**
👉 **Core Objective:** To endow the physical interaction with a "sense of value" and trigger a sense of achievement or humor through concrete visual comparisons, thereby stimulating social sharing.

*Definition Note: Virtual Breath Energy Index (VBEI) is a synthetic interaction score derived from mouth opening amplitude, duration, and airflow simulation parameters. It does not represent real physiological lung capacity.*

1️⃣ **Trigger Mechanism**
* **Condition:** After the user continuously keeps their mouth open (MAR > threshold) for more than `1.5 seconds`, once mouth closure is detected (MAR < threshold), it is judged as the "end of a single blow."
* **Visuals:** The bubble on the screen stops expanding, detaches from the mouth, and floats upward. Simultaneously, the background dims (adding a full-screen 40% black overlay), and a **"Result Data Card"** pops up from the center of the screen.

2️⃣ **Result Modal UI Structure**
Style: Skeuomorphism + Glassmorphism (consistent with the main visual), with a slight 3D embossed feel.

```text
┌──────────────────────────────────────────┐
│                 ✨ Blow Complete!        │
│                                          │
│  【Virtual Breath Energy Index】         │
│             🏆 4,250 BEU                 │
│                                          │
│  【Visualized Achievement】              │
│     🐘 (Vector Illustration/Emoji)       │
│  "Wow! The bubble you blew is as big    │
│   as an elephant!"                       │
│                                          │
│  ⏱️ Hold Time: 8.5s   👄 Max MAR: 85%    │
│                                          │
│  [ 🔄 Blow Again ]    [ 🚀 Share Result ]│
└──────────────────────────────────────────┘
```
*Disclaimer: All visual mappings are metaphorical and used only for playful interaction feedback, not biological estimation.*

3️⃣ **Visualized Achievement Gallery (Mapping Table)**
👉 This is the core of the product's playfulness. Based on the calculated "VBEI score" (Formula: *Mouth Amplitude × Duration × Multiplier*), map it to different everyday objects or exaggerated items.

| Hold Time (Ref) | Estimated BEU | Visual Case (Visualizer) | Humorous Copywriting / Feedback |
| :--- | :--- | :--- | :--- |
| **< 2s** | < 100 BEU | 🏓 **Ping Pong Ball** | "That's it? Try eating a bit more for lunch." |
| **2 - 4s** | ~ 500 BEU | 🍎 **An Apple** | "A standard breath. Great interaction performance." |
| **4 - 7s** | ~ 3,000 BEU | 🏀 **A Basketball** | "Not bad! Been practicing holding your breath?" |
| **7 - 10s** | ~ 10,000 BEU| 🚗 **A Car** | "Elite breath control! You could go sing opera with that breath!" |
| **10 - 15s**| ~ 50,000 BEU| 🐘 **An Elephant** | "Wow! The bubble you blew is as big as an elephant!" |
| **> 15s** | > 100,000 BEU| 🐋 **A Blue Whale** | "Beyond typical range! Is your breath powered by a jet engine?" |

4️⃣ **Interaction & Visual Feedback Details**
* **Number Counter Animation:** When the modal appears, the BEU score (e.g., `4,250`) does not show up instantly. Instead, it rapidly counts up from `0` to the final value, creating a satisfying slot-machine effect.
* **Spring Animation:** The icon or illustration of the concrete object (like the elephant) scales up with a bouncy, spring-like animation when the modal pops up.
* **Soft Limit & Auto Release (Anti-Cheat / Safety Logic):** To ensure a positive user experience, a three-stage logic is implemented:
    * *Soft Limit:* Normal growth phase.
    * *Overflow State:* If the duration exceeds a set threshold (e.g., 15 seconds), the bubble enters an "overflow mode" where its growth slows down gradually.
    * *Auto Release:* If the absolute maximum threshold (e.g., 20 seconds) is reached, an auto-release is triggered. The bubble floats up, and the final score is capped but still recorded and displayed. A friendly UI prompt appears: "That was a strong one—take a break 😄".

5️⃣ **Business & User Value Conversion (The "Why")**
When presenting this in a portfolio or defending the product decisions, this section perfectly articulates the shift from design execution to product strategy:
> "Initially, this was simply a technical demo relying on WebRTC and Face Mesh. However, relying solely on visual feedback lacks a **retention motive**. By introducing the 'Virtual Breath Energy Index' and 'concrete comparisons like an elephant', the product instantly transforms from a **technical prototype** to a **retention-driven gamified interaction system**. Translating the abstract metric of 'mouth open duration' into the perceptible size of 'exaggerated objects' not only lowers the user's cognitive threshold but heavily stimulates their **competitive psychology and desire to share**. This naturally constructs the product's **Viral Loop**."