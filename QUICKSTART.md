# 🚀 Quick Start Guide

Get up and running with the Supplier Portal in 5 minutes!

## Prerequisites Check

```bash
node --version    # Should be 18+
npm --version     # Should be 9+
```

## 1. Install Dependencies (1 min)

```bash
npm install
```

## 2. Configure Environment (2 min)

Copy `.env.example` to `.env` and fill in:

```bash
# Minimum required for local development:
DATABASE_URL="mongodb://localhost:27017/supplier-portal"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
R2_BUCKET_NAME="chat-pakmon"
# ... (fill in R2 and Cloudflare details)
```

## 3. Setup Database (1 min)

```bash
npm run prisma:generate
npm run prisma:push
```

## 4. Start Development Server (< 1 min)

```bash
npm run dev
```

Visit: http://localhost:3000

## 🎯 Test the Flow

### 1. Create Account
- Go to `/signup`
- Enter: Name, Email, Password
- Click "Sign Up"

### 2. Verify Email
- Check your email inbox
- Click verification link
- Gets redirected to onboarding

### 3. Complete Onboarding
- Fill company details
- Click "Complete Setup"
- Redirected to dashboard

### 4. Add Product
- Click "Add Product"
- Fill product details
- Upload images/PDFs
- Click "Create Product"

### 5. View Analytics
- Go to Analytics page
- See product statistics

## 📂 Key Files Reference

```
src/
├── app/
│   ├── api/
│   │   ├── auth/signup/route.ts        # User registration
│   │   ├── auth/verify/route.ts        # Email verification
│   │   ├── products/add/route.ts       # Add product
│   │   ├── products/list/route.ts      # List products
│   │   └── products/[id]/route.ts      # Edit/Delete product
│   ├── dashboard/
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── products/page.tsx           # Products list
│   │   ├── products/add/page.tsx       # Add product form
│   │   ├── analytics/page.tsx          # Analytics
│   │   └── settings/page.tsx           # Settings
│   ├── signup/page.tsx                 # Signup page
│   ├── login/page.tsx                  # Login page
│   └── onboarding/page.tsx             # Onboarding
├── lib/
│   ├── auth.ts                         # NextAuth config
│   ├── prisma.ts                       # Database client
│   ├── r2.ts                           # R2 upload utils
│   ├── autorag.ts                      # AutoRAG integration
│   └── email.ts                        # Email sending
└── components/
    └── dashboard-layout.tsx            # Dashboard layout
```

## 🔑 Environment Variables Cheat Sheet

| Variable | Example | Purpose |
|----------|---------|---------|
| DATABASE_URL | mongodb://... | MongoDB connection |
| NEXTAUTH_SECRET | abc123... | JWT signing key |
| EMAIL_SERVER_HOST | smtp.gmail.com | SMTP server |
| R2_BUCKET_NAME | chat-pakmon | R2 bucket name |
| CLOUDFLARE_API_TOKEN | xxx | AutoRAG access |

## 🐛 Common Issues & Fixes

### Issue: Database connection fails
```bash
# Fix: Check MongoDB is running
mongod  # Start MongoDB locally
# Or verify MongoDB Atlas connection string
```

### Issue: Email not sending
```bash
# Fix: Use Gmail App Password, not regular password
# 1. Enable 2FA in Google Account
# 2. Generate App Password
# 3. Use in EMAIL_SERVER_PASSWORD
```

### Issue: Build errors
```bash
# Fix: Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Issue: Prisma client errors
```bash
# Fix: Regenerate Prisma client
npm run prisma:generate
```

## 🎨 Customization Quick Wins

### Change Primary Color
```css
/* src/app/globals.css */
/* Replace purple-600 with your color */
```

### Update Logo
```tsx
/* src/components/dashboard-layout.tsx */
<h1>Your Company Name</h1>
```

### Add New Page
```bash
# Create: src/app/dashboard/your-page/page.tsx
# Add to: src/components/dashboard-layout.tsx navigation
```

## 📚 Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npm run prisma:generate        # Generate Prisma client
npm run prisma:push           # Push schema to DB
npm run prisma:studio         # Open Prisma Studio

# Debugging
npx prisma db push --accept-data-loss  # Force schema update
npx next build                 # Check for build errors
```

## 🔍 Where to Find Things

**Authentication**: `src/lib/auth.ts` + `src/app/api/auth/`

**Product Management**: `src/app/api/products/` + `src/app/dashboard/products/`

**File Uploads**: `src/lib/r2.ts`

**AutoRAG**: `src/lib/autorag.ts`

**Database Schema**: `prisma/schema.prisma`

**Styling**: `src/app/globals.css` (Tailwind)

## 🎯 Next Steps

1. ✅ Get app running locally
2. ✅ Test full user flow
3. ⬜ Customize branding
4. ⬜ Add admin features
5. ⬜ Deploy to production

## 💡 Pro Tips

- Use `npm run prisma:studio` to view/edit database
- Check browser console for errors
- Use React DevTools for component debugging
- Monitor Network tab for API calls
- Check email spam folder for verification emails

## 🆘 Need Help?

1. **Documentation**: Check `README.md` and `SETUP.md`
2. **Errors**: Look at terminal and browser console
3. **Database**: Use Prisma Studio to inspect data
4. **API**: Test endpoints with Postman/Insomnia

---

**Happy coding! 🚀**

For detailed information, see:
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup guide
- `PROJECT_OVERVIEW.md` - Architecture details


