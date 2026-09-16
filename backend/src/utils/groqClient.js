import env from '../config/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_HISTORY = 10;

export const groqConfigured = () => Boolean(env.GROQ_API_KEY);

export async function groqChat({ message, history = [], catalog, signal }) {
  if (!groqConfigured()) return null;

  const system = [
    'You are Stylio, the stylish personal shopper for STYLIO, a modern minimal fashion store.',
    'Reply in short, friendly lines — max 150 words. Recommend real items from the catalog below.',
    'Mention the product name and price in rupees (₹) when you recommend something.',
    'If nothing fits, suggest the closest category and tell the user to browse the shop.',
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