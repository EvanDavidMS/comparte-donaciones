# Reportes

| Carpeta | Contenido |
|---|---|
| `pruebas/` | Resultado de Jest en formato JUnit (`junit.xml`), resumen de cobertura (`coverage-summary.json`) y reporte HTML navegable (`cobertura/index.html`). |
| `sonarqube-inicial/` | Primer análisis de SonarQube (antes de las correcciones). |
| `sonarqube/` | Análisis final de SonarQube (`sonar-report.md` legible y `.json` con el detalle). |
| `zap-inicial/` | Primer escaneo OWASP ZAP: baseline y API activa (HTML, JSON y Markdown). |
| `zap/` | Escaneo OWASP ZAP final y `zap-summary.md`. |

Estos reportes se regeneran automáticamente en cada ejecución del pipeline (pestaña *Actions* → artefactos `reporte-pruebas`, `reporte-sonarqube` y `reporte-owasp-zap`). El análisis de hallazgos y sus correcciones está en [`../docs/SEGURIDAD.md`](../docs/SEGURIDAD.md).
