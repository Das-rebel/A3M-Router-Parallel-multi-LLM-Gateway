# A3M Router — Video Production Guide
# Using: Nano Banana Pro (Google) + Veo 3 (Google Pro) + Asciinema + FFmpeg

## AVAILABLE TOOLS (you have Google Pro access)

| Tool | What it does | Access |
|------|-------------|--------|
| **Nano Banana Pro** | Google's image gen (in Gemini) | ✅ Google Pro |
| **Veo 3 / Veo 3.1** | Google's video gen (in Gemini) | ✅ Google Pro |
| **Kling 2.1 / 3** | Video gen with start/end frames | Free tier |
| **Hailuo 2** | Video generation | Free tier |
| **asciinema** | Terminal recording | `brew install asciinema` |
| **VHS** | Terminal recording → GIF | `brew install vhs` |
| **ffmpeg** | Video stitching, conversion | Already installed ✅ |
| **ElevenLabs** | Voiceover / music | Free tier |

---

## VIDEO 1: Terminal Demo (60s, for HN/GitHub README)

### METHOD A: Asciinema (recommended for HN)

```bash
# 1. Install asciinema
brew install asciinema

# 2. Record the demo
asciinema rec -c "bash demo/asciinema-demo.sh" demo/recording.cast

# 3. Upload to asciinema.org (auto-embeds in HN comments)
asciinema upload demo/recording.cast
# → Returns URL like https://asciinema.org/a/ABC123

# 4. Convert to GIF (for README)
pip3 install agg
agg demo/recording.cast assets/demo-hn.gif

# OR install agg via cargo:
cargo install agg
agg --theme demo/recording.cast assets/demo-hn.gif
```

### METHOD B: VHS (GIF only, no asciinema needed)

```bash
# 1. Install VHS
brew install vhs

# 2. Record from tape file
vhs demo/demo-hn.tape
# → outputs to assets/demo-hn.gif
```

### Embed in HN post:
```
Asciinema: https://asciinema.org/a/YOUR_CAST_ID
GIF for README: ![demo](assets/demo-hn.gif)
```

---

## VIDEO 2: Product Demo Video (60s, for ProductHunt + Twitter)

### Pipeline: Nano Banana Pro → Veo 3 → FFmpeg

### STEP 1: Generate key frames with Nano Banana Pro

Open Gemini (you have Pro access) and use this system prompt:

```
You are generating product showcase frames for a developer tool called A3M Router.

For each scene, create a photorealistic image using these specifications:
- Dark theme (#0d1117 background)
- Terminal/IDE aesthetic
- Screen-recording style, like a modern developer setup
- JetBrains Mono font, macOS-style window chrome
- Subtle green (#3fb950) and blue (#58a6ff) accents
- Clean, minimal, Apple-style product photography feel

Generate these 5 frames:
```

Then generate each frame:

**Frame 1: "Routing Decision" (0-12s)**
```
Nano Banana Pro prompt:
A developer laptop screen showing a terminal. The terminal shows:
Lines of code being routed to different AI models.
Left side: input queries in white text.
Right side: provider names lighting up in green (Groq, DeepSeek, OpenAI).
Center: a routing decision tree glowing with blue nodes.
Dark background (#0d1117), JetBrains Mono font.
Photorealistic screen recording, 16:9, shallow depth of field.
```

**Frame 2: "Cost Savings" (12-24s)**
```
Nano Banana Pro prompt:
A clean dark-themed infographic on a laptop screen.
Title: "Cost Comparison" in white text.
Two bar charts side by side:
Left: "Without A3M" showing a tall red bar ($0.03/query)
Right: "With A3M" showing a tiny green bar ($0.0004/query)
Below: "213× cheaper" in large bold green text.
Background: #0d1117. Font: JetBrains Mono. Photorealistic, 16:9.
```

**Frame 3: "Parallel Execution" (24-36s)**
```
Nano Banana Pro prompt:
A diagram on a dark terminal screen showing parallel LLM execution.
Left: "Your Query" in a blue circle.
Center: 5 arrows splitting out simultaneously to 5 provider boxes (Groq, Cerebras, DeepSeek, Mistral, OpenAI) — all lighting up at once.
Right: "Best Response" selected with a green checkmark.
Below: "Latency: 138ms" in green text.
Background #0d1117, JetBrains Mono, photorealistic, 16:9.
```

