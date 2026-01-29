# Setting Up Dependency Scanning

## Quick Setup Guide

### 1. Dependabot (Automatic)

Dependabot is **already configured** and will start working automatically once enabled:

1. Go to **Repository Settings** → **Security** → **Code security and analysis**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**

Dependabot will:
- ✅ Create PRs for security updates automatically
- ✅ Create PRs for dependency updates weekly
- ✅ Use configuration from `.github/dependabot.yml`

### 2. Snyk (Manual Setup Required)

#### Step 1: Create Snyk Account

1. Go to https://snyk.io/
2. Sign up with GitHub (recommended)
3. Complete onboarding

#### Step 2: Get API Token

1. Go to **Settings** → **API Token**
2. Copy your token (starts with `snyk_`)

#### Step 3: Add to GitHub Secrets

1. Go to your repository on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SNYK_TOKEN`
5. Value: Paste your Snyk token
6. Click **Add secret**

#### Step 4: Test Locally (Optional)

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test backend
cd backend
snyk test --file=poetry.lock

# Test frontend
cd ../frontend
snyk test --file=package-lock.json
```

### 3. Verify Setup

#### Check Dependabot

1. Go to **Security** tab
2. You should see **Dependabot** section
3. Wait for first scan (may take a few hours)

#### Check Snyk

1. Go to **Actions** tab
2. Run workflow manually: **Dependency Security Scan** → **Run workflow**
3. Check workflow logs for Snyk results

#### Check GitHub Security Tab

1. Go to **Security** tab
2. You should see:
   - **Dependabot alerts**
   - **Code scanning alerts** (from Snyk SARIF)

## Troubleshooting

### Snyk Token Not Found

**Error**: `SNYK_TOKEN secret not found`

**Solution**:
1. Check GitHub Secrets → Actions
2. Ensure token is named exactly `SNYK_TOKEN`
3. Re-run workflow

### Snyk Authentication Failed

**Error**: `Authentication failed. Please check the API token`

**Solution**:
1. Verify token is correct
2. Check token hasn't expired
3. Regenerate token in Snyk dashboard

### Dependabot Not Running

**Solution**:
1. Check repository settings → Security
2. Ensure Dependabot is enabled
3. Wait 24 hours for first scan
4. Check `.github/dependabot.yml` syntax

### No Vulnerabilities Found (But There Are)

**Solution**:
1. Check Snyk database is up to date
2. Run `snyk test --update`
3. Check severity threshold (set to `high`)

## Next Steps

1. ✅ **Review first Dependabot PRs** (may take 24-48 hours)
2. ✅ **Check Snyk dashboard** for project status
3. ✅ **Set up alerts** in Snyk for critical vulnerabilities
4. ✅ **Review security tab weekly**

## Resources

- **Dependabot Docs**: https://docs.github.com/en/code-security/dependabot
- **Snyk Docs**: https://docs.snyk.io/
- **Snyk Dashboard**: https://app.snyk.io/
- **GitHub Security**: Repository → Security tab
