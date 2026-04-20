#!/bin/bash

echo "🧪 LANCEMENT DES TESTS ADMIN COMPLETS"
echo "======================================"
echo ""

echo "📋 Checklist pré-test:"
echo "  1. Le serveur dev est-il lancé ? (npm run dev)"
echo "  2. L'application est-elle accessible sur http://localhost:5173 ?"
echo ""

read -p "Continuer les tests ? (o/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Oo]$ ]]
then
    echo "❌ Tests annulés"
    exit 1
fi

echo ""
echo "🚀 Démarrage des tests..."
echo ""

# Test 1: Linting
echo "📝 Test 1: Linting..."
npm run lint
if [ $? -eq 0 ]; then
    echo "✅ Linting OK"
else
    echo "❌ Erreurs de linting détectées"
    exit 1
fi
echo ""

# Test 2: Tests unitaires
echo "🧪 Test 2: Tests unitaires..."
npm test
if [ $? -eq 0 ]; then
    echo "✅ Tests unitaires OK"
else
    echo "❌ Tests unitaires échoués"
    exit 1
fi
echo ""

# Test 3: Build
echo "🏗️ Test 3: Build de production..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build OK"
else
    echo "❌ Build échoué"
    exit 1
fi
echo ""

# Test 4: Tests E2E Admin
echo "🎭 Test 4: Tests E2E Admin complets..."
npm run test:e2e -- e2e/admin-complete-test.spec.ts
if [ $? -eq 0 ]; then
    echo "✅ Tests E2E OK"
else
    echo "⚠️ Certains tests E2E ont échoué (vérifier le rapport)"
fi
echo ""

echo "======================================"
echo "✅ TOUS LES TESTS SONT TERMINÉS"
echo "======================================"
echo ""
echo "📊 Résumé:"
echo "  ✅ Linting: OK"
echo "  ✅ Tests unitaires: OK"
echo "  ✅ Build: OK"
echo "  ⚠️ Tests E2E: Vérifier le rapport"
echo ""
echo "📖 Pour les tests manuels, consultez:"
echo "  👉 GUIDE-TEST-ADMIN-MANUEL.md"
echo ""
