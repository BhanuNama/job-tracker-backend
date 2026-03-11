const router = require('express').Router();
const https = require('https');
const auth = require('../middleware/auth');

/** Call Groq (free, global) via REST — no npm package needed */
function callGroq(prompt) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return reject(new Error('GROQ_API_KEY not configured'));

        const body = JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 1024,
        });

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        console.error('Groq API error:', JSON.stringify(json.error));
                        return reject(new Error(json.error.message));
                    }
                    const text = json.choices?.[0]?.message?.content || '';
                    resolve(text);
                } catch (e) {
                    console.error('Raw Groq response:', data);
                    reject(new Error('Failed to parse Groq response'));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

/**
 * POST /api/ai/parse-jd
 * Body: { jdText: string }
 * Returns extracted fields + a short JD summary
 */
router.post('/parse-jd', auth, async (req, res) => {
    try {
        const { jdText } = req.body;
        if (!jdText || jdText.trim().length < 20) {
            return res.status(400).json({ error: 'Please provide a job description (at least 20 characters)' });
        }
        if (jdText.length > 15000) {
            return res.status(400).json({ error: 'Job description too long (max 15,000 characters)' });
        }

        const prompt = `You are an expert job data extractor. Analyze the following job description and extract structured information. Return a valid JSON object ONLY — no markdown, no code fences, no explanation, just the raw JSON.

Extract these fields (use null if not found):
{
  "company": "Company name",
  "role": "Job title / role",
  "location": "City, State or Country (e.g. 'San Francisco, CA' or 'Bangalore, India' or 'Remote')",
  "remote": "one of: remote, hybrid, onsite",
  "skills": ["array", "of", "required", "skills"],
  "salary": {
    "min": <number in annual USD or INR — null if not found>,
    "max": <number in annual USD or INR — null if not found>,
    "currency": "USD or INR or other — null if not found"
  },
  "jobUrl": null,
  "jdSummary": "A clean, concise 3-5 sentence summary of this role for quick reference. Highlight: what the role does, key responsibilities, required experience, and unique perks or culture. Write in second person (You will...)."
}

If salary is mentioned as a range like '₹8-12 LPA', convert to numbers: min=800000, max=1200000, currency=INR.
If salary is like '$120k-$160k', convert to: min=120000, max=160000, currency=USD.

Job Description:
${jdText}`;

        const rawText = await callGroq(prompt);

        // Strip any accidental markdown fences
        const cleaned = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            // Try to extract JSON from within the text
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error('AI returned non-JSON response');
            }
        }

        // Sanitize & validate
        const result = {
            company: parsed.company || null,
            role: parsed.role || null,
            location: parsed.location || null,
            remote: ['remote', 'hybrid', 'onsite'].includes(parsed.remote) ? parsed.remote : 'onsite',
            skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 20) : [],
            salary: {
                min: typeof parsed.salary?.min === 'number' ? parsed.salary.min : null,
                max: typeof parsed.salary?.max === 'number' ? parsed.salary.max : null,
                currency: parsed.salary?.currency || null,
            },
            jobUrl: parsed.jobUrl || null,
            jdSummary: parsed.jdSummary || null,
        };

        res.json(result);
    } catch (err) {
        console.error('AI parse error:', err.message);
        if (err.message.includes('GROQ_API_KEY')) {
            return res.status(503).json({ error: 'AI service not configured. Please add GROQ_API_KEY to your .env file.' });
        }
        res.status(500).json({ error: 'AI parsing failed: ' + err.message });
    }
});

module.exports = router;
