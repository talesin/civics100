# Deployment Guide

This guide covers how to deploy the US Civics Test website to various hosting platforms.

## Table of Contents

- [GitHub Pages (Recommended)](#github-pages-recommended)
- [Vercel](#vercel)
- [Netlify](#netlify)
- [Custom Server](#custom-server)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)

## GitHub Pages (Recommended)

The project is pre-configured for GitHub Pages deployment with automatic CI/CD.

### Automatic Deployment

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Source: "GitHub Actions"

2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Monitor deployment**
   - Check the "Actions" tab for build progress
   - Deployment URL will be available once complete

### Manual GitHub Pages Setup

If you need to set up GitHub Pages manually:

```bash
# Build the static site
npm run build

# Create a separate gh-pages branch
git checkout -b gh-pages

# Copy dist contents to root
cp -r dist/* .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

### GitHub Actions Configuration

The `.github/workflows/deploy.yml` file handles:
- **Dependencies**: Installs both civics2json and website dependencies
- **Testing**: Runs full test suite
- **Linting**: Ensures code quality
- **Building**: Creates optimized static build
- **Deployment**: Publishes to GitHub Pages

## Vercel

Vercel provides excellent Next.js hosting with automatic deployments.

### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login and deploy**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Configure Build Settings**
   
   **Option 1: Vercel Dashboard**
   - Build Command: `cd website && npm run build`
   - Output Directory: `website/dist`  
   - Install Command: `npm install` (at root level)
   
   **Option 2: Configure vercel.json**
   ```json
   {
     "buildCommand": "cd website && npm run build",
     "outputDirectory": "website/dist",
     "installCommand": "npm install",
     "github": {
       "enabled": false
     }
   }
   ```

### Monorepo Considerations

This project uses npm workspaces. The build script has been optimized to avoid dependency resolution issues:

- **Fixed Issue**: Removed `npm run clean && npm install` from build script to prevent workspace structure disruption
- **Working Build Script**: `"build": "npm run lint && npm run test && NODE_ENV=production next build"`
- **Dependencies**: TypeScript dependencies (`@types/react`, `@types/node`) are properly managed in the workspace

### Environment Variables

No environment variables needed - the app is fully client-side.

## Netlify

Netlify offers great static site hosting with form handling capabilities.

### Setup

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [build.environment]
     NODE_VERSION = "20"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Continuous Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

## Custom Server

For hosting on your own server or VPS.

### Build for Production

```bash
# Install dependencies
npm install

# Build static site
npm run build

# The 'dist' directory contains all static files
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/app/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/your/app/dist
    
    <Directory "/path/to/your/app/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Handle client-side routing
        FallbackResource /index.html
    </Directory>
    
    # Cache static assets
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

## Docker Deployment

For containerized deployment.

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf for Docker

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### Build and Run

```bash
# Build image
docker build -t civics-test .

# Run container
docker run -p 8080:80 civics-test
```

### Docker Compose

```yaml
version: '3.8'

services:
  civics-test:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## Performance Optimization

### Pre-deployment Checklist

- [ ] **Bundle Analysis**: Check bundle size with `npm run build`
- [ ] **Lighthouse Audit**: Run performance audit
- [ ] **Mobile Testing**: Test responsive design
- [ ] **Accessibility**: Verify WCAG compliance
- [ ] **Cross-browser**: Test in multiple browsers

### Optimization Tips

1. **Enable Compression**
   ```bash
   # Check if gzip is working
   curl -H "Accept-Encoding: gzip" -I https://your-domain.com
   ```

2. **CDN Setup**
   - Use CloudFlare or similar CDN
   - Configure caching rules for static assets

3. **HTTP/2**
   - Ensure your server supports HTTP/2
   - Use server push for critical resources

## Monitoring

### Basic Monitoring

```bash
# Check site availability
curl -f https://your-domain.com || echo "Site is down"

# Check response time
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://your-domain.com
```

### Advanced Monitoring

- **Uptime Robot**: Monitor site availability
- **Google Analytics**: Track user behavior
- **Sentry**: Error monitoring and performance tracking
- **Lighthouse CI**: Automated performance audits

## Troubleshooting

### Common Issues

**404 Errors on Refresh**
- Ensure server is configured for SPA routing
- Check that fallback to `index.html` is working

**Static Assets Not Loading**
- Verify correct base path configuration
- Check asset paths in browser developer tools

**Build Failures**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

**Performance Issues**
- Enable compression (gzip/brotli)
- Implement proper caching headers
- Use CDN for static assets

### Debug Commands

```bash
# Test local build
npm run build && npx serve dist

# Analyze bundle size
npm run build && npx webpack-bundle-analyzer dist

# Test with different browsers
npx playwright test
```

### Environment-Specific Issues

**GitHub Pages**
- Check Actions logs for build errors
- Verify repository settings
- Ensure branch permissions are correct

**Vercel**
- Check deployment logs in dashboard
- Verify build settings match requirements
- Test preview deployments first

**TypeScript Dependencies Missing (Next.js)**
```
FatalError: It looks like you're trying to use TypeScript but do not have the required package(s) installed.
Please install @types/react and @types/node
```
- **Cause**: Monorepo workspace dependency resolution issue
- **Solution**: Ensure build command includes `cd website &&` to run from correct directory
- **Fixed**: Build script no longer runs `npm run clean && npm install` which disrupted workspace structure

**Netlify**
- Check deploy logs for errors
- Verify build command and publish directory
- Test with netlify dev locally

## Security Considerations

### HTTPS

Always deploy with HTTPS enabled:
- GitHub Pages: Automatic HTTPS
- Vercel: Automatic HTTPS
- Netlify: Automatic HTTPS
- Custom server: Use Let's Encrypt or similar

### Content Security Policy

Add CSP headers for security:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;";
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup-site.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "civics-backup-$DATE.tar.gz" dist/
aws s3 cp "civics-backup-$DATE.tar.gz" s3://your-backup-bucket/
```

### Recovery Process

1. **Restore from backup**
2. **Verify functionality**
3. **Update DNS if needed**
4. **Monitor for issues**

---

This deployment guide covers most common scenarios. For specific hosting requirements or custom setups, consult your hosting provider's documentation.