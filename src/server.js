'use strict';

const { loadConfig } = require('./config');
const { Store } = require('./store/store');
const { createApp } = require('./app');
const { ensureAdmin, seedDemo } = require('./seed');

async function main() {
  const config = loadConfig();
  const store = new Store({ file: config.dataFile });
  const loaded = store.load();

  await ensureAdmin(store, config);
  if (config.seedDemo) await seedDemo(store, config);
  store.save();

  const app = createApp({ store, config });
  const server = app.listen(config.port, () => {
    console.log(`Conecta + escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
    console.log(loaded ? `Datos cargados desde ${config.dataFile}` : 'Almacenamiento inicializado');
    if (config.generatedCredentials && !loaded) {
      // Solo se muestran credenciales generadas al vuelo (no hay secretos fijos en el código).
      console.log(`Credenciales temporales → admin: ${config.adminEmail} / ${config.adminPassword} · demo: ${config.demoPassword}`);
    }
  });

  const shutdown = () => {
    store.save();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
