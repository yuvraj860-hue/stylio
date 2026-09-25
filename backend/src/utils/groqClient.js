import env from '../config/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_HISTORY = 10;

export const groqConfigured = () => Boolean(env.GROQ_API_KEY);

export async function groqChat({ message, history = [], catalog, signal }) {
  if (!groqConfigured()) return null;

  const system = [
    'You are Stylio, the personal fashion stylist and wardrobe curator for STYLIO (a premium minimalist luxury apparel atelier).',
    'Reply in short, warm, and sophisticated lines — max 150 words.',
    'Always recommend real items with exact names and prices in rupees (₹) from the live catalog below.',
    'HINGLISH & HINDI INTELLIGENCE: If the user communicates in Hindi or Hinglish (e.g., "mujhe kya pehanna chahiye", "shaadi / wedding ke liye best outfit", "college ya date night ke liye", "budget me sneakers dikhao"), respond seamlessly in warm, chic, friendly Hinglish or Hindi just like a high-end personal stylist in Mumbai or Delhi.',
    'Suggest complementary pairing advice (e.g. matching shoes, jewelry, jackets).',
    'If nothing exact is available, politely suggest the closest match or invite them to search the catalog.',
    '',
    'LIVE CATALOG:',
    catalog || '(catalog unavailable)',
  ].join('\n');

  const turns = Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];

  const controller = signal || new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: 'system', content: system },
          ...turns,
          { role: 'user', content: message },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq responded with ${response.status}`);
    }

    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message;
    return (reply && reply.content) || null;
  } finally {
    clearTimeout(timer);
  }
}