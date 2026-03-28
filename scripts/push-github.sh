#!/bin/bash
# Script para sincronizar Opturna con GitHub
# Ejecutar con: bash scripts/push-github.sh

set -e

echo "🚀 Sincronizando con GitHub..."

# Check if github remote exists
if git remote get-url github 2>/dev/null; then
  echo "✅ GitHub remote ya configurado"
else
  echo "❌ No hay remote de GitHub configurado."
  echo ""
  echo "Para configurarlo, ejecuta:"
  echo "  git remote add github https://github.com/TU_USUARIO/TU_REPO.git"
  echo ""
  echo "Luego vuelve a ejecutar este script."
  exit 1
fi

# Stage and commit any pending changes
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 Guardando cambios pendientes..."
  git add -A
  git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M')" || true
fi

# Push to GitHub
echo "⬆️  Subiendo a GitHub..."
git push github main

echo ""
echo "✅ ¡Listo! Cambios subidos a GitHub."
echo "   GitHub Actions desplegará la web automáticamente."
