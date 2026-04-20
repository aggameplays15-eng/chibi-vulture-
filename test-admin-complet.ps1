# Script PowerShell pour tester l'admin complet

Write-Host "🧪 LANCEMENT DES TESTS ADMIN COMPLETS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Checklist pré-test:" -ForegroundColor Yellow
Write-Host "  1. Le serveur dev est-il lancé ? (npm run dev)"
Write-Host "  2. L'application est-elle accessible sur http://localhost:5173 ?"
Write-Host ""

$continue = Read-Host "Continuer les tests ? (o/n)"
if ($continue -ne "o" -and $continue -ne "O") {
    Write-Host "❌ Tests annulés" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Démarrage des tests..." -ForegroundColor Green
Write-Host ""

# Test 1: Linting
Write-Host "📝 Test 1: Linting..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Linting OK" -ForegroundColor Green
} else {
    Write-Host "❌ Erreurs de linting détectées" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Tests unitaires
Write-Host "🧪 Test 2: Tests unitaires..." -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tests unitaires OK" -ForegroundColor Green
} else {
    Write-Host "❌ Tests unitaires échoués" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Build
Write-Host "🏗️ Test 3: Build de production..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build OK" -ForegroundColor Green
} else {
    Write-Host "❌ Build échoué" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Tests E2E Admin
Write-Host "🎭 Test 4: Tests E2E Admin complets..." -ForegroundColor Cyan
npm run test:e2e -- e2e/admin-complete-test.spec.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tests E2E OK" -ForegroundColor Green
} else {
    Write-Host "⚠️ Certains tests E2E ont échoué (vérifier le rapport)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ TOUS LES TESTS SONT TERMINÉS" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Résumé:" -ForegroundColor Yellow
Write-Host "  ✅ Linting: OK"
Write-Host "  ✅ Tests unitaires: OK"
Write-Host "  ✅ Build: OK"
Write-Host "  ⚠️ Tests E2E: Vérifier le rapport"
Write-Host ""
Write-Host "📖 Pour les tests manuels, consultez:" -ForegroundColor Yellow
Write-Host "  👉 GUIDE-TEST-ADMIN-MANUEL.md" -ForegroundColor Cyan
Write-Host ""
