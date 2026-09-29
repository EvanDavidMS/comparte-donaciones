'use strict';

const { z } = require('zod');

const ROLES = ['admin', 'donador', 'beneficiario'];
const PUBLIC_ROLES = ['donador', 'beneficiario'];
const USER_STATUSES = ['activo', 'pendiente', 'suspendido'];
const CATEGORIES = ['alimentos', 'ropa', 'higiene', 'utiles', 'hogar', 'otros'];
const UNITS = ['kg', 'litros', 'unidades', 'cajas', 'paquetes'];
const DONATION_STATUSES = ['disponible', 'reservada', 'entregada', 'cancelada', 'vencida'];
const REQUEST_STATUSES = ['pendiente', 'aprobada', 'rechazada', 'entregada', 'cancelada'];

const HTML_CHARS = /[<>]/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STRICT_MSG = 'La solicitud contiene campos no permitidos';

/** Texto libre saneado: sin espacios sobrantes y sin caracteres de marcado HTML. */
const text = (label, min, max) =>
  z
    .string({ required_error: `${label} es obligatorio`, invalid_type_error: `${label} debe ser texto` })
    .trim()
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede superar ${max} caracteres`)
    .refine((v) => !HTML_CHARS.test(v), `${label} contiene caracteres no permitidos (< >)`);

const email = z
  .string({ required_error: 'El correo es obligatorio', invalid_type_error: 'El correo debe ser texto' })
  .trim()
  .toLowerCase()
  .max(120, 'El correo no puede superar 120 caracteres')
  .email('Correo electrónico inválido');

const password = z
  .string({ required_error: 'La contraseña es obligatoria', invalid_type_error: 'La contraseña debe ser texto' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/\d/, 'La contraseña debe incluir un número');

const enumOf = (values, message) => z.enum(values, { errorMap: () => ({ message }) });

function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function isRealDate(value) {
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const registerSchema = z
  .object({
    name: text('El nombre', 2, 80),
    email,
    password,
    role: enumOf(PUBLIC_ROLES, 'El rol debe ser donador o beneficiario'),
    organization: text('La organización', 2, 100).optional(),
  })
  .strict(STRICT_MSG)
  .superRefine((data, ctx) => {
    if (data.role === 'beneficiario' && !data.organization) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['organization'],
        message: 'Las organizaciones beneficiarias deben indicar su nombre',
      });
    }
  });

const loginSchema = z
  .object({
    email: z.string({ required_error: 'El correo es obligatorio' }).trim().toLowerCase().min(3).max(120),
    password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1).max(72),
  })
  .strict(STRICT_MSG);

const donationSchema = z
  .object({
    title: text('El título', 3, 80),
    category: enumOf(CATEGORIES, 'Categoría inválida'),
    quantity: z
      .number({ required_error: 'La cantidad es obligatoria', invalid_type_error: 'La cantidad debe ser un número' })
      .int('La cantidad debe ser un número entero')
      .positive('La cantidad debe ser mayor que cero')
      .max(100000, 'La cantidad no puede superar 100000'),
    unit: enumOf(UNITS, 'Unidad inválida'),
    expiresAt: z.string().regex(DATE_RE, 'La fecha debe tener el formato AAAA-MM-DD').optional(),
    location: text('La ubicación', 2, 80),
    description: text('La descripción', 0, 500).optional(),
  })
  .strict(STRICT_MSG)
  .superRefine((data, ctx) => {
    if (data.category === 'alimentos' && !data.expiresAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expiresAt'], message: 'Los alimentos requieren fecha de caducidad' });
    }
    if (data.expiresAt) {
      if (!isRealDate(data.expiresAt)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expiresAt'], message: 'La fecha de caducidad no es válida' });
      } else if (data.expiresAt <= todayISO()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expiresAt'], message: 'La fecha de caducidad debe ser posterior a hoy' });
      }
    }
  });

const requestSchema = z
  .object({
    donationId: z.string({ required_error: 'La donación es obligatoria' }).regex(UUID_RE, 'Donación inválida'),
    message: text('El mensaje', 0, 300).optional(),
  })
  .strict(STRICT_MSG);

const reasonSchema = z.object({ reason: text('El motivo', 3, 200) }).strict(STRICT_MSG);

const userStatusSchema = z
  .object({ status: enumOf(['activo', 'suspendido'], 'El estado debe ser activo o suspendido') })
  .strict(STRICT_MSG);

const donationQuerySchema = z.object({
  status: enumOf(DONATION_STATUSES, 'Estado inválido').optional(),
  category: enumOf(CATEGORIES, 'Categoría inválida').optional(),
  q: z.string().trim().max(60, 'La búsqueda no puede superar 60 caracteres').optional(),
});

const requestQuerySchema = z.object({
  status: enumOf(REQUEST_STATUSES, 'Estado inválido').optional(),
  donationId: z.string().regex(UUID_RE, 'Donación inválida').optional(),
});

const userQuerySchema = z.object({
  role: enumOf(ROLES, 'Rol inválido').optional(),
  status: enumOf(USER_STATUSES, 'Estado inválido').optional(),
});

module.exports = {
  ROLES,
  PUBLIC_ROLES,
  USER_STATUSES,
  CATEGORIES,
  UNITS,
  DONATION_STATUSES,
  REQUEST_STATUSES,
  UUID_RE,
  todayISO,
  isRealDate,
  registerSchema,
  loginSchema,
  donationSchema,
  requestSchema,
  reasonSchema,
  userStatusSchema,
  donationQuerySchema,
  requestQuerySchema,
  userQuerySchema,
};
