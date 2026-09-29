# Seguridad de Conecta +

Este documento describe los controles implementados, cómo se verificaron y los hallazgos de las pruebas de seguridad (OWASP ZAP) y del análisis de calidad (SonarQube), junto con sus correcciones.

## 1. Controles implementados (OWASP Top 10 · 2021)

| Riesgo OWASP | Control en Conecta + | Evidencia |
|---|---|---|
| A01 Control de acceso roto | Autorización por rol en cada ruta (`authorize`), verificación de propietario en servicios (un donador no ve ni cancela donaciones ajenas; IDOR → 404 para no revelar existencia), el rol `admin` no puede registrarse públicamente, las cuentas admin no se pueden modificar desde la API. | `tests/donations.test.js`, `tests/requests.test.js`, `tests/admin.test.js` |
| A02 Fallas criptográficas | bcrypt (10 rondas) para contraseñas; JWT HS256 con secreto ≥ 32 caracteres obligatorio en producción; cookies `Secure` en producción; nunca se devuelve el hash. | `tests/auth.test.js`, `tests/units.test.js` |
| A03 Inyección | Validación con zod en listas blancas (tipos, longitudes, enumeraciones, UUID), objetos `strict` (rechazan campos desconocidos), parámetros de consulta repetidos rechazados, sin SQL ni `eval`. Frontend sin `innerHTML` con datos: todo se inserta como texto. Rechazo de `<` `>` en campos de texto como defensa adicional. | ZAP: SQLi (6 variantes), XSS (reflejado/persistente/DOM), inyección de comandos, SSTI, XPath → **PASS** |
| A04 Diseño inseguro | Organizaciones verificadas manualmente antes de solicitar; máximo 10 solicitudes pendientes por organización; máquina de estados con transiciones validadas en servidor; auditoría de acciones. | `tests/requests.test.js` |
| A05 Configuración incorrecta | Helmet: CSP estricta sin `unsafe-inline`, `frame-ancestors 'none'`, COOP/COEP/CORP, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`; `X-Powered-By` oculto; errores sin trazas; `Cache-Control: no-store` en la API; métodos distintos de GET/HEAD rechazados fuera de la API; contenedor sin root. | `tests/security.test.js`, ZAP baseline (64 reglas PASS) |
| A06 Componentes vulnerables | `npm audit --audit-level=high` en el pipeline (0 vulnerabilidades); dependencias mínimas. | Job 1 del pipeline |
| A07 Fallas de autenticación | Política de contraseñas, bloqueo de 15 min tras 5 intentos fallidos, rate limiting (20 intentos de auth / 15 min por IP), mensajes genéricos y tiempo constante ante correos inexistentes, expiración de 2 h, **revocación en servidor** (logout y suspensión incrementan `tokenVersion`), algoritmo fijado (rechaza `alg=none`), `issuer`/`audience` verificados. | `tests/auth.test.js` |
| A08 Integridad de datos | Escritura atómica del almacenamiento (archivo temporal + rename), permisos `0600`. CSRF: cookie `SameSite=Strict` + verificación de `Origin`. | `tests/units.test.js`, `tests/security.test.js` |
| A09 Registro y monitoreo | Auditoría de registros, inicios de sesión, bloqueos, publicaciones, aprobaciones, entregas y cambios de cuenta (últimos 1000 eventos) visible para administradores. | Vista *Auditoría* |
| A10 SSRF | El servidor no realiza peticiones salientes basadas en datos del usuario. Los sondeos a endpoints de metadatos cloud reciben 405. | ZAP API scan |

Otras fugas consideradas: el token no es accesible desde JavaScript (cookie `httpOnly`); las respuestas nunca incluyen `passwordHash`, intentos fallidos ni `tokenVersion`; los beneficiarios no ven correos de donadores; las métricas públicas son agregadas; el límite de 10 KB por petición evita abusos de memoria; las credenciales no están en el código (`demo.env` solo para la demo local, secretos en producción).

## 2. Pruebas de seguridad dinámicas — OWASP ZAP

Se ejecutan con `scripts/zap-scan.sh`, en local y en el job 4 del pipeline, contra el contenedor desplegado en staging:

1. **Baseline**: spider tradicional + spider AJAX + análisis pasivo.
2. **API scan activo y autenticado**: importa `docs/openapi.yaml` y ataca todos los endpoints con un JWT de administrador (se excluye `/api/auth/logout` para no revocar el token durante el escaneo).

El pipeline falla si aparece alguna alerta de riesgo **Alto** (`scripts/zap-summary.js`).

| Riesgo | Escaneo inicial (`reports/zap-inicial`) | Escaneo final (`reports/zap`) |
|---|---|---|
| Alto | 0 | 0 |
| Medio | 0 | 0 |
| Bajo | 1 (10 instancias) | 1 (3 instancias, esperadas) |
| Informativo | 8 | 8 |

### Hallazgos y correcciones

| Hallazgo | Riesgo | Acción |
|---|---|---|
| *Unexpected Content-Type was returned* (100001): rutas fuera de `/api` respondían HTML a `PATCH /latest/meta-data/`, `/computeMetadata/v1/`, etc. | Bajo | **Corregido.** Fuera de la API solo se aceptan GET/HEAD (`405` en JSON con cabecera `Allow`), y los clientes que no aceptan HTML reciben `404` en JSON. Las 3 instancias restantes son `GET /` (la aplicación HTML) y la página 404 para navegadores: comportamiento esperado. |
| *Information Disclosure – Suspicious Comments* (10027) en `public/js/dom.js` | Informativo | **Corregido.** Un comentario empezaba por “Todo…”, que ZAP interpreta como `TODO`. |
| *Non-Storable Content* (10049) | Informativo | **Intencional.** `Cache-Control: no-store` en la API para no guardar datos personales en cachés. |
| *Information in Browser localStorage* (120000) | Informativo | **Aceptado.** Solo guarda la preferencia de tema claro/oscuro y si el usuario ya vio la ruta guiada (sin datos personales ni tokens). |
| *Authentication Request Identified* (10111), *Client Error response* (100000), *Modern Web Application* (10109) | Informativo | **Esperado.** Identificación del login y respuestas 4xx de validación ante entradas maliciosas. |

## 3. Análisis de calidad — SonarQube

`scripts/sonar-scan.sh` levanta SonarQube Community en Docker (sin cuenta ni costo), analiza el código con la cobertura de Jest y genera `reports/sonarqube/sonar-report.md`.

| Métrica | Inicial (`reports/sonarqube-inicial`) | Final (`reports/sonarqube`) |
|---|---|---|
| Quality Gate | Aprobado | Aprobado |
| Bugs | 0 | 0 |
| Vulnerabilidades | 1 | 0 |
| Code smells | 8 | 0 |
| Deuda técnica | 40 min | 0 min |
| Seguridad / Fiabilidad / Mantenibilidad | C / A / A | A / A / A |
| Cobertura | 98.4 % | 98.4 % |
| Duplicación | 0 % | 0 % |

### Incidencias corregidas

| Regla | Descripción | Corrección |
|---|---|---|
| S2068 (vulnerabilidad) | Contraseña de demostración escrita en `src/config.js` | Credenciales fuera del código: `demo.env` (solo demo local, cargado con `node --env-file`), generación aleatoria si faltan y obligatorias en producción. |
| S3358 ×5 | Ternarios anidados | Reescritos como `if/else` o funciones auxiliares. |
| S7721 | Función asíncrona definida dentro de otra | Movida al ámbito del módulo (`changeStatus`). |
| S6582 | Encadenamiento opcional | `header?.startsWith('Bearer ')`. |
| S6819 | `role="status"` en lugar de `<output>` | Contenedor de notificaciones cambiado a `<output>`. |
