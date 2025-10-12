# Flavi Dairy Solutions - Supplier Portal
## Complete Project Overview

---

## 🎯 Project Summary

A comprehensive Next.js-based supplier management portal that enables dairy product suppliers to register, manage their products, and leverage AI-powered search through Cloudflare AutoRAG integration. The system handles file uploads to Cloudflare R2, automatic product indexing, and provides analytics on product visibility.

**Domain**: `supplier.flavidairysolution.com`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
│  • React Server Components + Client Components               │
│  • App Router for routing                                    │
│  • Tailwind CSS for styling                                  │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                   API Layer (Next.js API Routes)             │
│  • /api/auth/* - Authentication endpoints                    │
│  • /api/products/* - Product CRUD operations                 │
│  • /api/supplier/* - Supplier profile management             │
│  • /api/analytics - Analytics data                           │
└───────────┬──────────────┬──────────────┬───────────────────┘
            │              │              │
┌───────────▼─────┐ ┌─────▼─────┐ ┌──────▼──────┐
│   MongoDB       │ │ Cloudflare │ │  Cloudflare │
│   (Prisma)      │ │     R2     │ │  AutoRAG    │
│                 │ │  Storage   │ │   Search    │
│ • Suppliers     │ │            │ │             │
│ • Products      │ │ • Images   │ │ • Vectors   │
│ • Sessions      │ │ • PDFs     │ │ • Metadata  │
│ • Tokens        │ │            │ │ • Chunks    │
└─────────────────┘ └────────────┘ └─────────────┘
```

---

## 📋 Features Breakdown

### 1. Authentication & Authorization
- **Email/Password Signup**: User registration with validation
- **Email Verification**: Token-based email verification system
- **Session Management**: JWT-based sessions via NextAuth.js
- **Protected Routes**: Middleware-based route protection
- **Single Role System**: All users have "supplier" role

### 2. Onboarding Flow
```
Signup → Email Verification → Onboarding Form → Dashboard
```
- Company name, phone, address collection
- Optional company description
- Profile completion tracking

### 3. Product Management

#### Add Product
- **Text Fields**:
  - Title (required)
  - Description (required)
  - Specifications (optional)
  - Tags (comma-separated)

- **File Uploads**:
  - Multiple images (JPEG, PNG)
  - Multiple PDFs (catalogs, manuals)
  - Real-time preview
  - File size validation

- **Backend Process**:
  1. Validate form data
  2. Upload files to R2 → Get URLs
  3. Save product to MongoDB
  4. Chunk product content
  5. Ingest to AutoRAG with metadata

#### Edit Product
- Update text fields
- Add new images/PDFs
- Remove existing files
- Re-index in AutoRAG

#### Delete Product
- Remove from database
- Delete files from R2
- Remove from AutoRAG index

### 4. Cloudflare R2 Integration

**Purpose**: Store product images and PDF files

**Implementation** (`src/lib/r2.ts`):
```typescript
- uploadToR2(file, filename, contentType) → URL
- deleteFromR2(key)
- getPresignedUrl(key, expiresIn)
```

**File Naming**: `suppliers/{timestamp}-{filename}`

**Configuration**:
- Bucket: `chat-flavi`
- Endpoint: Account-specific R2 endpoint
- Public URL: Custom domain or R2.dev subdomain

### 5. Cloudflare AutoRAG Integration

**Purpose**: Enable AI-powered product search

**Process** (`src/lib/autorag.ts`):

1. **Chunking** (300-600 tokens):
```typescript
chunkText(fullProductText) → chunks[]
```

2. **Metadata Attachment**:
```typescript
{
  productId: string,
  supplierId: string,
  title: string,
  tags: string[],
  imageUrls: string[],
  fileUrls: string[],
  timestamp: number,
  folder: "products/{supplierId}/",
  context: string
}
```

3. **Ingestion**:
```typescript
ingestToAutoRAG(chunks) → indexed in Cloudflare
```

4. **Search** (External):
```typescript
// Customer-facing app queries AutoRAG
autorag.search({
  query: "dairy cream products",
  filters: { folder: "products/" }
})
```

**Benefits**:
- Semantic search capabilities
- Metadata filtering
- Relevance scoring
- Match tracking for analytics

### 6. Analytics Dashboard

**Metrics Tracked**:
- Total products
- Approved products
- Pending products
- Total search matches
- Product views

**Data Sources**:
- MongoDB for product counts
- AutoRAG search logs for matches
- Custom tracking for views

**Display**:
- Summary cards with icons
- Product performance table
- Sort by matches (most relevant first)

### 7. Settings & Profile

**Editable Fields**:
- Company name
- Phone number
- Business address
- Company description

**Read-Only Fields**:
- Name
- Email
- Member since date
- Verification status

---

## 🗄️ Database Schema

### Supplier Collection
```prisma
model Supplier {
  id          String   @id @default(auto()) @db.ObjectId
  name        String
  email       String   @unique
  password    String   // Hashed with bcrypt
  verified    Boolean  @default(false)
  companyName String?
  phone       String?
  address     String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  products    Product[]
}
```

### Product Collection
```prisma
model Product {
  id          String   @id @default(auto()) @db.ObjectId
  supplierId  String   @db.ObjectId
  supplier    Supplier @relation(fields: [supplierId], references: [id])
  title       String
  description String
  specs       String?
  tags        String[]
  imageUrls   String[]  // R2 URLs
  fileUrls    String[]  // R2 URLs
  isApproved  Boolean   @default(false)
  viewCount   Int       @default(0)
  matchCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 🔐 Security Implementation

### 1. Password Security
- **Hashing**: bcrypt with salt rounds: 12
- **Storage**: Never store plain text
- **Validation**: Minimum 8 characters

### 2. Email Verification
- **Token Generation**: 32-byte random hex
- **Expiration**: 24 hours
- **Single Use**: Token deleted after use

### 3. Session Management
- **JWT Tokens**: Signed with NEXTAUTH_SECRET
- **HTTP-Only Cookies**: Prevent XSS attacks
- **Secure Flag**: HTTPS in production

### 4. Route Protection
- **Middleware**: Check authentication before route access
- **API Guards**: Verify session in API routes
- **Role-Based**: Future-ready for role expansion

### 5. File Upload Security
- **Type Validation**: Check MIME types
- **Size Limits**: Configurable max file size
- **Virus Scanning**: Ready for integration
- **Signed URLs**: Temporary access to private files

---

## 📡 API Reference

### Authentication APIs

#### POST `/api/auth/signup`
```typescript
Request: {
  name: string,
  email: string,
  password: string
}

Response: {
  message: string,
  supplierId: string
}
```

#### GET `/api/auth/verify?token={token}`
```typescript
Response: Redirect to /onboarding or error
```

### Product APIs

#### POST `/api/products/add`
```typescript
Request: FormData {
  title: string,
  description: string,
  specs?: string,
  tags: string,  // comma-separated
  images: File[],
  files: File[]
}

Response: {
  message: string,
  product: Product
}
```

#### GET `/api/products/list`
```typescript
Response: {
  products: Product[]
}
```

#### GET `/api/products/{id}`
```typescript
Response: {
  product: Product
}
```

#### PATCH `/api/products/{id}`
```typescript
Request: FormData {
  title?: string,
  description?: string,
  specs?: string,
  tags?: string,
  newImages?: File[],
  newFiles?: File[],
  deletedImages?: string,  // comma-separated URLs
  deletedFiles?: string
}

Response: {
  message: string,
  product: Product
}
```

#### DELETE `/api/products/{id}`
```typescript
Response: {
  message: string
}
```

### Supplier APIs

#### GET `/api/supplier/profile`
```typescript
Response: {
  supplier: Supplier
}
```

#### PATCH `/api/supplier/profile`
```typescript
Request: {
  companyName: string,
  phone: string,
  address: string,
  description: string
}

Response: {
  message: string,
  supplier: Supplier
}
```

### Analytics APIs

#### GET `/api/analytics`
```typescript
Response: {
  summary: {
    totalProducts: number,
    approvedProducts: number,
    pendingProducts: number,
    totalMatches: number,
    totalViews: number
  },
  products: Product[]
}
```

---

## 🎨 UI/UX Design Principles

### Color Scheme
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Neutral**: Gray scale

### Components
- **Cards**: White background, shadow, rounded corners
- **Buttons**: Gradient primary, clear secondary
- **Forms**: Clear labels, validation feedback
- **Icons**: Lucide React for consistency
- **Responsive**: Mobile-first design

### User Experience
- **Loading States**: Clear loading indicators
- **Error Messages**: Specific, actionable feedback
- **Success Feedback**: Confirmation messages
- **Empty States**: Helpful CTAs
- **Progressive Disclosure**: Show info as needed

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Set all environment variables
- [ ] Test email sending
- [ ] Verify R2 uploads
- [ ] Test AutoRAG ingestion
- [ ] Run production build locally
- [ ] Check for console errors

### Vercel Deployment
1. Connect GitHub repository
2. Configure environment variables
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Deploy

### Post-Deployment
- [ ] Test signup flow
- [ ] Test email verification
- [ ] Test product upload
- [ ] Verify R2 files accessible
- [ ] Check AutoRAG indexing
- [ ] Monitor error logs

---

## 🔧 Maintenance & Monitoring

### Regular Tasks
- **Weekly**: Check error logs
- **Monthly**: Review analytics
- **Quarterly**: Security audit
- **As Needed**: Dependency updates

### Monitoring Points
- API response times
- File upload success rates
- Email delivery rates
- AutoRAG indexing success
- User registration flow

### Backup Strategy
- Database: Daily automated backups
- R2 Files: Versioning enabled
- Code: Git version control

---

## 🎓 Learning Resources

### Technologies Used
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Guide](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)
- [Cloudflare AutoRAG](https://developers.cloudflare.com/ai-search)

---

## 📞 Support & Contact

For questions or issues:
1. Check `README.md` for setup instructions
2. Review `SETUP.md` for detailed configuration
3. Check error logs in the application
4. Contact development team

---

## 📝 License

Proprietary - Flavi Dairy Solutions © 2025

---

**Built with modern web technologies for scalability and performance.**

