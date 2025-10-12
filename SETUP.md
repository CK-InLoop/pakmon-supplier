# Setup Guide - Flavi Dairy Solutions Supplier Portal

This guide will help you set up the Supplier Portal from scratch.

## Prerequisites

Before starting, make sure you have:

- ✅ Node.js 18 or higher installed
- ✅ npm or yarn package manager
- ✅ MongoDB database (MongoDB Atlas account or local MongoDB)
- ✅ Cloudflare account with R2 and AutoRAG access
- ✅ Email service (Gmail, SendGrid, etc.) for sending verification emails

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd supplier-flav

# Install dependencies
npm install
```

## Step 2: MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `supplier-portal`

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/supplier-portal?retryWrites=true&w=majority
```

### Option B: Local MongoDB

```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Windows
# Download from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod

# Connection string
mongodb://localhost:27017/supplier-portal
```

## Step 3: Cloudflare Setup

### R2 Storage Setup

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2** section
3. Create a new bucket named `chat-flavi`
4. Go to **Manage R2 API Tokens**
5. Create a new API token with:
   - Permissions: Object Read & Write
   - Apply to specific buckets: `chat-flavi`
6. Save the **Access Key ID** and **Secret Access Key**

### AutoRAG Setup

1. In Cloudflare Dashboard, go to **AI** section
2. Navigate to **AutoRAG** (or AI Search)
3. Create a new index named `my-autorag`
4. Note your Account ID (found in the URL or dashboard)
5. Create an API token with AutoRAG permissions:
   - Go to **My Profile** → **API Tokens**
   - Create token with **AutoRAG** permissions
   - Save the token

### Public URL Configuration

1. In R2 settings, enable public access or create a custom domain
2. Note the public URL for your bucket (e.g., `https://pub-xxxxx.r2.dev`)

## Step 4: Email Service Setup

### Using Gmail

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password

### Using SendGrid (Alternative)

1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Verify your sender email
4. Use these settings:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - User: `apikey`
   - Password: Your SendGrid API key

## Step 5: Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/supplier-portal?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-using-command-below"

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password-here"
EMAIL_FROM="noreply@flavidairysolution.com"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="chat-flavi"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# Cloudflare AutoRAG
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
CLOUDFLARE_AUTORAG_INDEX="my-autorag"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output and paste it as `NEXTAUTH_SECRET` in your `.env` file.

## Step 6: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

## Step 7: Run the Application

```bash
# Development mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

1. **Create an account**:
   - Go to `/signup`
   - Fill in your details
   - Submit the form

2. **Verify email**:
   - Check your email inbox
   - Click the verification link
   - Complete onboarding

3. **Add a product**:
   - Navigate to Products
   - Click "Add Product"
   - Fill in product details
   - Upload images and PDFs
   - Submit

4. **Check analytics**:
   - Go to Analytics page
   - View product statistics

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db push
```

If you see errors:
- ✅ Check your DATABASE_URL format
- ✅ Verify database credentials
- ✅ Ensure network access is allowed (for Atlas)
- ✅ Check if database user has correct permissions

### Email Not Sending

1. Check SMTP credentials
2. For Gmail: Ensure App Password is used (not regular password)
3. Check firewall settings
4. Verify EMAIL_FROM is valid
5. Check spam folder

### File Upload Errors

1. Verify R2 credentials are correct
2. Check bucket permissions
3. Ensure bucket name matches
4. Verify endpoint URL format

### AutoRAG Ingestion Fails

1. Check API token permissions
2. Verify account ID
3. Ensure index exists
4. Check Cloudflare dashboard for limits

## Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables (same as `.env`)
4. Update `NEXTAUTH_URL` to your production domain
5. Deploy

### Environment Variables for Production

Update these in your hosting platform:
- `NEXTAUTH_URL` → Your production domain
- `R2_PUBLIC_URL` → Your production R2 public URL
- Keep all other credentials secure and private

## Next Steps

1. **Customize branding**: Update colors, logos, and text
2. **Add admin panel**: Create admin routes for product approval
3. **Set up monitoring**: Add error tracking (Sentry, etc.)
4. **Configure backups**: Set up database backups
5. **Add analytics**: Integrate Google Analytics or similar

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Regular security updates
- [ ] Monitor API usage
- [ ] Set up logging and monitoring

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review error logs
- Contact the development team

---

**Happy coding! 🚀**

