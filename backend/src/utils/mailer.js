import env from '../config/env.js';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const brevoConfigured = () => Boolean(env.BREVO_API_KEY);

const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const baseShell = (title, bodyHtml) => `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;line-height:1.6">
    <div style="padding:24px 28px;background:#0f0f0f;color:#fff">
      <span style="font-size:20px;letter-spacing:0.12em;font-weight:600">STYLIO</span>
    </div>
    <div style="padding:28px;border:1px solid #eee;border-top:none">
      ${bodyHtml}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
        STYLIO — considered clothing, curated for you.
      </p>
    </div>
  </div>`;

const emailHtml = ({ title, bodyHtml }) =>
  baseShell(title, `<h2 style="margin:0 0 16px;font-size:18px">${title}</h2>${bodyHtml}`);

export async function sendOrderConfirmationEmail(order) {
  if (!brevoConfigured()) return false;

  const itemsHtml = order.items
    .map((item) => {
      const variant = [item.color, item.size].filter(Boolean).join(' / ');
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(item.name)}
            ${variant ? `<br/><span style="color:#999;font-size:12px">${escapeHtml(variant)}</span>` : ''}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatINR(item.price * item.qty)}</td>
        </tr>`;
    })
    .join('');

  const shipping = order.shippingAddress || {};
  const address = [shipping.name, shipping.street, shipping.city, shipping.state, shipping.zip, shipping.country]
    .filter(Boolean)
    .join(', ');

  const bodyHtml = `
    <p>Hi ${escapeHtml(shipping.name || 'there')},</p>
    <p>Thanks for your order! We've received your payment and your pieces are being prepared.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
      <thead>
        <tr style="text-align:left;color:#999;font-size:12px">
          <th style="padding:8px 0">Item</th>
          <th style="padding:8px 0;text-align:center">Qty</th>
          <th style="padding:8px 0;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 0;font-weight:600">Order Total</td>
          <td style="padding:12px 0;text-align:right;font-weight:600">${formatINR(order.total)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="margin-top:20px;font-size:13px">
      <strong>Order ID:</strong> ${escapeHtml(order._id)}<br/>
      <strong>Shipping to:</strong> ${escapeHtml(address)}
    </p>
    <p style="font-size:13px;color:#666">You can track the status anytime from your account page.</p>
  `;

  return sendEmail({
    to: shipping.email || env.EMAIL_FROM,
    subject: `Order Confirmed — STYLIO (${order._id})`,
    html: emailHtml({ title: 'Order Confirmed', bodyHtml }),
  });
}

export async function sendWelcomeEmail(user) {
  if (!brevoConfigured()) return false;

  const bodyHtml = `
    <p>Hi ${escapeHtml(user.name || 'there')},</p>
    <p>Welcome to STYLIO!</p>
    <p>Considered clothing for modern living — explore our latest pieces and let Stylio, our AI stylist, curate looks for you.</p>
    <p>
      <a href="${env.FRONTEND_URL}/shop" style="display:inline-block;padding:12px 20px;background:#0f0f0f;color:#fff;text-decoration:none;border-radius:4px">Start Shopping</a>
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to STYLIO',
    html: emailHtml({ title: 'Welcome to STYLIO', bodyHtml }),
  });
}

export async function sendEmail({ to, subject, html }) {
  if (!brevoConfigured()) return false;

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Brevo send failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return true;
}