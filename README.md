# Chibi Vulture - Premium Art Community

A modern, secure, and accessible social platform for artists to share their work, connect with other creators, and sell unique products.

## 🚀 Features

### Core Features
- **Social Feed**: Share and discover art with double-tap to like
- **E-commerce**: Buy and sell art products with cart & checkout
- **Messaging**: Real-time chat between users
- **Admin Dashboard**: User management, order tracking, and moderation
- **Role-based Access**: Guest, Member, Artist, and Admin roles

### Technical Features
- **PWA**: Offline support with service worker
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Animations**: Smooth transitions with Framer Motion
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## 🔒 Security Improvements

### API Security
| Feature | Description | Location |
|---------|-------------|----------|
| **Rate Limiting** | Brute force protection on login/signup | `api/_lib/rateLimit.js` |
| **CORS** | Secure cross-origin configuration | `api/_lib/cors.js` |
| **Input Validation** | Strict validation on all API endpoints | All `api/*.js` files |
| **SQL Injection Protection** | Whitelist-based field validation | `api/users.js` |
| **JWT Security** | No fallback secret, 7-day expiration | `api/_lib/auth.js` |
| **Audit Logging** | Structured logging with database storage | `api/_lib/logger.js` |

### Rate Limits
- **Login**: 5 attempts per 15 minutes
- **Signup**: 3 attempts per hour
- **API General**: 100 requests per minute

## 🧪 Testing

### Setup
```bash
npm install
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run with coverage report
```

### Test Structure
```
src/__tests__/
├── setupTests.ts           # Test configuration
├── components/             # Component tests
│   └── ErrorBoundary.test.tsx
└── lib/
    └── utils.test.ts       # Utility tests
```

## 📱 PWA Configuration

The app is configured as a Progressive Web App with:
- Service Worker for offline caching
- Web App Manifest for installability
- Background sync for offline posts
- Push notification support

## 🌐 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database Configuration (Neon PostgreSQL)
# IMPORTANT: Do NOT use VITE_ prefix — that exposes the connection string to the browser bundle
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Optional: For local development
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=INFO
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Push to `main` branch for auto-deployment

### CI/CD Pipeline
The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit testing (Jest)
- Security scanning (CodeQL)
- Automatic preview deployments
- Production deployment on merge to main

## 📊 Project Structure

```
chibi-v-store-expo-main/
├── api/                    # Serverless API endpoints
│   ├── _lib/              # Shared utilities
│   │   ├── auth.js        # JWT authentication
│   │   ├── cors.js        # CORS configuration
│   │   ├── db.js          # Database connection
│   │   ├── logger.js      # Structured logging
│   │   └── rateLimit.js   # Rate limiting
│   ├── users.js           # User management
│   ├── posts.js           # Post CRUD
│   ├── products.js        # Product management
│   ├── orders.js          # Order processing
│   ├── likes.js           # Like system
│   ├── follows.js         # Follow system
│   └── messages.js        # Messaging
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   ├── admin/        # Admin components
│   │   └── ErrorBoundary.tsx
│   ├── context/          # React Context (AppContext)
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── services/         # API client
│   ├── utils/            # Utilities
│   └── __tests__/        # Test files
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
└── .github/workflows/    # CI/CD configuration
```

## 🛡️ Security Checklist

- ✅ SQL Injection protection (whitelist fields)
- ✅ XSS protection (React sanitization)
- ✅ CSRF protection (CORS configuration)
- ✅ Rate limiting on auth endpoints
- ✅ Input validation on all APIs
- ✅ Secure JWT implementation
- ✅ HTTPS enforcement (Vercel default)
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ Error boundary for crash protection
- ✅ Audit logging

## 📝 License

MIT License - feel free to use this project for your own applications.

---

Built with ❤️ using React, TypeScript, Tailwind CSS, and Vercel.