**Frame 4: "40 Providers" (36-48s)**
```
Nano Banana Pro prompt:
A terminal window on a dark themed screen showing a table of providers.
Rows: "groq/llama-3.3-70b  ✓ FREE  325ms", "cerebras/llama-3.3-70b  ✓ FREE  180ms", "deepseek/chat  ✓ $0.14/1M  800ms", "mistral/mistral-large  ✓ $2.00/1M  1.2s", "openai/gpt-4o  ✓ $2.50/1M  2.1s"
... 35 more rows dimmed below.
Green checkmarks next to each. Status: all online.
Background #0d1117, photorealistic, 16:9.
```

**Frame 5: "End Card" (48-60s)**
```
Nano Banana Pro prompt:
A dark product card on a #0d1117 background.
Center: "A3M Router" in large white bold text.
Below: "Parallel LLM Router · 213× cheaper than GPT-5 · 40 providers"
Bottom: "npm install adaptive-memory-multi-model-router"
GitHub logo and npm logo at the bottom.
Clean, minimal, photorealistic, 16:9.
```

### STEP 2: Animate frames into video with Veo 3

For each frame, open Gemini and use Veo 3 to generate 8-12 second video clips:

```
Veo 3 prompt (for each frame):
{
  "shot": {
    "composition": "Close-up of laptop screen, 85mm lens, shallow depth of field, cinematic product showcase",
    "camera_motion": "Slow dolly in from wide to tight on the terminal output, then subtle pan across the data",
    "frame_rate": "24fps",
    "film_grain": "very subtle, Kodak 5219 emulation"
  },
  "subject": {
    "description": "A developer's laptop screen displaying an AI routing tool. The terminal shows queries being routed to different providers with green confirmation checkmarks appearing. Clean dark theme UI.",
    "motion": "Text appears line by line as if being typed. Data highlights pulse briefly. Provider names light up sequentially with green glow."
  },
  "environment": {
    "ambient_lighting": "Warm desk lamp from the right, cool monitor glow from the screen. Subtle desk plant shadow in background.",
    "atmosphere": "Late night coding session. Dark room with focused monitor light."
  },
  "audio": {
    "type": "subtle keyboard typing sounds, gentle ambient lo-fi beat",
    "mood": "calm, focused, productive"
  }
}
```

**Specific Veo 3 prompts per frame:**

Frame 1 → Veo 3: Camera slowly zooms in on the terminal as routing decisions light up
Frame 2 → Veo 3: The red bar animates growing tall, then the green bar grows to show savings, "213×" text zooms in
Frame 3 → Veo 3: Arrows animate out from center simultaneously, providers light up at the same time, best response pulses green
Frame 4 → Veo 3: Table scrolls down showing all providers, checkmarks appear one by one with subtle sound
Frame 5 → Veo 3: Text fades in line by line, minimal and clean, npm command types out character by character

### STEP 3: Stitch with FFmpeg

```bash
# Concatenate all clips
ffmpeg -i frame1.mp4 -i frame2.mp4 -i frame3.mp4 -i frame4.mp4 -i frame5.mp4 \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset slow -crf 18 \
  -pix_fmt yuv420p \
  assets/a3m-product-demo.mp4

# Generate GIF version for Twitter
ffmpeg -i assets/a3m-product-demo.mp4 \
  -vf "fps=15,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palette[p];[s1][p]histogram=th=0.001" \
  assets/a3m-product-demo.gif

# Generate short clip for PH (30s)
ffmpeg -i assets/a3m-product-demo.mp4 -t 30 \
  -c:v libx264 -preset slow -crf 20 \
  assets/a3m-ph-30s.mp4
```

### STEP 4: (Optional) Add voiceover with ElevenLabs

```bash
# Script for voiceover (60 seconds):
# "Every LLM router does the same thing. Try provider A. If it fails, try B.
#  That's sequential. And slow. A3M Router is different. It fires all providers
#  at the same time. Scores the responses. Returns the best one.
#  The result? 213 times cheaper than GPT-5. Number one parallel routing across 47+ providers.
#  40 providers. Zero ML. Three megabyte install.
#  npm install adaptive-memory-multi-model-router."
```

