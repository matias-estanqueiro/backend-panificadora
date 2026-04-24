import { z } from 'zod'

// Insumo
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

// Producto
export const productoSchema = z.object({
  nombre: z.string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede superar 50 caracteres.' })
    .regex(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/, { message: 'El nombre solo puede contener letras, números y espacios.' }),
  precio_costo: z.number().gt(0, { message: 'El precio de costo debe ser mayor a 0.' }),
  precio_franquicia: z.number().gt(0, { message: 'El precio de franquicia debe ser mayor a 0.' }),
  activo: z.boolean().optional()
})

// Unidad de Negocio
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

// Usuario
export const usuarioSchema = z.object({
  nombre: z.string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede superar 50 caracteres.' })
    .regex(/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/, { message: 'El nombre solo puede contener letras y espacios.' }),
  email: z.string().email({ message: 'El email debe tener un formato válido.' }),
  rol: z.enum(['ADMIN_PLANTA', 'ENCARGADO_SUCURSAL', 'FRANQUICIADO'], { message: 'El rol debe ser ADMIN_PLANTA, ENCARGADO_SUCURSAL o FRANQUICIADO.' }),
  unidad_negocio_id: z.string().uuid({ message: 'El ID de unidad de negocio debe ser un UUID válido.' })
})
