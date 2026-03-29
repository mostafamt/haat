# Haat (هات) — Digital Village Kitchen

A mobile-first food delivery web app for a local grilled chicken business.
Customers browse the menu, build a cart, and place orders via WhatsApp — all saved to Firebase in real time.

---

## Business Model

### Concept
Haat bridges the gap between a local village kitchen and digital ordering. There is no complex payment gateway — the order flows directly to the business owner's WhatsApp as a formatted invoice, keeping operations simple and familiar.

### Revenue Flow
```
Customer places order → WhatsApp message sent to owner → Owner confirms & delivers → Payment on delivery
```

### Target Audience
- Local residents ordering grilled chicken for home delivery
- Mobile-first users (the UI is optimized for phones)

### Menu & Pricing
| Item | Price | Includes |
|---|---|---|
| دجاجة كاملة (Full Chicken) | 240 EGP | Rice, Salad, Tahini, Bread |
| نص دجاجة (Half Chicken) | 130 EGP | Rice, Salad, Tahini, Bread |
| ربع دجاجة (Quarter Chicken) | 70 EGP | Rice, Salad, Tahini, Bread |

### Extras
| Item | Price |
|---|---|
| بيبسي (Pepsi) | 20 EGP |
| شيبسي (Chipsy) | 15 EGP |
| أرز إضافي (Extra Rice) | 20 EGP |
| سلطة إضافية (Extra Salad) | 15 EGP |

### Order Lifecycle
```
pending  →  done (تم التسليم)
```
The admin marks an order as done after delivery from the `/admin` dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite 5 |
| Styling | Tailwind CSS v3 (RTL) |
| Icons | Lucide React |
| Database | Firebase Firestore |
| Notifications | WhatsApp Web API (`wa.me`) |
| Deployment | Vercel |

---

## Project Structure

```
haat/
├── docs/
│   └── README.md               # This file
├── public/
├── src/
│   ├── components/
│   │   ├── Hero.jsx            # Landing banner with CTA button
│   │   ├── MenuCard.jsx        # Product card with +/- quantity controls
│   │   ├── CartBar.jsx         # Sticky bottom bar showing cart total
│   │   └── CheckoutModal.jsx   # Order form + Firebase save + WhatsApp trigger
│   ├── data/
│   │   └── menuItems.js        # Static menu items and extras arrays
│   ├── pages/
│   │   ├── Home.jsx            # Customer-facing page (menu + cart)
│   │   └── Admin.jsx           # Owner dashboard at /admin
│   ├── firebase.js             # Firebase app init using env vars
│   ├── App.jsx                 # Router (/ and /admin)
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind directives
├── .env                        # Firebase keys and WhatsApp number (not committed)
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## Data Model

### Firestore Collection: `orders`

Each document represents one customer order.

| Field | Type | Description |
|---|---|---|
| `name` | string | Customer full name |
| `address` | string | Detailed delivery address |
| `phone` | string | Egyptian mobile number (01xxxxxxxxx) |
| `items` | array | List of ordered items (id, name, price, quantity) |
| `total` | number | Total price in EGP |
| `status` | string | `"pending"` on creation, `"done"` after delivery |
| `timestamp` | timestamp | Firestore server timestamp |

### Item object (inside `items` array)
```json
{
  "id": 1,
  "name": "دجاجة كاملة",
  "price": 240,
  "quantity": 2
}
```

---

## Application Flow

### Customer Journey
```
1. Opens the app  →  Hero section loads
2. Taps "اطلب الآن"  →  Page scrolls to menu
3. Adds items to cart  →  Sticky cart bar appears at bottom
4. Taps cart bar  →  Checkout modal slides up
5. Fills name, address, phone  →  Taps confirm
6. Order saved to Firestore  →  WhatsApp opens with pre-filled invoice
```

### Admin Journey
```
1. Opens /admin  →  Real-time list of all orders (newest first)
2. Reviews order details  →  Name, phone, address, items, total
3. Delivers order  →  Taps "تم التسليم" button
4. Order status updated to "done" in Firestore
```

---

## Environment Variables

Create a `.env` file at the project root:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_WHATSAPP_NUMBER=201xxxxxxxxx
```

> All variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

---

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** (start in test mode or apply the rules below)
3. Copy your web app config into `.env`

### Recommended Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: true;
      allow read, update: true;
    }
  }
}
```

---

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add all `VITE_*` environment variables in the Vercel project settings
4. Deploy — Vercel auto-detects Vite

---

## WhatsApp Message Format

After a successful order save, the app opens:
```
https://wa.me/{VITE_WHATSAPP_NUMBER}?text=...
```

The pre-filled message looks like:
```
🍗 طلب جديد من هات

👤 الاسم: محمد أحمد
📍 العنوان: شارع النيل، أمام المسجد
📞 الهاتف: 01012345678

📋 الطلب:
- دجاجة كاملة x1 = 240 جنيه
- بيبسي x2 = 40 جنيه

💰 الإجمالي: 280 جنيه
```
