# Static Code Analysis

## Overview

This project uses comprehensive static code analysis to catch issues before merge:

| Tool | Purpose | Backend | Frontend |
|------|---------|---------|----------|
| **Ruff** | Fast linter & formatter | ✅ | - |
| **MyPy** | Type checking | ✅ | - |
| **Bandit** | Security scanner | ✅ | - |
| **Safety** | Dependency vulnerabilities | ✅ | - |
| **ESLint** | JavaScript/TypeScript linting | - | ✅ |
| **Prettier** | Code formatting | - | ✅ |
| **TypeScript** | Type checking | - | ✅ |
| **npm audit** | Dependency vulnerabilities | - | ✅ |

## Backend (Python)

### Ruff

Ruff is a fast Python linter that replaces flake8, isort, and black.

```bash
# Check for issues
cd backend
poetry run ruff check .

# Auto-fix issues
poetry run ruff check . --fix

# Format code
poetry run ruff format .

# Check formatting
poetry run ruff format --check .
```

**Rules enabled:**
- `E`, `W` - pycodestyle
- `F` - Pyflakes
- `I` - isort
- `B` - flake8-bugbear
- `S` - flake8-bandit (security)
- `UP` - pyupgrade
- `SIM` - flake8-simplify
- `PERF` - perflint
- And many more...

### MyPy

Type checking for Python.

```bash
poetry run mypy app
```

### Bandit

Security vulnerability scanner.

```bash
poetry run bandit -r app
```

### Safety

Checks dependencies for known vulnerabilities.

```bash
poetry run safety check
```

### All Checks

Run all backend checks:

```bash
cd backend
poetry run ruff check .
poetry run ruff format --check .
poetry run mypy app
poetry run bandit -r app -c pyproject.toml
```

## Frontend (TypeScript/React)

### ESLint

JavaScript/TypeScript linting with React-specific rules.

```bash
cd frontend

# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

**Plugins enabled:**
- `@typescript-eslint` - TypeScript rules
- `react` - React rules
- `react-hooks` - Hooks rules
- `import` - Import sorting
- `jsx-a11y` - Accessibility
- `tailwindcss` - Tailwind class ordering

### Prettier

Code formatting.

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### TypeScript

Type checking.

```bash
npm run typecheck
```

### All Checks

Run all frontend checks:

```bash
cd frontend
npm run check  # typecheck + lint + format:check
```

Fix all issues:

```bash
npm run fix  # lint:fix + format
```

## Pre-commit Hooks

### Backend

Install pre-commit hooks:

```bash
cd backend
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg
```

Run manually:

```bash
pre-commit run --all-files
```

### Frontend

Uses Husky + lint-staged:

```bash
cd frontend
npm run prepare  # Install husky
```

Hooks run automatically on:
- `git commit` - Lint staged files
- `git push` - (optional) Full lint

## CI/CD Pipeline

The GitHub Actions workflow `.github/workflows/lint.yml` runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Jobs

1. **backend-lint** - Ruff, MyPy, Bandit
2. **frontend-lint** - TypeScript, ESLint, Prettier
3. **security-scan** - Safety, npm audit
4. **quality-report** - PR comment with results

### Badge

Add to README:

```markdown
![Lint Status](https://github.com/your-org/repo/actions/workflows/lint.yml/badge.svg)
```

## Configuration Files

### Backend

- `pyproject.toml` - Ruff, MyPy, Bandit, Black, isort config
- `.pre-commit-config.yaml` - Pre-commit hooks

### Frontend

- `.eslintrc.cjs` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore
- `package.json` - lint-staged config

## IDE Integration

### VS Code

Install extensions:
- **Python**: Ruff, Pylance, MyPy
- **Frontend**: ESLint, Prettier

Settings (`.vscode/settings.json`):

```json
{
  // Python
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.ruff": "explicit",
      "source.organizeImports.ruff": "explicit"
    }
  },
  "ruff.lint.run": "onSave",

  // TypeScript/React
  "[typescript][typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "eslint.validate": ["typescript", "typescriptreact"],
  "prettier.requireConfig": true
}
```

### JetBrains (PyCharm/WebStorm)

Enable:
- **PyCharm**: Ruff, MyPy inspections
- **WebStorm**: ESLint, Prettier

## Ignoring Rules

### Ruff

```python
# Ignore specific line
x = 1  # noqa: E501

# Ignore specific rules for file
# ruff: noqa: E501, F401

# In pyproject.toml per-file
[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101"]
```

### ESLint

```typescript
// Ignore line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const x: any = 1;

// Ignore block
/* eslint-disable no-console */
console.log('debug');
/* eslint-enable no-console */

// Ignore file (at top)
/* eslint-disable */
```

### Prettier

```typescript
// prettier-ignore
const ugly   =   formatting;

/* prettier-ignore */
<div    className="ignored"   ></div>
```

## Severity Levels

### Backend (Ruff)

- **Error**: Rule violations that must be fixed
- **Warning**: Style issues (configurable)

### Frontend (ESLint)

- `"error"` / `2` - Must fix before merge
- `"warn"` / `1` - Should fix
- `"off"` / `0` - Disabled

## Common Issues

### "Module not found" (ESLint)

Ensure TypeScript resolver is configured:

```js
// .eslintrc.cjs
settings: {
  'import/resolver': {
    typescript: {
      project: './tsconfig.json',
    },
  },
},
```

### "No matching files" (Ruff)

Check `exclude` in `pyproject.toml`:

```toml
[tool.ruff]
exclude = ["alembic/versions"]
```

### "Type error" but code works

Add type stubs or ignore:

```python
import untyped_lib  # type: ignore
```

## Performance

### Ruff

Ruff is 10-100x faster than flake8:

```bash
# Time comparison
time ruff check .       # ~0.1s
time flake8 .           # ~5s
```

### ESLint

Use caching for faster runs:

```bash
eslint . --cache
```

## Upgrading

### Update Ruff rules

```bash
cd backend
poetry update ruff
ruff rule --all  # List all rules
```

### Update ESLint

```bash
cd frontend
npm update eslint @typescript-eslint/eslint-plugin
npx eslint-config-prettier --check .eslintrc.cjs
```
