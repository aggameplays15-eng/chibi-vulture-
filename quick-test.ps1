# Script de test rapide pour Chibi Vulture (PowerShell)
# Usage: .\quick-test.ps1 [local|staging|production]

param(
    [string]$Environment = "local"
)

# Configuration
$BaseUrl = switch ($Environment) {
    "local" { "http://localhost:5173" }
    "staging" { "https://staging.chibi-vulture.com" }
    "production" { "https://chibi-vulture.com" }
    default {
        Write-Host "❌ Environnement invalide: $Environment" -ForegroundColor Red
        Write-Host "Usage: .\quick-test.ps1 [local|staging|production]"
        exit 1
    }
}

Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "🚀 TEST RAPIDE - CHIBI VULTURE" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "Environnement: $Environment" -ForegroundColor Yellow
Write-Host "URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Compteurs
$Passed = 0
$Failed = 0

# Fonction pour tester une URL
function Test-Url {
    param(
        [string]$Url,
        [int]$ExpectedStatus,
        [string]$Description
    )
    
    Write-Host "🧪 Test: $Description" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        $status = $response.StatusCode
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
    }
    
    if ($status -eq $ExpectedStatus) {
        Write-Host "✅ PASS (Status: $status)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ FAIL (Expected: $ExpectedStatus, Got: $status)" -ForegroundColor Red
        return $false
    }
}

# Tests des pages principales
Write-Host "📋 TESTS DES PAGES PRINCIPALES" -ForegroundColor Blue
Write-Host "─────────────────────────────────────────"
Write-Host ""

if (Test-Url "$BaseUrl/" 200 "Landing page (/)") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/login" 200 "Page de connexion (/login)") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/signup" 200 "Page d'inscription (/signup)") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/feed" 200 "Feed (/feed)") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/shop" 200 "Boutique (/shop)") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/cart" 200 "Panier (/cart)") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/explore" 200 "Explorer (/explore)") { $Passed++ } else { $Failed++ }

Write-Host ""
Write-Host "📋 TESTS DES ENDPOINTS API" -ForegroundColor Blue
Write-Host "─────────────────────────────────────────"
Write-Host ""

if (Test-Url "$BaseUrl/api/posts" 200 "GET /api/posts") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/api/products" 200 "GET /api/products") { $Passed++ } else { $Failed++ }
if (Test-Url "$BaseUrl/api/users" 200 "GET /api/users") { $Passed++ } else { $Failed++ }

Write-Host ""
Write-Host "📋 TESTS DE SÉCURITÉ" -ForegroundColor Blue
Write-Host "─────────────────────────────────────────"
Write-Host ""

if (Test-Url "$BaseUrl/page-inexistante" 404 "Page 404") { $Passed++ } else { $Failed++ }

# Test API sans auth
Write-Host "🧪 Test: POST /api/posts sans auth (devrait échouer)" -ForegroundColor Cyan
try {
    $body = @{ title = "test" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/posts" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
    $status = $response.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.value__
}

if ($status -eq 401 -or $status -eq 403) {
    Write-Host "✅ PASS (Status: $status - Accès refusé comme attendu)" -ForegroundColor Green
    $Passed++
} else {
    Write-Host "❌ FAIL (Expected: 401/403, Got: $status)" -ForegroundColor Red
    $Failed++
}

# Résumé
$Total = $Passed + $Failed
$SuccessRate = [math]::Round(($Passed / $Total) * 100, 1)

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""
Write-Host "Total: $Total" -ForegroundColor Cyan
Write-Host "✅ Réussis: $Passed" -ForegroundColor Green
Write-Host "❌ Échoués: $Failed" -ForegroundColor Red
Write-Host "📈 Taux de réussite: $SuccessRate%" -ForegroundColor Yellow
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "🎉 Tous les tests sont passés!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Certains tests ont échoué." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
