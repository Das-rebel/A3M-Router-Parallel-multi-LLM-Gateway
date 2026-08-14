/**
 * Example: Automated Job Application with A3M + browser-use
 * 
 * This example demonstrates:
 * 1. Setting up A3M Router for browser automation
 * 2. Using stealth mode to avoid detection
 * 3. Parallel ensemble for reliable form filling
 * 4. Cost tracking
 */

import { chromium } from 'playwright';
import { A3MRouter } from 'adaptive-memory-multi-model-router';

// Resume data to fill into forms
const RESUME_DATA = {
  firstName: 'Subhojit',
  lastName: 'Das',
  email: 'subho@example.com',
  phone: '+91-7977110915',
  location: 'Bengaluru, India',
  currentTitle: 'Head of Growth Marketing',
  yearsExperience: '10',
  linkedin: 'https://www.linkedin.com/in/subhajitd/',
  website: 'https://subho.dev',
};

interface JobListing {
  company: string;
  title: string;
  url: string;
}

async function applyToJob(job: JobListing) {
  // Initialize A3M for browser automation
  const router = new A3MRouter({
    model: 'auto', // Routes to cheapest capable
    stealth: true, // Enable anti-detection
    parallelEnsemble: 3, // Run 3 providers for reliability
    browserOptimized: true,
    providers: ['openai', 'anthropic', 'google'],
  });

  console.log(`\nApplying to ${job.title} at ${job.company}...`);

  const browser = await chromium.launch({
    headless: false, // Set to true for production
  });

  try {
    const context = await browser.newContext({
      // Stealth options
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });

    const page = await context.newPage();

    // Navigate to job application page
    await page.goto(job.url, { waitUntil: 'networkidle' });

    // Use A3M to analyze the form
    console.log('Analyzing form structure...');
    const formAnalysis = await router.route({
      task: `Analyze this job application form. List all fields with:
        1. Field name/type
        2. Selector (CSS or XPath)
        3. Whether it's required
        4. Expected format`,
      context: 'form_analysis',
    });

    console.log(`Found form fields: ${formAnalysis.content.substring(0, 100)}...`);

    // Fill form fields based on analysis
    const fieldMappings: Record<string, string> = {
      'first name': RESUME_DATA.firstName,
      'last name': RESUME_DATA.lastName,
      'email': RESUME_DATA.email,
      'phone': RESUME_DATA.phone,
      'location': RESUME_DATA.location,
      'current title': RESUME_DATA.currentTitle,
      'years of experience': RESUME_DATA.yearsExperience,
      'linkedin': RESUME_DATA.linkedin,
    };

    // Fill text inputs
    for (const [fieldName, value] of Object.entries(fieldMappings)) {
      try {
        // Find the input field by label
        const input = await page.locator(`input[aria-label*="${fieldName}" i], input[name*="${fieldName}" i]`).first();
        
        if (await input.isVisible()) {
          await input.fill(value);
          console.log(`Filled: ${fieldName}`);
        }
      } catch (e) {
        console.log(`Could not fill: ${fieldName}`);
      }
    }

    // Upload resume if there's a file input
    try {
      const resumeInput = await page.locator('input[type="file"]').first();
      if (await resumeInput.isVisible()) {
        await resumeInput.setInputFiles('/path/to/resume.pdf');
        console.log('Uploaded resume');
      }
    } catch (e) {
      console.log('No file upload field found');
    }

    // Use A3M to decide if we're ready to submit
    const pageState = await page.content();
    const submitDecision = await router.route({
      task: `Should I submit this form? Review the filled values and check for:
        1. Required fields are filled
        2. Values look correct
        3. No obvious errors
        
        Return YES or NO with brief explanation.`,
      context: 'decision_making',
    });

    if (submitDecision.content.toLowerCase().includes('yes')) {
      // Submit the form
      await page.click('button[type="submit"]');
      console.log('Form submitted!');

      // Wait for confirmation
      await page.waitForTimeout(2000);
      const confirmation = await page.content();
      
      if (confirmation.includes('applied') || confirmation.includes('success')) {
        console.log('✅ Application successful!');
      }
    } else {
      console.log(`❌ Not ready to submit: ${submitDecision.content}`);
    }

    // Get cost stats
    const cost = router.getCost();
    console.log(`Cost for this application: $${cost.total.toFixed(4)}`);

  } finally {
    await browser.close();
  }
}

// Example usage
async function main() {
  const jobs: JobListing[] = [
    {
      company: 'TechCorp',
      title: 'Head of Marketing',
      url: 'https://example.com/jobs/123',
    },
    {
      company: 'StartupXYZ',
      title: 'VP Growth',
      url: 'https://example.com/jobs/456',
    },
  ];

  console.log('🤖 A3M + browser-use Job Application Bot');
  console.log('='.repeat(50));
  console.log(`Applying to ${jobs.length} jobs...\n`);

  for (const job of jobs) {
    try {
      await applyToJob(job);
    } catch (e) {
      console.error(`Failed to apply to ${job.company}: ${e}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('All applications complete!');
}

main().catch(console.error);
