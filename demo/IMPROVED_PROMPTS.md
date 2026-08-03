# Improved Prompts for A3M Router Product Video (10x Better)
# Based on vault learnings from successful launches on X/HN/PH

## Key Patterns from Vault

### 1. VIRAL VIDEO TRIFECTA
1. **Strong hook** (< 2 seconds)
2. **Seamless CTA**
3. **Repeatable**

### 2. MOST IMPORTANT: "Generate Hype, Not Demo"
> "Your main intention with the product video is to generate interest (hype!)  
> It's not a demo. You do not need to show every step.  
> Simplify things. Retain viewers." - from successful indie founder

### 3. Launch Channels That Work
- 35% Reddit
- 27% X (Twitter)
- **18% PH / HN launch posts**

### 4. Cluely Video Analysis (Viral Pattern)
- Close face hook for <2 secs
- Trending/relevant theme
- Highly relatable situation
- Question in caption
- Very short → people likely to rewatch

### 5. Nano Banana (Image) - Reality-First Prompt Structure
```
[Subject] in [Setting], [Lighting], [Style/Medium], [Technical specs]
```

### 6. Veo 3 (Video) - JSON Structure
```json
{
  "shot": {
    "composition": "Wide shot of...",
    "lens": "35mm wide-angle lens",
    "frame_rate": "24fps",
    "camera_movement": "slow dolly forward",
    "film_grain": "subtle grain"
  }
}
```

---

## NEW 10X VIDEO STRATEGY: HYPE-FIRST, NOT DEMO

### The Problem with Our Current Video
- We show frames: AI data center → Cost → Parallel → Providers → End card
- This is a DEMO, not HYPE
- Viewers get bored, leave before the good stuff

### The 10x Better Structure (Based on Vault)
**Total: 15-20 seconds max**

1. **HOOK (0-2s):** "I built a router that saves $10,000/month" - SHOCK VALUE
2. **PROOF (2-5s):** Live demo showing cost comparison - GPT-4 vs A3M
3. **WOW MOMENT (5-8s):** Show parallel execution, all 5 providers firing
4. **SOCIAL PROOF (8-10s):** "Parallel LLM Router with 70.32"
5. **CTA (10-12s):** "npm install adaptive-memory-multi-model-router"

### For HN/PH Audience Specifically:
- Lead with **benchmark**, not marketing
- Show the **numbers** upfront
- Keep technical credibility
- One clear demo, not 5 features

---

## REVISED FRAME PROMPTS

### Frame 1: HOOK - The Shock Stat (0-3s)
**Video prompt (JSON):**
```json
{
  "shot": {
    "composition": "Close-up of terminal showing cost calculations, numbers rapidly updating",
    "lens": "50mm portrait lens",
    "frame_rate": "30fps",
    "camera_movement": "Static close-up, subtle zoom in",
    "film_grain": "Clean digital"
  }
}
```
**Overlay text:** "I built a router that saves developers $10,000/month"

**Or with Veo 3:**
> A developer at a desk, shocked at their screen showing cost savings, rapid calculator numbers, light bulb moment, dramatic lighting

---

### Frame 2: PROOF - Live Demo (3-8s)
**Image prompt:**
> Split screen: Left side shows GPT-4 API bill for $300. Right side shows A3M Router cost of $1.41 for same queries. Real-time terminal window, both running side by side, numbers updating live. Dark room, desk lamp, professional comparison shot, photorealistic, 4K

**Video prompt (JSON):**
```json
{
  "shot": {
    "composition": "Split screen terminal comparison, GPT-4 costs on left (red, growing), A3M costs on right (green, flat)",
    "lens": "35mm wide-angle lens",
    "frame_rate": "30fps",
    "camera_movement": "Slow push in, subtle",
    "film_grain": "Clean digital, slight bloom on numbers"
  }
}
```

---

