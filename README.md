# Flavi Dairy Solutions - Supplier Portal

A Next.js-based supplier portal for Flavi Dairy Solutions that enables suppliers to manage their products with AI-powered search capabilities through Cloudflare AutoRAG.

## 🚀 Features

- **Authentication & Authorization**
  - Email/password signup with email verification
  - Secure session management with NextAuth.js
  - Single supplier role system

- **Onboarding**
  - Guided profile setup for new suppliers
  - Company information collection

- **Product Management**
  - Add products with multiple images (JPEG, PNG)
  - Upload PDF documents (catalogs, manuals)
  - Rich text fields (title, description, specifications, tags)
  - Edit and delete products
  - Product approval workflow (pending/approved status)

- **Cloudflare Integration**
  - **R2 Storage**: Automatic file uploads to Cloudflare R2
  - **AutoRAG**: Automatic product indexing for AI-powered search
  - Vector embeddings with metadata for enhanced discoverability

- **Analytics Dashboard**
  - Track product visibility and matches
  - View product performance metrics
  - Summary statistics

- **Settings & Profile**
  - Update company information
  - Manage contact details

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js v5
- **File Storage**: Cloudflare R2 (AWS S3 compatible)
- **AI Search**: Cloudflare AutoRAG
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Email**: Nodemailer

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)
- Cloudflare account with:
  - R2 storage bucket
  - AutoRAG index configured
  - API tokens
- Email service (SMTP credentials)

## 🔧 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd supplier-flav
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/supplier-portal?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-using-openssl-rand-base64-32"

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@flavidairysolution.com"

# Cloudflare R2
R2_ACCOUNT_ID="62823221dfff75d61e6a8dfc45ad4148"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="h47PMiKHD7TGU14JkBjJ3MCiYZgIGwOQ-qdRyL0E"
R2_BUCKET_NAME="chat-flavi"
R2_ENDPOINT="https://62823221dfff75d61e6a8dfc45ad4148.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-your-r2-public-domain.r2.dev"

# Cloudflare AutoRAG
CLOUDFLARE_ACCOUNT_ID="62823221dfff75d61e6a8dfc45ad4148"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
CLOUDFLARE_AUTORAG_INDEX="my-autorag"
```

4. **Generate Prisma Client**

```bash
npx prisma generate
```

5. **Run database migrations** (if using Prisma Migrate)

```bash
npx prisma db push
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
supplier-flav/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   ├── products/           # Product CRUD operations
│   │   │   ├── analytics/          # Analytics data
│   │   │   └── supplier/           # Supplier profile
│   │   ├── dashboard/              # Dashboard pages
│   │   │   ├── products/           # Product management
│   │   │   ├── analytics/          # Analytics page
│   │   │   └── settings/           # Settings page
│   │   ├── login/                  # Login page
│   │   ├── signup/                 # Signup page
│   │   ├── onboarding/             # Onboarding flow
│   │   └── page.tsx                # Landing page
│   ├── components/                 # React components
│   │   ├── dashboard-layout.tsx    # Dashboard layout with sidebar
│   │   └── providers.tsx           # Session provider wrapper
│   ├── lib/                        # Utility libraries
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── prisma.ts               # Prisma client
│   │   ├── r2.ts                   # Cloudflare R2 utilities
│   │   ├── autorag.ts              # AutoRAG integration
│   │   └── email.ts                # Email sending utilities
│   └── types/                      # TypeScript type definitions
├── prisma/
│   └── schema.prisma               # Database schema
├── public/                         # Static assets
├── package.json
└── tsconfig.json
```

## 🔐 Authentication Flow

1. **Signup**: User creates account with email/password
2. **Email Verification**: System sends verification email with token
3. **Verify**: User clicks link in email to verify account
4. **Onboarding**: User completes company profile
5. **Dashboard Access**: User can now access full dashboard

## 📦 Product Upload Flow

1. **Create Product**: Supplier fills product form with:
   - Title, description, specifications
   - Tags for categorization
   - Multiple images (JPEG/PNG)
   - PDF documents

2. **File Upload**: 
   - Files are uploaded to Cloudflare R2
   - Public URLs are generated and stored

3. **AutoRAG Ingestion**:
   - Product content is chunked (300-600 tokens)
   - Chunks are embedded with metadata:
     - Product ID, Supplier ID
     - Title, tags
     - Image URLs, file URLs
     - Timestamps
   - Indexed in Cloudflare AutoRAG for AI search

4. **Product Approval**: Admin reviews and approves products

## 🔍 Metadata Schema for AutoRAG

Each product chunk includes the following metadata for filtering and context:

```typescript
{
  productId: string,
  supplierId: string,
  title: string,
  tags: string[],
  imageUrls: string[],
  fileUrls: string[],
  timestamp: number,
  folder: string,
  context: string
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create supplier account
- `GET /api/auth/verify?token=xxx` - Verify email
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Products
- `POST /api/products/add` - Create product
- `GET /api/products/list` - List all products
- `GET /api/products/[id]` - Get single product
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Supplier
- `GET /api/supplier/profile` - Get profile
- `PATCH /api/supplier/profile` - Update profile

### Analytics
- `GET /api/analytics` - Get analytics data

## 🎨 UI Components

The application uses a modern, responsive design with:
- Gradient hero sections
- Card-based layouts
- Mobile-responsive sidebar navigation
- File upload with drag-and-drop support
- Image previews
- Status badges (approved/pending)
- Analytics charts and metrics

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based session management
- Email verification required before access
- Secure file upload validation
- Environment variable protection
- CORS and API rate limiting ready

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure Node.js 18+ support and configure environment variables accordingly.

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | MongoDB connection string | Yes |
| NEXTAUTH_URL | Application URL | Yes |
| NEXTAUTH_SECRET | Secret for JWT signing | Yes |
| EMAIL_SERVER_HOST | SMTP host | Yes |
| EMAIL_SERVER_PORT | SMTP port | Yes |
| EMAIL_SERVER_USER | SMTP username | Yes |
| EMAIL_SERVER_PASSWORD | SMTP password | Yes |
| EMAIL_FROM | From email address | Yes |
| R2_ACCOUNT_ID | Cloudflare account ID | Yes |
| R2_ACCESS_KEY_ID | R2 access key | Yes |
| R2_SECRET_ACCESS_KEY | R2 secret key | Yes |
| R2_BUCKET_NAME | R2 bucket name | Yes |
| R2_ENDPOINT | R2 endpoint URL | Yes |
| R2_PUBLIC_URL | R2 public URL | Yes |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare account ID | Yes |
| CLOUDFLARE_API_TOKEN | Cloudflare API token | Yes |
| CLOUDFLARE_AUTORAG_INDEX | AutoRAG index name | Yes |

## 🐛 Troubleshooting

### Email Verification Not Sending
- Check SMTP credentials
- Verify EMAIL_FROM is authorized
- Check spam folder

### File Upload Fails
- Verify R2 credentials
- Check bucket permissions
- Ensure file size limits

### AutoRAG Ingestion Errors
- Verify API token has correct permissions
- Check account ID and index name
- Review Cloudflare dashboard for errors

## 📄 License

This project is proprietary software for Flavi Dairy Solutions.

## 🤝 Support

For support, contact the development team or open an issue in the repository.

---

Built with ❤️ using Next.js, Cloudflare, and modern web technologies.
