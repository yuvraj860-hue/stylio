import Product from '../models/Product.js';
import apiClient from '../utils/apiClient.js';
import asyncHandler from '../utils/asyncHandler.js';

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

  const popular = await Product.findOne({ active: true }).sort({ createdAt: -1 });
  return `Great pick! ${replyMessage(popular)} Or tell me more about the occasion, style, and budget.`;
};

export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ status: 400, message: 'message is required' });
    return;
  }

  let reply;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    try {
      const ml = await apiClient.post('/api/ml/chat', { message }, { signal: controller.signal });
      reply = ml.reply || ml.message || null;
    } catch (err) {
      reply = null;
    }
    if (!reply) {
      reply = await staticReply(message);
    }
  } finally {
    clearTimeout(timeout);
  }

  res.status(200).json({ reply });
});