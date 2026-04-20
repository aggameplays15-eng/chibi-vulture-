#!/bin/bash

# Script de test rapide pour Chibi Vulture
# Usage: ./quick-test.sh [local|staging|production]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-local}
case $ENV in
  local)
    BASE_URL="http://localhost:5173"
    ;;
  staging)
    BASE_URL="https://staging.chibi-vulture.com"
    ;;
  production)
    BASE_URL="https://chibi-vulture.com"
    ;;
  *)
    echo -e "${RED}❌ Environnement invalide: $ENV${NC}"
    echo "Usage: ./quick-test.sh [local|staging|production]"
    exit 1
    ;;
esac

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 TEST RAPIDE - CHIBI VULTURE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Environnement: $ENV${NC}"
echo -e "${YELLOW}URL: $BASE_URL${NC}"
echo ""

# Fonction pour tester une URL
test_url() {
  local url=$1
  local expected_status=$2
  local description=$3
  
  echo -e "${CYAN}🧪 Test: $description${NC}"
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS (Status: $status)${NC}"
    return 0
  else
    echo -e "${RED}❌ FAIL (Expected: $expected_status, Got: $status)${NC}"
    return 1
  fi
}

# Compteurs
PASSED=0
FAILED=0

# Tests
echo -e "${BLUE}📋 TESTS DES PAGES PRINCIPALES${NC}"
echo "─────────────────────────────────────────"
echo ""

# Landing page
if test_url "$BASE_URL/" 200 "Landing page (/)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Login
if test_url "$BASE_URL/login" 200 "Page de connexion (/login)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Signup
if test_url "$BASE_URL/signup" 200 "Page d'inscription (/signup)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Feed
if test_url "$BASE_URL/feed" 200 "Feed (/feed)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Shop
if test_url "$BASE_URL/shop" 200 "Boutique (/shop)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Cart
if test_url "$BASE_URL/cart" 200 "Panier (/cart)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Explore
if test_url "$BASE_URL/explore" 200 "Explorer (/explore)"; then
  ((PASSED++))
else
  ((FAILED++))
fi

echo ""
echo -e "${BLUE}📋 TESTS DES ENDPOINTS API${NC}"
echo "─────────────────────────────────────────"
echo ""

# API Posts
if test_url "$BASE_URL/api/posts" 200 "GET /api/posts"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# API Products
if test_url "$BASE_URL/api/products" 200 "GET /api/products"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# API Users
if test_url "$BASE_URL/api/users" 200 "GET /api/users"; then
  ((PASSED++))
else
  ((FAILED++))
fi

echo ""
echo -e "${BLUE}📋 TESTS DE SÉCURITÉ${NC}"
echo "─────────────────────────────────────────"
echo ""

# Test 404
if test_url "$BASE_URL/page-inexistante" 404 "Page 404"; then
  ((PASSED++))
else
  ((FAILED++))
fi

# Test API sans auth (devrait échouer)
echo -e "${CYAN}🧪 Test: POST /api/posts sans auth (devrait échouer)${NC}"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/posts" -H "Content-Type: application/json" -d '{"title":"test"}')
if [ "$status" -eq 401 ] || [ "$status" -eq 403 ]; then
  echo -e "${GREEN}✅ PASS (Status: $status - Accès refusé comme attendu)${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL (Expected: 401/403, Got: $status)${NC}"
  ((FAILED++))
fi

# Résumé
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Total: $TOTAL${NC}"
echo -e "${GREEN}✅ Réussis: $PASSED${NC}"
echo -e "${RED}❌ Échoués: $FAILED${NC}"
echo -e "${YELLOW}📈 Taux de réussite: $SUCCESS_RATE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Tous les tests sont passés!${NC}"
  echo ""
  exit 0
else
  echo -e "${YELLOW}⚠️  Certains tests ont échoué.${NC}"
  echo ""
  exit 1
fi
