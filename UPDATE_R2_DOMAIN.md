# Update R2 Custom Domain Configuration

## Quick Update Instructions

Update your `.env` file with the following changes:

### Update R2_PUBLIC_URL (around line 11-19)

**Find this line:**
```env
R2_PUBLIC_URL="https://pub-your-r2-public-domain.r2.dev"
```

**Replace with:**
```env
R2_PUBLIC_URL="https://cdn.pakmondairysolution.com"
```

### Complete R2 Configuration Section

Your R2 configuration section should look like this:

```env
# Cloudflare R2
R2_ACCOUNT_ID="62823221dfff75d61e6a8dfc45ad4148"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="chatbot-pakmon"
R2_ENDPOINT="https://62823221dfff75d61e6a8dfc45ad4148.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://cdn.pakmondairysolution.com"
```

### Cloudflare AutoRAG Configuration (around line 19-26)

Ensure your AutoRAG configuration is correct:

```env
# Cloudflare AutoRAG
CLOUDFLARE_ACCOUNT_ID="62823221dfff75d61e6a8dfc45ad4148"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
CLOUDFLARE_AUTORAG_INDEX="your-index-name"
```

## After Updating

1. **Restart your application** (if running)
2. **Test file upload** - Upload a new product with images
3. **Verify URLs** - Check that new uploads use `cdn.pakmondairysolution.com`
4. **Test file access** - Open an uploaded image URL in browser

## Verification

After updating, new file uploads will automatically use the custom domain. Existing files will continue to work (backward compatibility is built-in).

## Optional: Migrate Existing URLs

If you want to update existing product URLs in the database, run the migration script:

```bash
npm run migrate:r2-urls
```

This will update all existing product image and PDF URLs to use the new domain.


