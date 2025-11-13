# R2 Custom Domain Implementation Summary

## ✅ Completed Tasks

### 1. Environment Configuration Documentation
- Created `UPDATE_R2_DOMAIN.md` with clear instructions for updating `.env` file
- Documented the exact change needed: `R2_PUBLIC_URL="https://cdn.flavidairysolution.com"`

### 2. Code Enhancements
- **Enhanced `src/lib/r2.ts`** with improved URL extraction logic:
  - `deleteFromR2()` - Now handles both custom domain and old R2 dev URLs robustly
  - `getImageUrl()` - Improved URL parsing for better compatibility
  - `getPdfUrl()` - Improved URL parsing for better compatibility
  - All functions now use proper URL parsing with fallbacks

### 3. Migration Script
- Created `scripts/migrate-r2-urls.ts` for migrating existing product URLs
- Added npm script: `npm run migrate:r2-urls`
- Script updates all existing product images and PDF URLs to use the new domain

### 4. Package Dependencies
- Added `tsx` to devDependencies for running TypeScript migration scripts

## 📋 Next Steps (Manual Actions Required)

### 1. Update .env File
Update your `.env` file:
```env
R2_PUBLIC_URL="https://cdn.flavidairysolution.com"
```

### 2. Restart Application
After updating `.env`, restart your Next.js application:
```bash
npm run dev
# or for production
npm run build && npm start
```

### 3. Test File Operations
- Upload a new product with images and PDFs
- Verify URLs in database use `cdn.flavidairysolution.com`
- Test product update (add/remove files)
- Test product deletion

### 4. (Optional) Run Migration
If you have existing products with old URLs, run the migration:
```bash
npm install  # Install tsx if not already installed
npm run migrate:r2-urls
```

## 🔍 Verification Checklist

After updating `.env` and restarting:

- [ ] New uploads use `cdn.flavidairysolution.com` in URLs
- [ ] Files are accessible via browser at the new domain
- [ ] Product updates work correctly (add/remove files)
- [ ] Product deletion removes files correctly
- [ ] Signed URLs still work for private access
- [ ] Existing products with old URLs still work (backward compatibility)

## 📝 Technical Details

### How It Works

1. **Upload (`uploadToR2`)**: 
   - Uploads file to R2 bucket
   - Returns URL: `${R2_PUBLIC_URL}/${key}`
   - With new config: `https://cdn.flavidairysolution.com/suppliers/123-image.jpg`

2. **Delete (`deleteFromR2`)**:
   - Extracts key from URL (handles both old and new domains)
   - Deletes file from R2 bucket
   - Works with URLs from both domains

3. **Signed URLs (`getPresignedUrl`)**:
   - Generates temporary signed URLs for private access
   - Uses R2 endpoint (not custom domain) - this is expected behavior
   - Custom domain is for public access, signed URLs use R2 endpoint

### Backward Compatibility

The enhanced code handles:
- Old R2 dev URLs: `https://pub-xxx.r2.dev/suppliers/...`
- New custom domain: `https://cdn.flavidairysolution.com/suppliers/...`
- Direct keys: `suppliers/123-image.jpg`

All formats are automatically detected and handled correctly.

## 🚨 Important Notes

1. **DNS Configuration**: Ensure `cdn.flavidairysolution.com` DNS is properly configured in Cloudflare
2. **SSL Certificate**: Verify SSL certificate is active for the custom domain
3. **Bucket Access**: Ensure the R2 bucket has public access enabled for the custom domain
4. **CORS**: If customer app accesses files directly, configure CORS in Cloudflare

## 📚 Files Modified

1. `src/lib/r2.ts` - Enhanced URL extraction logic
2. `package.json` - Added migration script and tsx dependency
3. `scripts/migrate-r2-urls.ts` - New migration script
4. `UPDATE_R2_DOMAIN.md` - Configuration instructions
5. `IMPLEMENTATION_SUMMARY.md` - This file

## 🎯 Result

Once you update `R2_PUBLIC_URL` in your `.env` file and restart the application:
- ✅ All new file uploads will use `cdn.flavidairysolution.com`
- ✅ All file operations (upload/delete/update) will work correctly
- ✅ Existing files will continue to work (backward compatible)
- ✅ Migration script available for updating existing URLs

No code changes needed beyond what's already implemented - just update the environment variable!

