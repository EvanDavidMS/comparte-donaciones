#!/usr/bin/env bash
# Levanta SonarQube Community en Docker, analiza el proyecto y genera el reporte.
# Se usa igual en local y en GitHub Actions (no requiere cuenta ni servicios de pago).
#   SONAR_URL     URL de SonarQube vista desde esta máquina (por defecto http://localhost:9000)
#   SCANNER_HOST  URL de SonarQube vista desde el contenedor del scanner
#   SCANNER_NET   red docker del scanner ("host" en Linux/CI)
set -euo pipefail

SONAR_URL="${SONAR_URL:-http://localhost:9000}"
SCANNER_HOST="${SCANNER_HOST:-$SONAR_URL}"
SCANNER_NET="${SCANNER_NET:-host}"
PASS="${SONAR_ADMIN_PASSWORD:-ConectaMas-Sonar-2026!}"
CONTAINER=conecta-sonarqube

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$CONTAINER" -p 9000:9000 -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true sonarqube:community >/dev/null
fi

echo "Esperando a que SonarQube esté listo..."
for _ in $(seq 1 120); do
  status=$(curl -s "$SONAR_URL/api/system/status" | sed -n 's/.*"status":"\([A-Z_]*\)".*/\1/p' || true)
  [ "$status" = "UP" ] && break
  sleep 5
done
[ "$status" = "UP" ] || { echo "SonarQube no arrancó"; exit 1; }

# Primera ejecución: cambia la contraseña por defecto (admin/admin).
curl -s -o /dev/null -u admin:admin -X POST "$SONAR_URL/api/users/change_password" \
  --data-urlencode "login=admin" --data-urlencode "previousPassword=admin" --data-urlencode "password=$PASS" || true

TOKEN=$(curl -s -u "admin:$PASS" -X POST "$SONAR_URL/api/user_tokens/generate" \
  --data-urlencode "name=ci-$(date +%s)" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] || { echo "No se pudo generar el token de SonarQube"; exit 1; }

# lcov generado en Windows usa "\"; el scanner (Linux) necesita "/".
[ -f coverage/lcov.info ] && sed -i 's#\\#/#g' coverage/lcov.info

SRC="$PWD"
# En Linux el scanner corre con el mismo UID para que los archivos generados sean legibles.
USER_OPT=(--user "$(id -u):$(id -g)")
if command -v cygpath >/dev/null 2>&1; then SRC="$(cygpath -w "$PWD")"; USER_OPT=(); fi
MSYS_NO_PATHCONV=1 docker run --rm "${USER_OPT[@]}" --network "$SCANNER_NET" -v "$SRC:/usr/src" \
  -e SONAR_HOST_URL="$SCANNER_HOST" -e SONAR_TOKEN="$TOKEN" -e SONAR_USER_HOME=/usr/src/.sonar sonarsource/sonar-scanner-cli \
  -Dsonar.working.directory=/usr/src/.scannerwork

TASK_ID=$(sed -n 's/^ceTaskId=//p' .scannerwork/report-task.txt)
for _ in $(seq 1 60); do
  task=$(curl -s -H "Authorization: Bearer $TOKEN" "$SONAR_URL/api/ce/task?id=$TASK_ID" | sed -n 's/.*"status":"\([A-Z_]*\)".*/\1/p')
  [ "$task" = "SUCCESS" ] && break
  [ "$task" = "FAILED" ] && { echo "El análisis falló en SonarQube"; exit 1; }
  sleep 3
done

SONAR_HOST_URL="$SONAR_URL" SONAR_TOKEN="$TOKEN" node scripts/sonar-report.js reports/sonarqube
