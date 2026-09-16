# STYLIO Backend

Fashion e-commerce API built with Node.js, Express, MongoDB, and Stripe.

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/products | List products (filterable) | No |
| GET | /api/products/:id | Get product by ID | No |
| POST | /api/products | Create product | Admin |
| PUT | /api/products/:id | Update product | Admin |
| DELETE | /api/products/:id | Delete product | Admin |
| GET | /api/cart | Get cart | Yes |
| POST | /api/cart/items | Add item to cart | Yes |
| PUT | /api/cart/items/:id | Update cart item qty | Yes |
| DELETE | /api/cart/items/:id | Remove cart item | Yes |
| POST | /api/orders/checkout | Create payment intent | Yes |
| POST | /api/orders | Confirm order | Yes |
| GET | /api/orders | Get user orders | Yes |
| POST | /api/stylist/chat | Chat with stylist AI | No |

## Seed

`npm run seed` creates:
- Admin: admin@stylio.com / admin123
- 16 sample fashion products across categories
