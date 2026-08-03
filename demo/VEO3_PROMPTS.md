# Frame-by-Frame Veo 3 Prompts for A3M Router Product Video
# Copy each prompt into Gemini (Pro account) with Veo 3 enabled
# Generate 8-12 second clips, then stitch with ffmpeg

---

## FRAME 1: "Routing Decision" (8-12 seconds)

### Step 1: Generate still image with Nano Banana Pro

Open Gemini, paste:

```
Generate a photorealistic image of a developer laptop screen in a dark room.
The screen shows a terminal window with dark theme (#0d1117 background).
The terminal is running an LLM router called "A3M Router".
Text appears showing:
- Input: "What is 2+2?" in white
- Routing: "→ complexity: 8/100 (TRIVIAL)" in cyan
- Decision: "→ routed to: groq/llama-3.3-70b" in green (#3fb950)
- Cost: "→ cost: $0.000009" in green
A glowing blue (#58a6ff) routing graph appears beside the terminal showing
query → [complexity analysis] → [provider selection] → response.
The laptop sits on a wooden desk with warm desk lamp lighting.
Shallow depth of field. 16:9 aspect ratio. Photorealistic.
JetBrains Mono font on the terminal.
```

### Step 2: Animate with Veo 3

Upload the generated image as reference, then paste:

```json
{
  "shot": {
    "composition": "Close-up of laptop screen, 50mm lens, shallow depth of field, warm desk lamp glow on right, cool monitor light",
    "camera_motion": "Slow dolly in from showing the full laptop to tight on the terminal text, then subtle rack focus from the terminal to the routing graph and back",
    "frame_rate": "24fps",
    "film_grain": "very subtle, Kodak 5219 emulation"
  },
  "subject": {
    "description": "A developer laptop showing an AI routing tool. Terminal text types in line by line. The routing path lights up with cyan and green glows as each decision is made. The routing graph on the side pulses with blue light along the decision path.",
    "motion": "Text appears line by line as if typed. Routing path illuminates sequentially. Green checkmark appears beside the selected provider. Cost number counts up briefly then locks in."
  },
  "environment": {
    "ambient_lighting": "Warm desk lamp from upper right casting soft shadows. Cool blue monitor glow illuminating the keyboard. Subtle plant shadow in background.",
    "atmosphere": "Late night productive coding session. Dark room. Focused."
  },
  "audio": {
    "type": "Subtle keyboard typing sounds as text appears. Soft ambient lo-fi beat. Gentle confirmation chime when provider is selected.",
    "mood": "calm, focused, productive, efficient"
  }
}
```

---

## FRAME 2: "Cost Savings" (8-12 seconds)

### Step 1: Still image with Nano Banana Pro

```
Generate a photorealistic image of a laptop screen showing a dark-themed (#0d1117) cost comparison infographic.
Title at top: "Cost Per Query" in white text.
Two vertical bar charts side by side:
- Left bar: Tall RED bar labeled "GPT-4 (No A3M)" showing "$0.03" at the top
- Right bar: Tiny GREEN bar labeled "A3M Router" showing "$0.0004" at the top
Below the bars in large bold green (#3fb950) text: "213× cheaper"
The laptop is on a dark desk. Warm desk lamp.
Photorealistic. 16:9. Clean, minimal, Apple-style presentation.
```

### Step 2: Animate with Veo 3

```json
{
  "shot": {
    "composition": "Medium shot of laptop screen, slight angle, 65mm lens, shallow depth of field",
    "camera_motion": "Static for 2 seconds, then subtle tilt down to reveal the '213× cheaper' text, then hold",
    "frame_rate": "24fps",
    "film_grain": "minimal"
  },
  "subject": {
    "description": "A cost comparison chart on a dark screen. The red bar animates growing upward to full height with a rising red glow. Then the green bar grows to its tiny height with a satisfying green flash. The '213× cheaper' text fades in with a subtle scale animation.",
    "motion": "Red bar rises first with ascending motion. Brief pause. Then green bar rises quickly with a satisfying pop. '213× cheaper' text scales from 0 to 100% with a subtle bounce. Numbers count up as each bar grows."
  },
  "environment": {
    "ambient_lighting": "Cool monitor glow on dark desk. No warm lamp this time - pure data visualization focus.",
    "atmosphere": "Clean, data-driven, confident. Like a financial report reveal."
  },
  "audio": {
    "type": "Subtle bass hit when red bar reaches top. Higher, satisfying chime when green bar arrives. Swoosh sound as '213×' text appears.",
    "mood": "impactful, surprising, satisfying"
  }
}
```

