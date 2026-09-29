#!/usr/bin/env bash
# Pruebas de seguridad dinámicas (DAST) con OWASP ZAP contra la app en ejecución:
#   1) Baseline: spider + spider AJAX + análisis pasivo del frontend.
#   2) API scan: escaneo ACTIVO de todos los endpoints de la API (OpenAPI),
#      autenticado con JWT de administrador. Incluye pruebas de XSS, SQLi,
#      inyección de comandos, path traversal, etc.
#   APP_URL     URL de la app vista desde esta máquina   (http://localhost:3000)
#   TARGET_URL  URL de la app vista desde el contenedor  (igual en Linux/CI)
#   ZAP_NET     red docker ("host" en Linux/CI)
set -uo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
TARGET_URL="${TARGET_URL:-$APP_URL}"
ZAP_NET="${ZAP_NET:-host}"
OUT=reports/zap
IMAGE=ghcr.io/zaproxy/zaproxy:stable

mkdir -p "$OUT"
chmod 777 "$OUT" 2>/dev/null || true
cp security/zap/rules.tsv "$OUT/rules.tsv"
sed "s#http://localhost:3000#${TARGET_URL}#" docs/openapi.yaml > "$OUT/openapi.yaml"

SRC="$PWD/$OUT"
command -v cygpath >/dev/null 2>&1 && SRC="$(cygpath -w "$PWD/$OUT")"

TOKEN=$(BASE_URL="$APP_URL" node scripts/get-token.js)
[ -n "$TOKEN" ] || { echo "No se pudo obtener el token"; exit 1; }

# ZAP envía el JWT en todas las peticiones (variables ZAP_AUTH_HEADER*) y se excluye
# logout del escaneo para que no revoque el token a mitad de la prueba.
EXCLUDE_OPTS="-config globalexcludeurl.url_list.url(0).regex=.*/api/auth/logout.* -config globalexcludeurl.url_list.url(0).enabled=true"

echo "== ZAP baseline (pasivo + spider AJAX) =="
MSYS_NO_PATHCONV=1 docker run --rm --network "$ZAP_NET" -v "$SRC:/zap/wrk:rw" "$IMAGE" \
  zap-baseline.py -t "$TARGET_URL" -j -c rules.tsv -I \
  -r baseline.html -J baseline.json -w baseline.md

echo "== ZAP API scan (activo, autenticado) =="
MSYS_NO_PATHCONV=1 docker run --rm --network "$ZAP_NET" -v "$SRC:/zap/wrk:rw" \
  -e ZAP_AUTH_HEADER=Authorization -e ZAP_AUTH_HEADER_VALUE="Bearer ${TOKEN}" "$IMAGE" \
  zap-api-scan.py -t /zap/wrk/openapi.yaml -f openapi -c rules.tsv -I \
  -r api.html -J api.json -w api.md -z "$EXCLUDE_OPTS"

rm -f "$OUT/rules.tsv" "$OUT/openapi.yaml" "$OUT/zap.yaml"
node scripts/zap-summary.js "$OUT/baseline.json" "$OUT/api.json" > "$OUT/zap-summary.md"
status=$?
cat "$OUT/zap-summary.md"
exit $status
