# Reporte de calidad — SonarQube

Proyecto: `comparte-donaciones` · Fecha: 2026-09-29T05:34:41.581Z

**Quality Gate: APROBADO ✅**

## Métricas

| Métrica | Valor |
|---|---|
| Líneas de código | 4031 |
| Archivos | 31 |
| Funciones | 387 |
| Bugs | 0 |
| Vulnerabilidades | 1 |
| Security hotspots | 0 |
| Code smells | 8 |
| Deuda técnica (min) | 40 |
| Ratio de deuda técnica (%) | 0.0 |
| Mantenibilidad | A |
| Fiabilidad | A |
| Seguridad | C |
| Cobertura (%) | 98.4 |
| Cobertura de líneas (%) | 99.1 |
| Cobertura de ramas (%) | 96.9 |
| Duplicación (%) | 0.0 |
| Complejidad ciclomática | 724 |
| Complejidad cognitiva | 371 |
| Comentarios (%) | 2.5 |
| Deuda técnica (legible) | 0 h 40 min |

## Condiciones del Quality Gate

| Métrica | Estado | Valor | Umbral |
|---|---|---|---|
| new_coverage | OK | 100.0 | LT 80 |
| new_duplicated_lines_density | OK | 0.0 | GT 3 |
| new_violations | OK | 0 | GT 0 |

## Incidencias abiertas (9)

| Tipo | Severidad | Archivo | Línea | Regla | Mensaje |
|---|---|---|---|---|---|
| CODE_SMELL | MAJOR | public/index.html | 16 | Web:S6819 | Use <output> instead of the status role to ensure accessibility across all devices. |
| CODE_SMELL | MAJOR | public/js/views/admin.js | 249 | javascript:S3358 | Extract this nested ternary operation into an independent statement. |
| CODE_SMELL | MAJOR | public/js/views/admin.js | 285 | javascript:S7721 | Move async function 'change' to the outer scope. |
| CODE_SMELL | MAJOR | public/js/views/admin.js | 287 | javascript:S3358 | Extract this nested ternary operation into an independent statement. |
| CODE_SMELL | MAJOR | public/js/views/admin.js | 292 | javascript:S3358 | Extract this nested ternary operation into an independent statement. |
| CODE_SMELL | MAJOR | public/js/views/beneficiary.js | 199 | javascript:S3358 | Extract this nested ternary operation into an independent statement. |
| VULNERABILITY | MAJOR | src/config.js | 41 | javascript:S2068 | Review this potentially hard-coded password. |
| CODE_SMELL | MINOR | src/middleware/auth.js | 21 | javascript:S6582 | Prefer using an optional chain expression instead, as it's more concise and easier to read. |
| CODE_SMELL | MAJOR | src/services/userService.js | 116 | javascript:S3358 | Extract this nested ternary operation into an independent statement. |

## Security hotspots (0)

| Categoría | Probabilidad | Archivo | Línea | Mensaje |
|---|---|---|---|---|