---

## FRAME 3: "Parallel Execution" (8-12 seconds)

### Step 1: Still image with Nano Banana Pro

```
Generate a dark-themed (#0d1117) technical diagram on a laptop screen showing parallel LLM execution.
Left side: "Your Query" in a cyan (#58a6ff) circle.
Center: 5 arrows branching out rightward simultaneously to 5 provider boxes:
- "Groq" with green checkmark, showing "325ms, FREE"
- "Cerebras" with green checkmark, showing "180ms, FREE"
- "DeepSeek" with green checkmark, showing "800ms, $0.14/1M"
- "Mistral" with green checkmark, showing "1.2s, $2.00/1M"
- "OpenAI" with yellow clock, showing "2.1s, $2.50/1M"
Right side: "Best Response ✓" in green (#3fb950) highlighting the Groq result.
Below: "Latency: 180ms (fastest provider)" in green.
All 5 arrows animate simultaneously (not sequentially).
Photorealistic laptop on desk. 16:9. Dark room.
```

### Step 2: Animate with Veo 3

```json
{
  "shot": {
    "composition": "Overhead angle looking down at laptop screen, 35mm lens, showing the full diagram clearly",
    "camera_motion": "Subtle slow zoom in on the diagram as it progresses. Camera stays relatively static to not distract from the data.",
    "frame_rate": "24fps",
    "film_grain": "minimal"
  },
  "subject": {
    "description": "A routing diagram on a dark screen. The 'Your Query' circle pulses cyan. All 5 arrows extend outward simultaneously (not one-by-one). Each provider box lights up as the arrow reaches it with a brief flash. Then the Groq box pulses brighter with a green glow and the 'Best Response' label appears on the right.",
    "motion": "Query circle pulses. 5 arrows extend simultaneously left-to-right. Provider boxes illuminate as arrows arrive (Groq and Cerebras arrive first). Green highlight travels down to the selected response. '180ms' counter appears and locks."
  },
  "environment": {
    "ambient_lighting": "Pure monitor glow. Dark desk. Technical presentation feel.",
    "atmosphere": "Efficient, fast, decisive"
  },
  "audio": {
    "type": "Subtle electronic/tech whoosh as arrows extend. Light ping as each provider lights up. Satisfying confirmation tone when Best Response appears.",
    "mood": "fast, efficient, smart"
  }
}
```

---

## FRAME 4: "40 Providers" (8-12 seconds)

### Step 1: Still image with Nano Banana Pro

```
Generate a dark-themed (#0d1117) terminal window on a laptop showing a provider status table.
The table has columns: Provider | Status | Cost | Latency
Rows visible:
✓ groq/llama-3.3-70b      FREE        325ms
✓ cerebras/llama-3.3-70b  FREE        180ms
✓ deepseek/chat            $0.14/1M    800ms
✓ mistral/mistral-large    $2.00/1M    1.2s
✓ openai/gpt-4o            $2.50/1M    2.1s
... (35 more rows visible but dimmed)
All green checkmarks. Title: "40 Providers — All Online ✓"
Dark room, desk lamp, MacBook. Photorealistic. 16:9.
```

### Step 2: Animate with Veo 3

