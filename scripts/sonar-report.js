'use strict';

/**
 * Descarga las métricas de SonarQube tras el análisis y genera un reporte
 * Markdown + JSON (deuda técnica, code smells, bugs, vulnerabilidades, cobertura...).
 * Uso: SONAR_HOST_URL=http://localhost:9000 SONAR_TOKEN=... node scripts/sonar-report.js reports/sonarqube
 */
const fs = require('node:fs');
const path = require('node:path');

const HOST = process.env.SONAR_HOST_URL || 'http://localhost:9000';
const TOKEN = process.env.SONAR_TOKEN;
const KEY = process.env.SONAR_PROJECT_KEY || 'conecta-mas-donaciones';
const OUT = process.argv[2] || 'reports/sonarqube';

const METRICS = [
  'ncloc', 'files', 'functions', 'bugs', 'vulnerabilities', 'security_hotspots', 'code_smells', 'sqale_index',
  'sqale_debt_ratio', 'sqale_rating', 'reliability_rating', 'security_rating', 'coverage', 'line_coverage',
  'branch_coverage', 'duplicated_lines_density', 'complexity', 'cognitive_complexity', 'comment_lines_density',
];
const LABELS = {
  ncloc: 'Líneas de código', files: 'Archivos', functions: 'Funciones', bugs: 'Bugs', vulnerabilities: 'Vulnerabilidades',
  security_hotspots: 'Security hotspots', code_smells: 'Code smells', sqale_index: 'Deuda técnica (min)',
  sqale_debt_ratio: 'Ratio de deuda técnica (%)', sqale_rating: 'Mantenibilidad', reliability_rating: 'Fiabilidad',
  security_rating: 'Seguridad', coverage: 'Cobertura (%)', line_coverage: 'Cobertura de líneas (%)',
  branch_coverage: 'Cobertura de ramas (%)', duplicated_lines_density: 'Duplicación (%)', complexity: 'Complejidad ciclomática',
  cognitive_complexity: 'Complejidad cognitiva', comment_lines_density: 'Comentarios (%)',
};
const RATING = { '1.0': 'A', '2.0': 'B', '3.0': 'C', '4.0': 'D', '5.0': 'E' };

async function get(url) {
  const res = await fetch(`${HOST}${url}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function main() {
  const [measures, gate, issues, hotspots] = await Promise.all([
    get(`/api/measures/component?component=${KEY}&metricKeys=${METRICS.join(',')}`),
    get(`/api/qualitygates/project_status?projectKey=${KEY}`),
    get(`/api/issues/search?componentKeys=${KEY}&resolved=false&ps=100`),
    get(`/api/hotspots/search?projectKey=${KEY}&ps=100`).catch(() => ({ hotspots: [] })),
  ]);
  const values = Object.fromEntries(measures.component.measures.map((m) => [m.metric, m.value]));
  const fmt = (k) => (k.endsWith('_rating') ? RATING[values[k]] || values[k] : values[k] ?? '—');
  const debtMin = Number(values.sqale_index || 0);

  const md = [
    '# Reporte de calidad — SonarQube',
    '',
    `Proyecto: \`${KEY}\` · Fecha: ${new Date().toISOString()}`,
    '',
    `**Quality Gate: ${gate.projectStatus.status === 'OK' ? 'APROBADO ✅' : `${gate.projectStatus.status} ❌`}**`,
    '',
    '## Métricas',
    '',
    '| Métrica | Valor |',
    '|---|---|',
    ...METRICS.map((k) => `| ${LABELS[k]} | ${fmt(k)} |`),
    `| Deuda técnica (legible) | ${Math.floor(debtMin / 60)} h ${debtMin % 60} min |`,
    '',
    '## Condiciones del Quality Gate',
    '',
    '| Métrica | Estado | Valor | Umbral |',
    '|---|---|---|---|',
    ...(gate.projectStatus.conditions || []).map((c) => `| ${c.metricKey} | ${c.status} | ${c.actualValue ?? '—'} | ${c.comparator} ${c.errorThreshold} |`),
    '',
    `## Incidencias abiertas (${issues.total})`,
    '',
    '| Tipo | Severidad | Archivo | Línea | Regla | Mensaje |',
    '|---|---|---|---|---|---|',
    ...issues.issues.map((i) => `| ${i.type} | ${i.severity} | ${i.component.split(':').pop()} | ${i.line ?? '—'} | ${i.rule} | ${i.message.replaceAll('|', '\\|')} |`),
    '',
    `## Security hotspots (${hotspots.hotspots.length})`,
    '',
    '| Categoría | Probabilidad | Archivo | Línea | Mensaje |',
    '|---|---|---|---|---|',
    ...hotspots.hotspots.map((h) => `| ${h.securityCategory} | ${h.vulnerabilityProbability} | ${h.component.split(':').pop()} | ${h.line ?? '—'} | ${h.message.replaceAll('|', '\\|')} |`),
  ].join('\n');

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'sonar-report.md'), md);
  fs.writeFileSync(path.join(OUT, 'sonar-report.json'), JSON.stringify({ values, gate: gate.projectStatus, issues: issues.issues, hotspots: hotspots.hotspots }, null, 2));
  console.log(md);
}

main().catch((err) => {
  console.error('No se pudo generar el reporte de SonarQube:', err.message);
  process.exit(1);
});
