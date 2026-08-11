# 🛍️ Nills Mart — Full-Stack E-Commerce Platform

A state-of-the-art, full-stack e-commerce web application tailored for beauty, skincare, and personal care products in Bangladesh. Built with **React**, **Vite**, **TanStack Router/Query**, **Tailwind CSS**, and a **FastAPI** Python asynchronous backend.

---

## ✨ Key Features

### 🛒 Storefront & Customer Experience
* **Executive Studio UI**: OKLCH color system, ambient studio mesh gradient backgrounds, and responsive mobile-first navigation.
* **Product Catalog & Search**: Instant real-time search, category filtering, brand selection, and skin concern filtering.
* **Product Detail Page (PDP)**: High-resolution product showcase, pricing discount pills (`-40% OFF`), customer reviews, and interactive Q&A form.
* **Slide-out Cart Drawer**: Real-time quantity management, subtotal calculation, and instant checkout drawer.
* **Checkout & BDT Delivery Calculation**: Dynamic shipping fee calculation (Inside Dhaka vs Outside Dhaka), promo voucher integration, and Cash-on-Delivery (COD).
* **Order Tracking (`/track`)**: Order lookup via Order Number and Mobile Number with live shipment status indicators.

### 🛡️ Executive Admin Console (`/admin`)
* **Sidebar Dashboard**: Executive sidebar navigation panel with animated hover micro-interactions.
* **📊 Analytics & Revenue Panel**: Real-time sales charts (Recharts), paid orders metrics, average order value (AOV), top products, and low-stock warnings.
* **🖼️ Promotional Banners**: Dynamic carousel slide editor and 4-tile homepage offer banner grid manager.
* **📦 Inventory & Product Catalog**: Full product CRUD operations, stock level controls, and **1-Click CSV Data Export**.
* **🛍️ Customer Orders Pipeline**: Order status lifecycle management (`PENDING` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED` & `PAID`) + **1-Click CSV Data Export**.
* **🎟️ Promotions & Coupon Manager**: Create fixed BDT or percentage discount promo codes (`SAVE20`) with minimum order thresholds.
* **💬 Reviews & Q&A Moderation**: Moderate buyer reviews and answer customer inquiries directly from the admin panel.
* **📁 Department Categories & Brands**: Centralized directory for department categories, subcategories, and official brand partner origins.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite |
| **Routing & State** | TanStack Router, TanStack Query (React Query) |
| **Styling & Icons** | Tailwind CSS v4, Lucide React, OKLCH Design Tokens |
| **Charts & Notifications** | Recharts, Sonner Toasts |
| **Backend API Framework** | Python 3.11+, FastAPI, Uvicorn |
| **Database & ORM** | Async SQLAlchemy 2.0, SQLite / PostgreSQL |
| **Authentication** | OAuth2 Password Bearer, PyJWT, Passlib (Bcrypt) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.11 or higher)
* **npm** or **pnpm**

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Seed initial store product catalog and banners
python scripts/seed_catalog.py

# Create the default administrator account
python scripts/create_admin_auto.py

# Start the FastAPI server
python -m uvicorn app.main:app --port 8000 --reload
```

Backend will run on `http://127.0.0.1:8000` (API documentation available at `http://127.0.0.1:8000/docs`).

---

### 2. Frontend Setup

```bash
# In the root directory, install npm packages
npm install

# Start the Vite development server
npm run dev
```

Frontend will run on `http://localhost:5173`.

---

## 🔑 Default Credentials

### Administrator Account
* **Email**: `admin@nillsmart.com`
* **Password**: `admin12345`
* **Dashboard URL**: `http://localhost:5173/admin`

---

## 📡 API Architecture Overview

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/v1/auth/login` | `POST` | User & Admin authentication |
| `/api/v1/auth/me` | `GET` | Retrieve authenticated user profile |
| `/api/v1/products` | `GET / POST` | Fetch product catalog & create new product |
| `/api/v1/products/{id}` | `PUT / DELETE` | Update product details & inventory stock |
| `/api/v1/orders/` | `POST` | Place customer order |
| `/api/v1/orders/track` | `GET` | Track order delivery & payment status |
| `/api/v1/orders/admin/list` | `GET` | Fetch all orders for admin processing |
| `/api/v1/feedback/promotions` | `POST / GET` | Create & validate coupon discount codes |
| `/api/v1/feedback/reviews` | `GET / POST` | Customer product reviews & Q&A |

---

## 📄 License & Author

Developed with ❤️ by **Mashkurul Alam Ohi**.
