// Rutas guiadas por rol: cada paso indica el panel (route), el elemento a
// resaltar (target) y qué se hace ahí. Sin target, el paso se muestra centrado.

const nav = (path) => `.nav a[data-path="${path}"]`;
const help = {
  target: '[data-tour="help"]',
  title: 'Repite la ruta cuando quieras',
  text: 'Este botón vuelve a iniciar el recorrido. También puedes cambiar entre modo claro y oscuro con el botón de al lado.',
};

export const TOURS = {
  donador: [
    {
      route: 'panel',
      title: 'Bienvenido a Conecta +',
      text: 'Como donador, publicas alimentos y recursos que te sobran para que lleguen a organizaciones sociales verificadas. Te mostramos cada panel en menos de un minuto.',
    },
    { route: 'panel', target: '[data-tour="highlight"]', title: 'Tu impacto', text: 'Aquí ves cuántas de tus donaciones ya llegaron a una organización.' },
    { route: 'panel', target: '[data-tour="activity"]', title: 'Resumen de tu actividad', text: 'Cuántas donaciones publicaste y en qué estado están: disponibles, reservadas, entregadas o canceladas. Los botones te llevan a publicar o a tu listado.' },
    { route: 'panel', target: '[data-tour="metrics"]', title: 'Métricas clave', text: 'Donaciones que siguen disponibles, kilos entregados y organizaciones a las que has apoyado.' },
    { route: 'panel', target: nav('donar'), title: 'Panel «Donar»', text: 'Desde el menú entras a publicar una nueva donación.' },
    { route: 'donar', target: '[data-tour="form"]', title: 'Publica una donación', text: 'Indica qué es, la cantidad, la unidad y dónde se recoge. Para alimentos la fecha de caducidad es obligatoria. Al publicarla queda visible al instante.' },
    { route: 'donar', target: '[data-tour="steps"]', title: '¿Qué pasa después?', text: 'Las organizaciones la solicitan, el equipo administrador aprueba a una y ella confirma cuando la recibe.' },
    { route: 'mis-donaciones', target: '[data-tour="filters"]', title: 'Panel «Mis donaciones»', text: 'Filtra tus donaciones por estado para darles seguimiento.' },
    { route: 'mis-donaciones', target: '[data-tour="table"]', title: 'Seguimiento de cada donación', text: 'Ves cuántas solicitudes tiene, a qué organización se asignó y su estado. Mientras siga disponible puedes cancelarla.' },
    help,
  ],
  beneficiario: [
    {
      route: 'panel',
      title: 'Bienvenido a Conecta +',
      text: 'Como organización beneficiaria, solicitas las donaciones que tu comunidad necesita. Un administrador verifica tu organización antes de tu primera solicitud.',
    },
    { route: 'panel', target: '[data-tour="highlight"]', title: 'Lo que has recibido', text: 'Los kilos de alimento que tu organización ya recibió gracias a la red.' },
    { route: 'panel', target: '[data-tour="activity"]', title: 'Estado de tus solicitudes', text: 'Cuántas están en revisión, aprobadas por recoger, recibidas o rechazadas.' },
    { route: 'panel', target: '[data-tour="metrics"]', title: 'Métricas clave', text: 'Donaciones disponibles en este momento, las que ya recibiste y las que siguen en revisión.' },
    { route: 'panel', target: '[data-tour="table"]', title: 'Por recoger', text: 'Cuando se aprueba una solicitud aparece aquí. Al recogerla, confirma la recepción para cerrar la entrega.' },
    { route: 'disponibles', target: '[data-tour="filters"]', title: 'Panel «Donaciones disponibles»', text: 'Busca por nombre, descripción o ciudad y filtra por categoría.' },
    { route: 'disponibles', target: '[data-tour="table"]', title: 'Solicita una donación', text: 'Revisa cantidad, lugar y caducidad y pulsa «Solicitar». Puedes añadir un mensaje sobre a cuántas personas ayudará.' },
    { route: 'mis-solicitudes', target: '[data-tour="filters"]', title: 'Panel «Mis solicitudes»', text: 'Filtra por estado: en revisión, aprobadas, recibidas, rechazadas o canceladas.' },
    { route: 'mis-solicitudes', target: '[data-tour="table"]', title: 'Gestiona tus solicitudes', text: 'Cancela las que siguen en revisión, confirma la recepción de las aprobadas y consulta el motivo si alguna fue rechazada.' },
    help,
  ],
  admin: [
    {
      route: 'panel',
      title: 'Bienvenido a Conecta +',
      text: 'Como administrador, verificas organizaciones, decides a quién se asigna cada donación y supervisas toda la red.',
    },
    { route: 'panel', target: '[data-tour="highlight"]', title: 'Pendientes de revisión', text: 'Solicitudes que esperan tu decisión. Es lo primero que conviene atender cada día.' },
    { route: 'panel', target: '[data-tour="activity"]', title: 'Usuarios de la red', text: 'Donadores, organizaciones, cuentas por verificar y suspendidas, con accesos directos.' },
    { route: 'panel', target: '[data-tour="metrics"]', title: 'Métricas globales', text: 'Donaciones disponibles, kilos de alimento entregados y entregas completadas.' },
    { route: 'panel', target: '[data-tour="charts"]', title: 'Distribución y principales donantes', text: 'Qué categorías se donan más y qué donantes completan más entregas.' },
    { route: 'solicitudes', target: '[data-tour="filters"]', title: 'Panel «Solicitudes»', text: 'Por defecto ves las que están por revisar. El número del menú indica cuántas hay.' },
    { route: 'solicitudes', target: '[data-tour="table"]', title: 'Aprueba, rechaza o revoca', text: 'Al aprobar, la donación se reserva para esa organización y las demás solicitudes se rechazan solas. Luego puedes marcarla como entregada o revocar la asignación.' },
    { route: 'donaciones', target: '[data-tour="table"]', title: 'Panel «Donaciones»', text: 'Todas las donaciones de la red con su donante, estado y asignación. Puedes cancelar las que sigan disponibles.' },
    { route: 'usuarios', target: '[data-tour="table"]', title: 'Panel «Usuarios»', text: 'Verifica a las organizaciones nuevas para que puedan solicitar. También puedes suspender o reactivar cuentas: al suspender, sus sesiones se cierran de inmediato.' },
    { route: 'auditoria', target: '[data-tour="table"]', title: 'Panel «Auditoría»', text: 'El registro de quién hizo qué y cuándo: registros, inicios de sesión, aprobaciones, entregas y cambios de cuenta.' },
    help,
  ],
};
