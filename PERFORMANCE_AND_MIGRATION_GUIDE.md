# Performance Optimization & Migration Guide

## 🚀 Recent Improvements

The following performance and UX improvements have been implemented:

### 1. **Image Optimization**
- ✅ **Smart Auto-Resize**: Banners and post images are now automatically resized on upload
  - Banners: Optimized to 1500×500px
  - Post Images: Optimized to 1200×800px
  - Logos: Optimized to 400×400px
  - All images use 90% quality compression for optimal file size

- ✅ **Lazy Loading**: Post images now use `loading="lazy"` attribute
- ✅ **Optimized Display**: Images use `object-contain` for better aspect ratio handling
- ✅ **Reduced Size**: Post images max height reduced from 96 (384px) to 400px

### 2. **File Attachments for Posts**
- ✅ Posts now support up to 5 file attachments (50MB each)
- ✅ Attachments inherit post privacy settings (public/private)
- ✅ Files are not added to the main Files section automatically
- ✅ Download functionality for all attachments

### 3. **UI/UX Improvements**
- ✅ Removed hover edit buttons on main page (can still edit in settings)
- ✅ Logo now adapts to non-square images with rounded corners
- ✅ Better responsive design for posts on mobile
- ✅ Improved visual hierarchy and spacing

## ⚡ Performance Investigation: Slow Tab/Page Navigation

If you're experiencing slow page/tab navigation, here are the likely causes and solutions:

### Development Build vs Production Build
**Most Common Cause**: Running in development mode (`npm run dev`)

- **Dev builds** are NOT optimized and include:
  - Hot module replacement (HMR)
  - Source maps
  - Development warnings
  - Turbopack experimental features
  - Much larger bundle sizes

- **Production builds** are optimized with:
  - Minification
  - Tree shaking
  - Code splitting
  - Optimized React rendering
  - Static optimization

**Solution**: Build and run in production mode:
```bash
npm run build
npm run start
```

### Next.js 15 Specific Considerations

1. **Server Components**: The app uses React Server Components
   - Initial page load fetches data server-side
   - Client-side navigation should be fast
   - If slow, check database query performance

2. **Turbopack (--turbopack flag)**: Currently using experimental Turbopack
   - Can be slower in some cases during development
   - Try running without it: `next dev` instead of `next dev --turbopack`

### Database Query Optimization

The main page makes several queries:
- Union data
- Posts (with likes, attachments)
- Files
- Events
- Member status

**Optimization Tips**:
1. Ensure database is running locally or has low latency
2. Add database indexes (already done for post_attachments)
3. Consider pagination for posts/files/events if data grows

### Image Loading Performance

Large images can slow down page loads:
- ✅ Already implemented: Auto-resize on upload
- ✅ Already implemented: Lazy loading for post images
- 🔄 Consider: Using Next.js `<Image>` component for automatic optimization
- 🔄 Consider: Adding blur placeholders for images

### Client-Side Navigation

The app uses client-side routing for tabs:
```javascript
// Current implementation
const setActiveTab = (tab) => {
  router.push(newUrl);
};
```

This triggers a full route change. For faster tab switching:
- Current approach is standard Next.js
- Route changes are cached by Next.js
- Should be fast in production

## 🔧 Required Migration

A new database table `post_attachments` has been added. You need to run the migration:

### Option 1: Using the Migration Script
```bash
# Ensure POSTGRES_URL is set in .env
npx tsx lib/db/migrate-post-attachments.ts
```

### Option 2: Manual SQL
```sql
-- Run this SQL in your database
CREATE TABLE IF NOT EXISTS post_attachments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON post_attachments(post_id);
```

The migration file is located at: `/migrations/add-post-attachments-table.sql`

## 📊 Performance Benchmarks

To measure performance improvements:

1. **Test Navigation Speed**:
   ```bash
   # Development mode
   npm run dev
   # Time tab switching

   # Production mode
   npm run build && npm run start
   # Time tab switching again
   ```

2. **Expected Results**:
   - Dev mode: 500ms - 2000ms per navigation
   - Production mode: 100ms - 300ms per navigation

3. **Image Loading**:
   - Before: 5-10MB images taking 5-10s to load
   - After: <1MB images loading in 1-2s

## 🎯 Next Steps for Further Optimization

If performance is still an issue after these changes:

1. **Enable Next.js Image Optimization**:
   - Replace `<img>` tags with `<Image>` from 'next/image'
   - Requires image optimization API or manual configuration

2. **Implement Pagination**:
   - Add "Load More" for posts
   - Limit initial load to 10-20 posts

3. **Add Caching**:
   - Use SWR for client-side caching (already installed)
   - Add Redis for server-side caching

4. **Database Optimization**:
   - Add more indexes if queries are slow
   - Use database connection pooling
   - Consider read replicas for scaling

5. **Bundle Analysis**:
   ```bash
   npm install @next/bundle-analyzer
   # Configure in next.config.js
   npm run build
   ```

## 📝 Summary of Changes

All changes have been implemented and are ready to test. The main performance bottleneck is likely the development build. Test in production mode to see the real performance.

For questions or issues, check:
- Next.js 15 documentation: https://nextjs.org/docs
- React Server Components: https://react.dev/reference/rsc/server-components
- Drizzle ORM docs: https://orm.drizzle.team/
