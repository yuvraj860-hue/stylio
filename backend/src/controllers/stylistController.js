import Product from '../models/Product.js';
import apiClient from '../utils/apiClient.js';
import asyncHandler from '../utils/asyncHandler.js';
import { groqChat } from '../utils/groqClient.js';

const findRecommendations = async (categoryMatch, limit = 2) => {
  const matchers = Array.isArray(categoryMatch) ? categoryMatch : [categoryMatch];
  for (const matcher of matchers.filter(Boolean)) {
    const product = await Product.findOne({
      active: true,
      category: { $regex: new RegExp(matcher, 'i') },
    });
    if (product) return product;
  }
  return null;
};

const replyMessage = (product) =>
  product
    ? `${product.name} by ${product.brand} is just what you need — only ₹${product.price}. ` +
      `Available in ${product.colors.length ? product.colors.join(', ') : 'multiple colors'}` +
      `${product.sizes.length ? ` in sizes ${product.sizes.join(', ')}` : ''}. Check it out in the shop!`
    : 'I have a curated pick in mind — open the catalog and search for your category to see our latest collection.';

const staticReply = async (message) => {
  const text = ` ${message}`.toLowerCase();

  if (/(shift|dress)/.test(text)) {
    const p = await findRecommendations('Dress');
    return `For a chic dress look, ${replyMessage(p)}`;
  }
  if (/(jean|denim)/.test(text)) {
    const p = await findRecommendations('Jeans');
    return `Denim never goes out of style. ${p ? replyMessage(p) : 'Browse our Jeans collection for the perfect fit.'}`;
  }
  if (/(sneaker|shoe|footwear)/.test(text)) {
    const p = await findRecommendations('Sneakers');
    return `Step up your game! ${p ? replyMessage(p) : 'Our Sneaker line is freshly restocked — take a look.'}`;
  }
  if (/(hoodie|sweater)/.test(text)) {
    const p = await findRecommendations('Hoodies');
    return `Cozy vibes incoming. ${p ? replyMessage(p) : 'Check out our Hoodie edit for warm, street-ready picks.'}`;
  }
  if (/(jacket|coat|outer)/.test(text)) {
    const p = await findRecommendations('Jackets');
    return `Layering is key. ${p ? replyMessage(p) : 'Our Jacket collection has you covered this season.'}`;
  }
  if (/(accessor|bag|belt|watch|jewel)/.test(text)) {
    const p = await findRecommendations('Accessories');
    return `A good accessory completes the fit. ${p ? replyMessage(p) : 'Explore the Accessories section for finishing touches.'}`;
  }
  if (/(t-?shirt|tee|casual top)/.test(text)) {
    const p = await findRecommendations('T-Shirts');
    return `Essential tees done right. ${p ? replyMessage(p) : 'Our T-Shirt range is perfect for everyday wear.'}`;
  }
  if (/(summer|beach|light)/.test(text)) {
    const p = await findRecommendations(['T-Shirts', 'Dresses']);
    return `Summer edit: breathable fabrics, easy silhouettes. ${replyMessage(p)}`;
  }
  if (/(winter|cold|warm)/.test(text)) {
    const p = await findRecommendations(['Jackets', 'Hoodies']);
    return `Winter-ready layering starts here. ${replyMessage(p)}`;
  }
  if (/(formal|office|work)/.test(text)) {
    const p = await findRecommendations(['Jackets', 'Dresses']);
    return `For a polished look, consider smart outerwear with clean tailoring. ${replyMessage(p)}`;
  }
  if (/(hi|hello|hey)/.test(text)) {
    return 'Hey! I\u2019m your STYLIO stylist. Tell me what you\u2019re looking for \u2014 dresses, denim, sneakers, outerwear, accessories \u2014 and I\u2019ll point you to the right picks.';
  }
  if (/(price|budget|cheap|affordable)/.test(text)) {
    const budget = parseInt(text.replace(/[^\d]/g, ''), 10);
    if (budget) {
      const p = await Product.findOne({ active: true, price: { $lte: budget } }).sort({ price: -1 });
      return p
        ? `Within your ₹${budget} budget, ${p.name} at ₹${p.price} is my top pick.`
        : `We don\u2019t have anything under ₹${budget} right now, but our sale section updates weekly.`;
    }
    return 'Set a budget number and I\u2019ll find the best match at that price point.';
  }

  // Hinglish & Indian cultural styling triggers
  if (/(shaadi|wedding|party|sangeet|reception|tyohar|festival)/.test(text)) {
    const p = await findRecommendations(['Dresses', 'Jackets', 'Accessories']);
    return `Special occasion ke liye tailored statement piece best rahega! ${p ? replyMessage(p) : 'Hamara festive aur evening collection check kijiye.'}`;
  }
  if (/(college|casual|daily|dost|hangout)/.test(text)) {
    const p = await findRecommendations(['T-Shirts', 'Jeans', 'Sneakers']);
    return `Casual daily drip ke liye relaxed silhouettes perfect hain: ${p ? replyMessage(p) : 'Check out our everyday staples in Shop!'}`;
  }
  if (/(kya pehnu|batao|dikhao|kaisa|sugest|suggest)/.test(text)) {
    const p = await Product.findOne({ active: true }).sort({ createdAt: -1 });
    return `Bilkul! Current trending pieces me se ${replyMessage(p)} Aap bataiye aapko western, formal ya street style pasand hai?`;
  }
  if (/(sasta|budget|kam dam|pocket friendly)/.test(text)) {
    const p = await Product.findOne({ active: true }).sort({ price: 1 });
    return p
      ? `Pocket-friendly luxury me hamara top pick hai ${p.name} sirf ₹${p.price} me!`
      : 'Hamare shop section me price filter laga ke aap best budget deals dekh sakte hain.';
  }

  const popular = await Product.findOne({ active: true }).sort({ createdAt: -1 });
  return `Great pick! ${replyMessage(popular)} Or tell me more about your occasion, style preference, or budget.`;
};

const buildCatalogContext = async () => {
  const products = await Product.find({ active: true })
    .sort({ createdAt: -1 })
    .limit(25)
    .select('name brand category price colors sizes');
  if (!products.length) return null;

  const byCategory = {};
  const allNames = [];
  for (const p of products) {
    (byCategory[p.category] = byCategory[p.category] || []).push(
      `${p.name} (${p.brand}) — ₹${p.price}`
    );
    allNames.push(p.name);
  }

  const lines = ['Available pieces in the STYLIO store:'];
  Object.keys(byCategory).forEach((cat) => {
    const items = byCategory[cat].slice(0, 6).join('; ');
    lines.push(`- ${cat}: ${items || 'various pieces'}`);
  });
  if (allNames.length) {
    const prices = products.filter((p) => p.price > 0).map((p) => p.price);
    if (prices.length) {
      lines.push(
        `Price range: ₹${Math.min(...prices)} to ₹${Math.max(...prices)}.`
      );
    }
  }
  return lines.join('\n');
};

export const chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ status: 400, message: 'message is required' });
    return;
  }

  let reply;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    try {
      const catalog = await buildCatalogContext();
      reply = await groqChat({ message, history, catalog, signal: controller.signal });
    } catch (err) {
      reply = null;
    }
    if (!reply) {
      try {
        const ml = await apiClient.post('/api/ml/chat', { message }, { signal: controller.signal });
        reply = ml.reply || ml.message || null;
      } catch (err) {
        reply = null;
      }
    }
    if (!reply) {
      reply = await staticReply(message);
    }
  } finally {
    clearTimeout(timeout);
  }

  res.status(200).json({ reply });
});