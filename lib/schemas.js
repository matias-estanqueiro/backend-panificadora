// ---------- PEDIDO
// PATCH: Cambiar estado del pedido (solo estado, no detalles ni unidad_negocio_id ni usuario_id)
export const pedidoCambioEstadoSchema = z.object({
  usuario_id: z.string().uuid({ message: 'El ID de usuario debe ser un UUID válido.' }),
  estado: z.enum(['EN_PRODUCCION', 'DESPACHADO', 'ENTREGADO'], { message: 'Estado inválido.' })
});

// PUT: Actualizar detalles de un pedido (solo payload de detalles, no se puede cambiar unidad_negocio_id ni usuario_id)
export const pedidoVentaUpdateSchema = z.object({
  detalles: z.array(
    z.object({
      producto_id: z.string().uuid({ message: 'El ID de producto debe ser un UUID válido.' }),
      cantidad: z.number()
        .int({ message: 'La cantidad debe ser un número entero.' })
        .min(1, { message: 'La cantidad mínima es 1.' })
    })
  ).min(1, { message: 'Debe incluir al menos un detalle de producto.' })
});

// POST: Crear nuevo pedido
export const pedidoVentaPayloadSchema = z.object({
  unidad_negocio_id: z.string().uuid({ message: 'El ID de unidad de negocio debe ser un UUID válido.' }),
  usuario_id: z.string().uuid({ message: 'El ID de usuario debe ser un UUID válido.' }),
  detalles: z.array(
    z.object({
      producto_id: z.string().uuid({ message: 'El ID de producto debe ser un UUID válido.' }),
      cantidad: z.number()
        .int({ message: 'La cantidad debe ser un número entero.' })
        .min(1, { message: 'La cantidad mínima es 1.' })
    })
  ).min(1, { message: 'Debe incluir al menos un detalle de producto.' })
});
import { z } from 'zod'

// ---------- INSUMO
export const insumoSchema = z.object({
  nombre: z.string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede superar 50 caracteres.' })
    .regex(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/, { message: 'El nombre solo puede contener letras, números y espacios.' }),
  unidad_medida: z.enum(['KG', 'LTS', 'UN'], { message: 'La unidad de medida debe ser KG, LTS o UN.' }),
  stock_actual: z.number().nonnegative({ message: 'El stock actual debe ser mayor o igual a 0.' }),
  punto_pedido: z.number().nonnegative({ message: 'El punto de pedido debe ser mayor o igual a 0.' }),
  activo: z.boolean().optional()
})

// ---------- PRODUCTO
export const productoSchema = z.object({
  nombre: z.string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede superar 50 caracteres.' })
    .regex(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/, { message: 'El nombre solo puede contener letras, números y espacios.' }),
  precio_costo: z.number().gt(0, { message: 'El precio de costo debe ser mayor a 0.' }),
  precio_franquicia: z.number().gt(0, { message: 'El precio de franquicia debe ser mayor a 0.' }),
  activo: z.boolean().optional()
})

// ---------- UNIDAD DE NEGOCIO
export const unidadNegocioSchema = z.object({
  nombre: z.string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede superar 50 caracteres.' })
    .regex(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/, { message: 'El nombre solo puede contener letras, números y espacios.' }),
  tipo: z.enum(['PLANTA_CENTRAL', 'SUCURSAL_PROPIA', 'FRANQUICIA'], { message: 'El tipo debe ser PLANTA_CENTRAL, SUCURSAL_PROPIA o FRANQUICIA.' }),
  direccion: z.string()
    .min(5, { message: 'La dirección debe tener al menos 5 caracteres.' })
    .max(100, { message: 'La dirección no puede superar 100 caracteres.' }),
  activo: z.boolean().optional()
})

// ---------- USUARIO
export const usuarioSchema = z.object({
  nombre: z.string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede superar 50 caracteres.' })
    .regex(/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/, { message: 'El nombre solo puede contener letras y espacios.' }),
  email: z.string().email({ message: 'El email debe tener un formato válido.' }),
  rol: z.enum(['ADMIN_PLANTA', 'ENCARGADO_SUCURSAL', 'FRANQUICIADO'], { message: 'El rol debe ser ADMIN_PLANTA, ENCARGADO_SUCURSAL o FRANQUICIADO.' }),
  unidad_negocio_id: z.string().uuid({ message: 'El ID de unidad de negocio debe ser un UUID válido.' })
})
