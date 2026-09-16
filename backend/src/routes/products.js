import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import {
  listProducts,
  getProductById,
  getRelatedProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  uploadImage,
  indexExistingProducts,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validateId } from '../middleware/validate.js';

const router = Router();

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const ext = EXT_BY_MIME[file.mimetype] || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXT_BY_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/', listProducts);
router.get('/index-ml', protect, adminOnly, indexExistingProducts);
router.get('/:id/related', validateId('id'), getRelatedProducts);
router.get('/:id', validateId('id'), getProductById);

router.post(
  '/',
  protect,
  adminOnly,
  adminCreateProduct
);

router.post(
  '/:id/upload',
  protect,
  adminOnly,
  validateId('id'),
  upload.single('image'),
  uploadImage
);

router.put(
  '/:id',
  protect,
  adminOnly,
  validateId('id'),
  adminUpdateProduct
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  validateId('id'),
  adminDeleteProduct
);

export default router;