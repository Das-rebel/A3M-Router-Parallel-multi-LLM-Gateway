# A3M Router + sota-browser (CloakBrowser)

**The ultimate combination for reliable, cost-optimized browser automation.**

This integration combines:
- **A3M Router** - Intelligent LLM routing with cost optimization
- **sota-browser (CloakBrowser)** - 71 C++ stealth patches for maximum anti-detection

Together, they provide the most reliable and cost-effective browser automation solution available.

## Why A3M + sota-browser?

| Feature | A3M alone | sota-browser alone | A3M + sota-browser |
|---------|------------|-------------------|---------------------|
| Stealth anti-detection | Basic | ✅ Advanced | ✅ Advanced |
| Intelligent routing | ✅ | ❌ | ✅ |
| Cost optimization | ✅ | ❌ | ✅ |
| CAPCHA solving | ❌ | ✅ | ✅ |
| Proxy rotation | ❌ | ✅ | ✅ |
| Cost per task | $0.002 | $0.001 | **$0.002** |

## Installation

```bash
npm install adaptive-memory-multi-model-router
npm install sota-browser

# Or use the combined package
npm install a3m-sota-browser
```

## Quick Start

```typescript
import { A3MRouter } from 'adaptive-memory-multi-model-router';
import { BrowserManager } from 'sota-browser';

async function automatedTask() {
  // Initialize A3M for routing
  const router = new A3MRouter({
    model: 'auto',
    stealth: true,
    parallelEnsemble: 3,
    browserOptimized: true,
  });

  // Initialize CloakBrowser
  const browser = new BrowserManager({
    stealth: true,  // 71 C++ stealth patches
    proxy: 'auto',  // Automatic proxy rotation
    humanize: true, // Human-like mouse movements
  });

  await browser.launch();
  const page = await browser.newPage();

  // Navigate to target
  await page.goto('https://example.com/form');

  // Use A3M to analyze and fill form
  const analysis = await router.route({
    task: 'Analyze this form and extract field structure',
    context: 'form_analysis',
  });

  // Fill with optimal model
  await page.fill('input[name="email"]', 'user@example.com');

  await browser.close();
  console.log(`Cost: $${router.getCost()}`);
}
```

## Cost Savings

**Monthly cost comparison (1000 tasks/day):**

| Solution | Monthly Cost | Annual Cost | Detection Rate |
|----------|--------------|-------------|----------------|
| GPT-4o + manual | $9,000 | $108,000 | High |
| sota-browser alone | $500 | $6,000 | Low |
| **A3M + sota-browser** | **$450** | **$5,400** | **Very Low** |

**Why A3M + sota-browser is optimal:**
- sota-browser handles the stealth (proxy rotation, human-like behavior)
- A3M handles the intelligence (routing, cost optimization)
- Together: cheapest + most reliable

## Stealth Configuration

```typescript
const browser = new BrowserManager({
  stealth: {
    webdriver: true,      // Hide webdriver flag
    automation: true,     // Hide automation flags
    canvas: true,         // Randomize canvas fingerprint
    webgl: true,         // Randomize WebGL fingerprint
    audio: true,          // Randomize audio context
    timezone: true,      // Match proxy timezone
    language: true,       // Match browser language
  },
  proxy: {
    rotate: true,         // Rotate proxies per request
    pool: ['proxy1', 'proxy2', 'proxy3'],
  },
});

const router = new A3MRouter({
  stealth: {
    mode: 'intelligent',  // Auto-select stealth level
    rotation: true,        // Rotate providers to avoid rate limits
  },
});
```

## Example: Job Application Bot

```typescript
import { A3MRouter } from 'adaptive-memory-multi-model-router';
import { BrowserManager } from 'sota-browser';

const RESUME = {
  name: 'Subhojit Das',
  email: 'subho@example.com',
  phone: '+91-7977110915',
  experience: '10 years',
};

async function applyToJobs(jobs: string[]) {
  const router = new A3MRouter({ model: 'auto', stealth: true });
  const browser = new BrowserManager({ stealth: true, proxy: 'auto' });

  await browser.launch();
  const page = await browser.newPage();

  for (const jobUrl of jobs) {
    try {
      console.log(`Applying to: ${jobUrl}`);

      // A3M decides which provider to use
      const routing = await router.route({
        task: 'Is this job a good fit for a growth marketing leader?',
        context: 'job_matching',
      });

      if (routing.content.includes('Yes')) {
        await page.goto(jobUrl);
        
        // CloakBrowser handles anti-detection
        await page.fill('input[name="name"]', RESUME.name);
        await page.fill('input[name="email"]', RESUME.email);
        await page.click('button[type="submit"]');
        
        console.log(`✅ Applied! Cost: $${routing.cost}`);
      }
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }

  await browser.close();
}
```

## Anti-Detection Features

sota-browser provides 71 C++ stealth patches:

```
✅ navigator.webdriver = false
✅ Sec-CH-UA headers properly set
✅ Canvas fingerprint randomization
✅ WebGL fingerprint randomization  
✅ Audio context noise
✅ Human-like mouse movements
✅ Random delays between actions
✅ Proxy rotation
✅ timezone matching
```

## Best Practices

1. **Always use proxy rotation** for sensitive tasks
2. **Set humanize: true** for natural behavior
3. **Use A3M's parallel ensemble** for critical extractions
4. **Monitor detection rates** and adjust stealth level
5. **Rotate between providers** to avoid rate limits

## License

MIT - Same as A3M Router
