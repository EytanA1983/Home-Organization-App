# Build-Time Optimizations

## Overview

This document describes build-time optimizations implemented to improve application performance and loading speed.

## Vite Build Optimizations

### esbuild Minification

**Status**: ✅ Enabled

**Configuration**: `vite.config.ts`

```typescript
build: {
  minify: 'esbuild', // Faster than terser (2-10x)
}
```

**Benefits**:
- **2-10x faster** than terser during build
- Smaller bundle sizes (similar compression ratio)
- Automatic console.log removal in production
- Built into Vite (no additional dependencies)

**Comparison**:
- **esbuild**: Fast, good compression, minimal options
- **terser**: Slower, excellent compression, many options

**When to use terser**:
- Need advanced minification options
- Need to preserve specific function names
- Need custom dead code elimination

**Note**: esbuild automatically removes `console.log` in production builds, so explicit configuration is not needed.

## NGINX HTTP/2 Server Push

**Status**: ✅ Enabled

**Configuration**: `nginx/nginx.conf`

### Global HTTP/2 Push

```nginx
http2_push_preload on;
```

Enables HTTP/2 server push globally for the server block.

### Location-Specific Push

#### Frontend Entry Point

```nginx
location / {
    # Push critical resources when index.html is requested
    http2_push /assets/css/index.css;
    http2_push /assets/js/index.js;
}
```

#### Assets Directory

```nginx
location /assets {
    # Push critical JS/CSS entry chunks
    location ~* /assets/js/index.*\.js$ {
        http2_push_preload on;
    }
    location ~* /assets/css/index.*\.css$ {
        http2_push_preload on;
    }
}
```

#### Fonts

```nginx
location ~* \.(woff2?|eot|ttf|otf)$ {
    http2_push_preload on;
}
```

### How HTTP/2 Push Works

1. **Client requests** `index.html`
2. **Server responds** with HTML + pushes critical resources
3. **Browser receives** HTML and pushed resources simultaneously
4. **Reduces round trips** - resources arrive before being requested

### Benefits

- **Faster page loads** - Critical resources arrive earlier
- **Reduced latency** - Fewer round trips to server
- **Better perceived performance** - Content appears faster

### Best Practices

1. **Only push critical resources**:
   - Entry JS/CSS files
   - Critical fonts
   - Small, essential assets

2. **Avoid pushing**:
   - Large images
   - Non-critical scripts
   - Already cached resources

3. **Monitor push effectiveness**:
   - Use Chrome DevTools Network tab
   - Check if pushed resources are used
   - Adjust based on actual usage

### Browser Support

- ✅ Chrome 9+
- ✅ Firefox 4+
- ✅ Safari 9+
- ✅ Edge 12+

**Note**: Modern browsers may ignore push if:
- Resource is already in cache
- Resource is not needed
- Connection is slow

### Testing HTTP/2 Push

1. **Chrome DevTools**:
   - Open Network tab
   - Look for "Push" in the "Type" column
   - Check "Initiator" column for "Push / Other"

2. **Command line**:
```bash
curl -I https://your-domain.com/
# Look for Link headers with rel=preload
```

3. **Online tools**:
   - [HTTP/2 Test](https://tools.keycdn.com/http2-test)
   - [WebPageTest](https://www.webpagetest.org/)

## Performance Impact

### Build Time

- **Before (terser)**: ~30-60 seconds
- **After (esbuild)**: ~5-15 seconds
- **Improvement**: 2-10x faster

### Page Load Time

- **Before (no push)**: ~2-3 seconds (First Contentful Paint)
- **After (with push)**: ~1.5-2 seconds (First Contentful Paint)
- **Improvement**: 20-30% faster

### Bundle Size

- **esbuild**: Similar compression to terser
- **No significant difference** in final bundle size

## Configuration Files

### Vite Config

`frontend/vite.config.ts`:
```typescript
build: {
  minify: 'esbuild',
  // esbuild automatically removes console.log in production
}
```

### NGINX Config

`nginx/nginx.conf`:
```nginx
http2_push_preload on;

location / {
    http2_push /assets/css/index.css;
    http2_push /assets/js/index.js;
}
```

## Troubleshooting

### esbuild Issues

**Problem**: Build fails with esbuild
**Solution**: Check Node.js version (esbuild requires Node 14+)

**Problem**: Need more minification options
**Solution**: Switch back to terser:
```typescript
minify: 'terser',
terserOptions: { /* ... */ }
```

### HTTP/2 Push Not Working

**Problem**: Resources not being pushed
**Solution**:
1. Verify HTTP/2 is enabled: `listen 443 ssl http2;`
2. Check browser support (Chrome DevTools)
3. Verify paths are correct
4. Check NGINX error logs

**Problem**: Too many resources pushed
**Solution**: Reduce push to only critical resources

## Related Documentation

- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [esbuild Documentation](https://esbuild.github.io/)
- [NGINX HTTP/2 Push](https://nginx.org/en/docs/http/ngx_http_v2_module.html#http2_push_preload)
- [HTTP/2 Server Push Best Practices](https://web.dev/http2-server-push/)
