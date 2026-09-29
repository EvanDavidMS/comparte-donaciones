'use strict';

/**
 * Resume los reportes JSON de OWASP ZAP en Markdown y actúa como puerta de calidad:
 * termina con código 1 si existe alguna alerta de riesgo Alto.
 * Uso: node scripts/zap-summary.js reports/zap/baseline.json reports/zap/api.json > reports/zap/zap-summary.md
 */
const fs = require('node:fs');

const RISK = { 3: 'Alto', 2: 'Medio', 1: 'Bajo', 0: 'Informativo' };
const files = process.argv.slice(2).filter((f) => fs.existsSync(f));
const rows = [];
const totals = { 3: 0, 2: 0, 1: 0, 0: 0 };

for (const file of files) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const site of report.site || []) {
    for (const alert of site.alerts || []) {
      const risk = Number(alert.riskcode);
      totals[risk] += 1;
      rows.push({ scan: file.split(/[\\/]/).pop().replace('.json', ''), risk, name: alert.name, count: Number(alert.count || alert.instances?.length || 0), id: alert.pluginid });
    }
  }
}

rows.sort((a, b) => b.risk - a.risk || a.name.localeCompare(b.name));
const lines = [
  '# Resumen de seguridad — OWASP ZAP',
  '',
  `Fecha: ${new Date().toISOString()}`,
  '',
  '| Riesgo | Alertas |',
  '|---|---|',
  ...[3, 2, 1, 0].map((r) => `| ${RISK[r]} | ${totals[r]} |`),
  '',
  '| Escaneo | Riesgo | Alerta | Instancias | Plugin |',
  '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.scan} | ${RISK[r.risk]} | ${r.name} | ${r.count} | ${r.id} |`),
  '',
  totals[3] ? '**Resultado: FALLIDO — existen vulnerabilidades de riesgo Alto.**' : '**Resultado: APROBADO — sin vulnerabilidades de riesgo Alto.**',
];
console.log(lines.join('\n'));
process.exit(totals[3] ? 1 : 0);