```json
{
  "shot": {
    "composition": "Slight angle on laptop screen, 50mm lens, showing the provider table",
    "camera_motion": "Camera slowly tilts down as the table scrolls, revealing more providers. Settles on the bottom showing '... 35 more' with the '40 Providers' header.",
    "frame_rate": "24fps",
    "film_grain": "subtle"
  },
  "subject": {
    "description": "A terminal table listing AI providers. The table appears line by line with each row. Green checkmarks appear with a brief flash next to each provider name as it loads. The status shows 'All Online'. The table scrolls down smoothly to reveal more entries.",
    "motion": "Table rows load one by one from top to bottom. Checkmarks flash green as each appears. Subtle pulse on the 'All Online ✓' badge. Smooth scroll down revealing more providers."
  },
  "environment": {
    "ambient_lighting": "Warm desk lamp from side. Cool monitor glow.",
    "atmosphere": "Impressive scale. Professional. Technical."
  },
  "audio": {
    "type": "Subtle ticking/click sound as each row loads. Soft ambient hum. Final satisfying chord when full table is visible.",
    "mood": "impressive, professional, comprehensive"
  }
}
```

---

## FRAME 5: "End Card" (8-12 seconds)

### Step 1: Still image with Nano Banana Pro

```
Generate a dark-themed (#0d1117) product card on a laptop screen.
Center: "A3M Router" in large white bold text with a subtle blue (#58a6ff) glow.
Below in smaller text: "Parallel LLM Router · 213× cheaper than GPT-5 · 40 providers"
Below that in a terminal-style box: "$ npm install adaptive-memory-multi-model-router"
Bottom: GitHub logo and npm logo side by side.
Very clean, minimal, dark. Apple-style presentation.
Photorealistic laptop on dark desk. 16:9.
```

### Step 2: Animate with Veo 3

```json
{
  "shot": {
    "composition": "Centered view of laptop screen, 50mm lens, clean and symmetrical",
    "camera_motion": "Camera slowly pushes in on the center text, creating a subtle zoom that focuses attention on the npm install command at the end",
    "frame_rate": "24fps",
    "film_grain": "very subtle"
  },
  "subject": {
    "description": "A clean dark product card. The 'A3M Router' title fades in first with a subtle glow. Then the tagline 'Parallel LLM Router · 213× cheaper · 40 providers' appears below with a brief typewriter effect. Finally the npm install command types out character by character with a blinking cursor. GitHub and npm logos fade in at bottom.",
    "motion": "Title fades in with glow. Tagline types line by line. npm command types character by character. Cursor blinks at the end. Subtle continuous blue glow on the title."
  },
  "environment": {
    "ambient_lighting": "Pure monitor glow on a dark desk. Cinematic. Clean.",
    "atmosphere": "Confident, final, memorable"
  },
  "audio": {
    "type": "Soft ambient synth pad. Subtle typing sounds as npm command appears. Final soft confirmation tone.",
    "mood": "confident, complete, memorable"
  }
}
```

---

## STITCH ALL 5 CLIPS (run after generating all 5 videos)

```bash
# Download all 5 clips from Gemini/Veo to the demo/ folder
# Naming: frame1-routing.mp4, frame2-cost.mp4, frame3-parallel.mp4, frame4-providers.mp4, frame5-endcard.mp4

# Create concat file
cat > demo/clips.txt << EOF
file 'frame1-routing.mp4'
file 'frame2-cost.mp4'
file 'frame3-parallel.mp4'
file 'frame4-providers.mp4'
file 'frame5-endcard.mp4'
EOF

# Stitch all clips
ffmpeg -f concat -safe 0 -i demo/clips.txt \
  -c:v libx264 -preset slow -crf 18 \
  -pix_fmt yuv420p -movflags +faststart \
  assets/a3m-product-demo.mp4

# Generate GIF version (for Twitter/GitHub)
ffmpeg -i assets/a3m-product-demo.mp4 \
  -vf "fps=15,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palette=max_colors=128:stats_mode=diff[p];[s1][p]histogram=th=0.001" \
  -loop 0 \
  assets/a3m-product-demo.gif

# Generate 30-second clip for ProductHunt
ffmpeg -i assets/a3m-product-demo.mp4 -t 30 \
  -c:v libx264 -preset slow -crf 20 \
  -pix_fmt yuv420p -movflags +faststart \
  assets/a3m-ph-30s.mp4

echo "✅ All videos generated!"
echo "  Full demo: assets/a3m-product-demo.mp4"
echo "  GIF:       assets/a3m-product-demo.gif"
echo "  PH clip:   assets/a3m-ph-30s.mp4"
```