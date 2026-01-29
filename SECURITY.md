# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: [Your security email]
2. **GitHub Security Advisory**: Go to the Security tab → Report a vulnerability

We will respond within **48 hours** and work with you to fix the issue.

## Security Scanning

This project uses automated security scanning:

### Dependabot

- **Automatic dependency updates**: Weekly
- **Security patches**: Immediately
- **Configuration**: `.github/dependabot.yml`

### Snyk

- **Vulnerability scanning**: On every PR and push
- **Weekly scans**: Scheduled every Monday
- **Configuration**: `.snyk` and `.snyk.d/`

### Safety (Python)

- **Python dependency scanning**: CI/CD pipeline
- **Database**: Updated regularly

### npm audit

- **npm package scanning**: CI/CD pipeline
- **Auto-fix**: Available via `npm audit fix`

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use environment variables
2. **Keep dependencies updated**: Review Dependabot PRs
3. **Follow secure coding practices**: See `docs/static-analysis.md`
4. **Review security alerts**: Check GitHub Security tab weekly

### For Users

1. **Keep the app updated**: Use the latest version
2. **Use strong passwords**: Minimum 12 characters
3. **Enable 2FA**: If available
4. **Report vulnerabilities**: Use the methods above

## Known Vulnerabilities

None at this time. Check GitHub Security tab for current status.

## Security Updates

Security updates are released as:
- **Critical**: Immediate patch release
- **High**: Within 7 days
- **Medium**: Within 30 days
- **Low**: Next scheduled release

## Dependency Policy

- **Production dependencies**: Must pass security scans
- **Development dependencies**: Scanned but not blocking
- **Vulnerability threshold**: High severity blocks merge

## Contact

For security-related questions:
- **Email**: [Your security email]
- **GitHub**: Open a private security advisory
