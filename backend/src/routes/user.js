import { Router } from 'express';
import { getWishlist, toggleWishlist } from '../controllers/userController.js';
import { clerkAuth } from '../middleware/clerkAuth.js';
import { validateId } from '../middleware/validate.js';

const router = Router();

router.use(clerkAuth);

router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', validateId('productId'), toggleWishlist);

export default router;
