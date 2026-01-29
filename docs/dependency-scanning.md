# Dependency Security Scanning

## Overview

This project uses multiple tools to scan dependencies for vulnerabilities:

| Tool | Purpose | Backend | Frontend | CI/CD |
|------|---------|---------|----------|-------|
| **Dependabot** | Automated dependency updates | ✅ | ✅ | ✅ |
| **Snyk** | Security vulnerability scanning | ✅ | ✅ | ✅ |
| **Safety** | Python dependency vulnerabilities | ✅ | - | ✅ |
| **npm audit** | npm package vulnerabilities | - | ✅ | ✅ |

## Dependabot

### Configuration

Dependabot is configured in `.github/dependabot.yml`:

- **Backend (Python)**: Weekly updates on Mondays
- **Frontend (npm)**: Weekly updates on Mondays
- **GitHub Actions**: Monthly updates

### Features

- ✅ Automatic security updates
- ✅ Grouped PRs (minor/patch updates)
- ✅ Labels and assignees
- ✅ Commit message prefixes

### Viewing Dependabot PRs

1. Go to **Pull Requests** tab
2. Filter by `label:dependencies`
3. Review and merge updates

### Dependabot Commands

In PR comments, you can use:

- `@dependabot rebase` - Rebase PR
- `@dependabot recreate` - Recreate PR
- `@dependabot merge` - Merge PR
- `@dependabot squash and merge` - Squash and merge
- `@dependabot close` - Close PR
- `@dependabot ignore this dependency` - Ignore updates

## Snyk

### Setup

1. **Create Snyk account**: https://snyk.io/
2. **Get API token**: Settings → API Token
3. **Add to GitHub Secrets**:
   - Go to Repository Settings → Secrets → Actions
   - Add `SNYK_TOKEN` with your token

### Local Usage

#### Backend

```bash
cd backend

# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test backend
snyk test --file=poetry.lock

# Monitor (sends to Snyk dashboard)
snyk monitor --file=poetry.lock

# Fix vulnerabilities
snyk wizard
```

#### Frontend

```bash
cd frontend

# Test frontend
snyk test --file=package-lock.json

# Monitor
snyk monitor --file=package-lock.json

# Fix vulnerabilities
snyk wizard
```

### Snyk Policies

Policies are stored in `.snyk.d/`:

- `backend-policy.yml` - Backend ignore rules
- `frontend-policy.yml` - Frontend ignore rules

To ignore a vulnerability:

```bash
snyk ignore --id=SNYK-PYTHON-PACKAGE-123456 --reason="False positive"
```

Or edit `.snyk.d/*-policy.yml` manually.

### Snyk Dashboard

View results at: https://app.snyk.io/

- **Projects**: See all scanned projects
- **Vulnerabilities**: Browse CVEs
- **Reports**: Generate security reports

## Safety (Python)

### Local Usage

```bash
cd backend

# Install Safety
pip install safety

# Export dependencies
poetry export -f requirements.txt --without-hashes -o requirements.txt

# Check vulnerabilities
safety check -r requirements.txt

# Full report
safety check -r requirements.txt --full-report

# JSON output
safety check -r requirements.txt --json
```

### Safety Database

Safety uses its own vulnerability database:
- Updated regularly
- Focuses on Python packages
- Good complement to Snyk

## npm audit

### Local Usage

```bash
cd frontend

# Check vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Fix without updating package.json
npm audit fix --force

# JSON output
npm audit --json

# Only show moderate+ severity
npm audit --audit-level=moderate
```

### npm audit Levels

- `low` - Low severity
- `moderate` - Moderate severity
- `high` - High severity
- `critical` - Critical severity

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/dependency-scan.yml` workflow:

1. **Runs on**:
   - Push to `main`/`develop`
   - Pull requests
   - Weekly schedule (Mondays)
   - Manual trigger

2. **Scans**:
   - Backend: Snyk + Safety
   - Frontend: Snyk + npm audit

3. **Outputs**:
   - SARIF files (GitHub Security tab)
   - Artifacts (JSON reports)
   - PR comments (summary)

### Viewing Results

1. **GitHub Security Tab**:
   - Repository → Security → Code scanning alerts
   - View Snyk results as SARIF

2. **Actions Artifacts**:
   - Workflow run → Artifacts
   - Download JSON reports

3. **PR Comments**:
   - Automatic summary comment
   - Review vulnerabilities

## Vulnerability Severity

### Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| **Critical** | Immediate threat | Fix immediately |
| **High** | Significant risk | Fix within 7 days |
| **Medium** | Moderate risk | Fix within 30 days |
| **Low** | Low risk | Fix when convenient |

### Response Time

- **Critical**: 24 hours
- **High**: 7 days
- **Medium**: 30 days
- **Low**: Next release

## Fixing Vulnerabilities

### Backend (Python)

1. **Check vulnerability**:
   ```bash
   snyk test --file=poetry.lock
   ```

2. **Update package**:
   ```bash
   poetry update package-name
   ```

3. **Or use Dependabot PR**:
   - Review PR
   - Test locally
   - Merge if safe

4. **Verify fix**:
   ```bash
   snyk test --file=poetry.lock
   ```

### Frontend (npm)

1. **Check vulnerability**:
   ```bash
   npm audit
   ```

2. **Auto-fix**:
   ```bash
   npm audit fix
   ```

3. **Manual update**:
   ```bash
   npm update package-name
   ```

4. **Verify fix**:
   ```bash
   npm audit
   ```

## Ignoring Vulnerabilities

### When to Ignore

- ✅ False positive
- ✅ Acceptable risk (documented)
- ✅ Already fixed in newer version
- ✅ Not applicable to your use case

### How to Ignore

#### Snyk

```bash
# Via CLI
snyk ignore --id=SNYK-PYTHON-PACKAGE-123456 --reason="False positive"

# Or edit .snyk.d/*-policy.yml
```

#### npm audit

```bash
# Via .npmrc
audit-level=high  # Only fail on high+

# Or use npm audit fix --force (not recommended)
```

#### Safety

Edit `safety` ignore file or use `--ignore` flag.

## Best Practices

### 1. Regular Updates

- ✅ Review Dependabot PRs weekly
- ✅ Update dependencies monthly
- ✅ Test updates in development first

### 2. Security First

- ✅ Never ignore critical/high vulnerabilities
- ✅ Document why ignoring medium/low
- ✅ Set expiration dates for ignores

### 3. Monitoring

- ✅ Check GitHub Security tab weekly
- ✅ Review Snyk dashboard monthly
- ✅ Set up alerts for critical issues

### 4. Documentation

- ✅ Document security decisions
- ✅ Keep `.snyk.d/*-policy.yml` updated
- ✅ Note vulnerability fixes in changelog

## Troubleshooting

### Snyk Token Missing

```bash
# Add to GitHub Secrets
# Repository → Settings → Secrets → Actions
# Add: SNYK_TOKEN
```

### False Positives

1. Verify it's actually a false positive
2. Check if newer version fixes it
3. Document reason for ignoring
4. Set expiration date

### Outdated Database

```bash
# Update Snyk database
snyk test --update

# Update Safety database
safety check --update
```

### CI Failures

- Check `continue-on-error: true` in workflow
- Review artifact logs
- Check Snyk token permissions

## Resources

- **Dependabot**: https://docs.github.com/en/code-security/dependabot
- **Snyk**: https://docs.snyk.io/
- **Safety**: https://pyup.io/safety/
- **npm audit**: https://docs.npmjs.com/cli/v8/commands/npm-audit
- **CVE Database**: https://cve.mitre.org/