### Frame 3: WOW - Parallel Execution (8-12s)
**Image prompt:**
> Terminal window on a laptop showing 5 AI providers firing simultaneously: Groq, Cerebras, DeepSeek, Mistral, OpenAI. All green checkmarks appearing at different speeds. Groq first to respond with 187ms. Animated diagram, cyberpunk aesthetic, neon green on black, holographic overlay effect, futuristic command center vibe, professional product photography

**Video prompt (JSON):**
```json
{
  "shot": {
    "composition": "Terminal window, 5 provider lines appearing simultaneously with green checkmarks, Groq winning race at 187ms",
    "lens": "35mm lens",
    "frame_rate": "24fps",
    "camera_movement": "Slow zoom in as results appear",
    "film_grain": "CRT scanline effect, digital noise"
  }
}
```

---

### Frame 4: SOCIAL PROOF (12-15s)
**Image prompt:**
> Clean minimalist dark card floating in space, "A3M Router" in bold white text centered, below in gold/amber text: "Parallel LLM Router · 70.32 benchmark score", below that gray text: "40 providers · 213× cheaper than GPT-4", subtle blue glow around text, spotlight from above, Apple keynote aesthetic, dark void background, professional product photography

**Video prompt (JSON):**
```json
{
  "shot": {
    "composition": "Product card fading in, text elements appearing sequentially with subtle glow",
    "lens": "85mm portrait lens",
    "frame_rate": "24fps",
    "camera_movement": "Very slow push in, breathing motion",
    "film_grain": "Clean digital, light rays from above"
  }
}
```

---

### Frame 5: CTA (15-18s)
**Image prompt:**
> Dark terminal window with green on black text: "npm install adaptive-memory-multi-model-router" in large monospace font. Below: GitHub and npm logos side by side. Below that: "47+ providers" badge. Clean, minimal, developer-focused aesthetic, dark mode IDE style, professional product shot on desk

**Video prompt (JSON):**
```json
{
  "shot": {
    "composition": "Terminal window appearing with command text typing out character by character",
    "lens": "50mm portrait lens",
    "frame_rate": "30fps",
    "camera_movement": "Static, cursor blinking",
    "film_grain": "Clean digital"
  }
}
```

---

## KEY IMPROVEMENTS FROM VAULT

| Old Approach | 10x Better (Vault) |
|-------------|-------------------|
| 5-frame feature dump | 5-frame HYPE story |
| AI data center hero | Developer SHOCK moment |
| Technical accuracy | Emotional hook first |
| Show all features | Show ONE proof point |
| Demo mindset | Hype mindset |
| 13+ seconds of images | 18s max, every second counts |

---

## PROMPT STRUCTURE FORMULA (From Vault)

### For Images:
```
[Specific Subject] + [Setting/Background] + [Lighting] + [Style] + [Technical specs]
```

**Examples:**
- "Split screen terminal showing GPT-4 vs A3M costs, dark room, desk lamp lighting, professional comparison, photorealistic"
- "Terminal with 5 AI providers racing, cyberpunk aesthetic, neon green on black, holographic overlay, futuristic command center"

### For Video (Veo 3 JSON):
```
{
  "shot": {
    "composition": "[What you see]",
    "lens": "[Lens type]",
    "frame_rate": "[FPS - usually 24-30]",
    "camera_movement": "[Movement type and speed]",
    "film_grain": "[Texture/style]"
  }
}
```

---

## SHORTER PROMPTS THAT WORK (From Vault)

Rather than over-detailing, focus on:
1. **Subject** - What is shown
2. **Action/Motion** - What's happening
3. **Mood** - How it feels
4. **Style** - Visual reference

**Good:** "Split screen terminal, GPT-4 vs A3M costs, numbers updating live, shocked developer reaction"
**Bad:** "A photorealistic split-screen product photography composition showing two laptop screens side by side with detailed cost analysis..."

---

## HN/PH SPECIFIC TIPS

For Hacker News / Product Hunt audience:
1. **Lead with numbers, not claims**
2. **Show benchmark proof**
3. **Keep it technical but accessible**
4. **Demo should be "wow" not "look at all features"**
5. **CTA should be simple install command**
