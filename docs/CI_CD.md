# CI/CD Pipeline - Guida Rapida

## ✅ Workflow Configurati

### 1. **CI Workflow** (`.github/workflows/ci.yml`)

Eseguito su:
- Push su `main` o `develop`
- Pull Request verso `main` o `develop`

**Jobs:**
1. **Lint**: Verifica code style
2. **Test**: Esegue tutti i test
3. **Build**: Compila il progetto

### 2. **Security Workflow** (`.github/workflows/security.yml`)

Eseguito su:
- Push su `main`
- Pull Request verso `main`
- Ogni lunedì alle 00:00 (schedule)

**Jobs:**
1. **NPM Audit**: Verifica vulnerabilità dipendenze

## 🚀 Come Funziona

### Trigger Automatico

```bash
# Dopo ogni push
git add .
git commit -m "feat: new feature"
git push origin main
```

GitHub Actions si attiva automaticamente e:
1. ✅ Verifica il lint
2. ✅ Esegue i test
3. ✅ Compila il progetto
4. ✅ Esegue security scan

### Verifica Status

Vai su: `https://github.com/MaxPopovschii/crypto-assets-monitor/actions`

## 🔧 Test Locale

Prima di pushare, testa in locale:

```bash
# Lint
npm run lint

# Lint con fix automatico
npm run lint:fix

# Format code
npm run format

# Test
npm test

# Build
npm run build
```

## ⚠️ Problemi Comuni

### 1. Lint Fallisce

```bash
# Fix automaticamente
npm run lint:fix
npm run format
```

### 2. Test Falliscono

```bash
# Esegui test in locale
npm test

# Verifica singolo servizio
npm test --workspace=@crypto-monitor/analysis-service
```

### 3. Build Fallisce

```bash
# Pulisci e rebuilda
npm run clean
npm install
npm run build
```

## 📊 Badge Status

Aggiungi al README.md:

```markdown
[![CI](https://github.com/MaxPopovschii/crypto-assets-monitor/workflows/CI/badge.svg)](https://github.com/MaxPopovschii/crypto-assets-monitor/actions)
[![Security](https://github.com/MaxPopovschii/crypto-assets-monitor/workflows/Security%20Scan/badge.svg)](https://github.com/MaxPopovschii/crypto-assets-monitor/actions)
```

## 🎯 Best Practices

1. **Prima di fare commit**:
   ```bash
   npm run lint:fix
   npm run format
   npm test
   ```

2. **Commit messages** seguendo Conventional Commits:
   ```
   feat: add new feature
   fix: correct bug
   docs: update documentation
   ```

3. **Pull Request**:
   - Aspetta che CI passi (tutte le ✅ verdi)
   - Review del codice
   - Merge su main

## 🔄 Configurazione Aggiuntiva

### Aggiungere Secrets

Per deploy o API keys:

1. Vai su GitHub → Settings → Secrets
2. Aggiungi:
   - `COINGECKO_API_KEY`
   - `DOCKER_USERNAME`
   - `DOCKER_TOKEN`

### Branch Protection

Abilita su `main`:
1. Require pull request reviews
2. Require status checks to pass (CI)
3. Require branches to be up to date

---

**CI/CD configurato e funzionante! ✅**
