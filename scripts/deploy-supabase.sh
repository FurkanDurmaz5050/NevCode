#!/usr/bin/env bash
# Tek komutla Supabase production deploy:
#   - DB migration push
#   - Tüm edge function'ları deploy
#   - Secret'ların yüklü olduğunu doğrula
#
# Kullanım:
#   export SUPABASE_PROJECT_REF=abcd1234
#   ./scripts/deploy-supabase.sh
#
# Ön koşul: `supabase login` yapılmış olmalı.

set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "❌ SUPABASE_PROJECT_REF env değişkeni gerekli (örn. abcd1234)"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "→ Linking project $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF" >/dev/null

echo "→ DB migration push"
supabase db push

echo "→ Deploying edge functions"
FUNCTIONS=(
  health
  openai-chat
  scrape-context
  deep-research
  research-search
  social-posts
  gemini-image
  render-video
  render-callback
  fx-forecast
  shipping-quote
  carbon-estimate
)
for fn in "${FUNCTIONS[@]}"; do
  echo "  · $fn"
  if [[ "$fn" == "render-callback" || "$fn" == "health" || "$fn" == "scrape-context" ]]; then
    # Webhook + healthcheck + internal fetch JWT istemez
    supabase functions deploy "$fn" --no-verify-jwt
  else
    supabase functions deploy "$fn"
  fi
done

echo ""
echo "✅ Deploy tamamlandı."
echo ""
echo "→ Aşağıdaki secret'ların set edildiğinden emin ol:"
cat <<'EOF'
  supabase secrets set OPENAI_API_KEY=sk-...
  supabase secrets set GEMINI_API_KEY=AIza...
  supabase secrets set TAVILY_API_KEY=tvly-...
  supabase secrets set RENDER_CALLBACK_SECRET=$(openssl rand -hex 16)
  # AWS Lambda renderer (opsiyonel) — Supabase `AWS_*` prefix'ini reddettiği için `LAMBDA_AWS_*` kullan:
  supabase secrets set LAMBDA_AWS_ACCESS_KEY_ID=AKIA...
  supabase secrets set LAMBDA_AWS_SECRET_ACCESS_KEY=...
  supabase secrets set LAMBDA_AWS_REGION=eu-central-1
  supabase secrets set REMOTION_LAMBDA_FUNCTION_NAME=remotion-render-...
  supabase secrets set REMOTION_SERVE_URL=https://...amazonaws.com/sites/.../index.html
  supabase secrets set PUBLIC_FUNCTIONS_URL=https://YOUR-PROJECT.supabase.co/functions/v1
EOF