---

## VIDEO 3: 30-Second Social Clip (Twitter/X, LinkedIn)

### Quick pipeline using existing assets

```bash
# Take the animated SVG and convert to MP4
ffmpeg -loop 1 -i assets/hero-diagram.svg \
  -vf "scale=1200:675,format=yuv420p" \
  -t 30 -r 30 \
  -c:v libx264 -preset fast -crf 23 \
  assets/social-30s.mp4
```

Or use Veo 3 with a single frame:
```
Veo 3 prompt:
Single dark-themed product card showing "A3M Router - Parallel LLM Router".
Camera slowly pushes in. Text animates in.
"npm install adaptive-memory-multi-model-router" types out at bottom.
30 seconds. Dark theme. Clean. Minimal.
```

---

## VIDEO 4: YouTube Walkthrough (3 min, for ProductHunt + README)

### Record with asciinema + screen recording

```bash
# Option 1: Full asciinema recording (3 min)
asciinema rec demo/youtube-walkthrough.cast

# In the recording:
# 0:00-0:20 - Install and intro
# 0:20-1:00 - Route queries (simple, code, complex)
# 1:00-1:40 - Show cost comparison, benchmark data
# 1:40-2:20 - Start proxy, show OpenAI compatibility
# 2:20-3:00 - Show providers, circuit breaker, cache

# Option 2: Use QuickTime screen recording
# Open QuickTime → File → New Screen Recording → Select terminal area
# Run: bash demo/asciinema-demo.sh
# Record for 3 minutes
# Export as demo/youtube-walkthrough.mov
# Convert: ffmpeg -i youtube-walkthrough.mov -c:v libx264 -crf 18 assets/youtube-walkthrough.mp4
```

---

## POSTING GUIDE

### Hacker News
- Embed asciinema link directly in Show HN text
- Also add GIF to GitHub README
- HN doesn't support embedded video — asciinema is the best format

### ProductHunt
- Upload the 60s product demo video (MP4, under 100MB)
- Also add the 30s clip as a secondary gallery item
- Thumbnail: Frame 5 (end card) as 1200×675 PNG

### Twitter/X
- Upload the 30s clip as native video
- Or post the 60s demo as a thread with GIF
- Quote tweet yourself with the YouTube walkthrough

### README.md
- Add demo GIF at the very top (before the install command)
- Add asciinema embed below
- Add YouTube link in the badges section

---

## QUICK START (fastest path to video)

### 60-second terminal demo (5 minutes):

```bash
# 1. Install asciinema
brew install asciinema

# 2. Record
asciinema rec -c "bash demo/asciinema-demo.sh" demo/recording.cast

# 3. Upload (for HN embed)
asciinema upload demo/recording.cast

# 4. Convert to GIF (for README)
pip3 install agg
agg demo/recording.cast assets/demo-hn.gif
```

### 60-second product video (30 minutes):

1. Open Gemini with Pro access
2. Generate 5 frames using the Nano Banana Pro prompts above
3. Use Veo 3 to animate each frame (8-12s each)
4. Download all 5 clips
5. Stitch with ffmpeg:
   ```bash
   ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 -i clip4.mp4 -i clip5.mp4 \
     -filter_complex "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0" \
     -c:v libx264 -crf 18 assets/a3m-product-demo.mp4
   ```

---

## CHECKLIST

- [ ] Terminal demo: `asciinema rec -c "bash demo/asciinema-demo.sh" demo/recording.cast`
- [ ] Upload asciinema: `asciinema upload demo/recording.cast`
- [ ] Convert to GIF: `agg demo/recording.cast assets/demo-hn.gif`
- [ ] Generate 5 product frames in Nano Banana Pro (Gemini)
- [ ] Animate 5 clips in Veo 3 (Gemini Pro)
- [ ] Stitch clips with ffmpeg
- [ ] Add GIF to README.md hero section
- [ ] Add asciinema link to HN post
- [ ] Upload product video to ProductHunt
- [ ] Upload 30s clip to Twitter
- [ ] Record 3-min YouTube walkthrough