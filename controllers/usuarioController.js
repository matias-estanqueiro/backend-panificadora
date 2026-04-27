import { readData, writeData } from '../lib/fs.js'
import Usuario from '../models/Usuario.js'
import { v4 as uuidv4 } from 'uuid'
import { usuarioSchema } from '../lib/schemas.js'

const getUsuarios = async (req, res) => {
  try {
    const usuarios = await readData('usuarios')
    res.json(usuarios)
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al obtener usuarios.'
    })
  }
}

const getUsuario = async (req, res) => {
  try {
    const id = req.params.id
    const usuarios = await readData('usuarios')
    const usuario = usuarios.find(e => e.id === id)
    if (!usuario) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `El usuario con ID ${id} no fue encontrado.`
      })
    }
    res.json(usuario)
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al obtener el usuario.'
    })
  }
}

const addUsuario = async (req, res) => {
  try {
    const validacion = usuarioSchema.safeParse(req.body)
    if (!validacion.success) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Errores de validación',
        detalles: validacion.error.issues
      })
    }
    const { nombre, email, rol, unidad_negocio_id } = validacion.data
    const emailNorm = email.trim().toLowerCase()
    const usuarios = await readData('usuarios')
    const unidades = await readData('unidadesNegocio')
    const unidad = unidades.find(u => u.id === unidad_negocio_id && u.activo !== false)
    if (!unidad) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: 'La unidad de negocio asignada no existe o está inactiva.'
      })
    }
    if (rol === 'ADMIN_PLANTA' && unidad.tipo !== 'PLANTA_CENTRAL') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Un ADMIN_PLANTA solo puede pertenecer a una PLANTA_CENTRAL.' });
    }
    if (rol === 'ENCARGADO_SUCURSAL' && unidad.tipo !== 'SUCURSAL_PROPIA') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Un ENCARGADO_SUCURSAL solo puede pertenecer a una SUCURSAL_PROPIA.' });
    }
    if (rol === 'FRANQUICIADO' && unidad.tipo !== 'FRANQUICIA') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Un FRANQUICIADO solo puede pertenecer a una FRANQUICIA.' });
    }
    const existente = usuarios.find(e => e.email === emailNorm);
    if (existente) {
      if (existente.activo !== false) {
        return res.status(409).json({
          error: true,
          codigo_http: 409,
          mensaje: 'El email ya está registrado para otro usuario.'
        });
      } else {
        // Resurrección (Auto-Upsert)
        existente.activo = true;
        existente.nombre = nombre;
        // el email ya coincide, no hace falta pisarlo
        existente.rol = rol;
        existente.unidad_negocio_id = unidad_negocio_id;
        
        await writeData('usuarios', usuarios);
        return res.status(200).json({ message: 'El usuario ha sido reactivado y actualizado correctamente.', usuario: existente });
      }
    }
    const id = uuidv4()
    const usuario = new Usuario(id, nombre, emailNorm, rol, unidad_negocio_id, true)
    await writeData('usuarios', [ ...usuarios, usuario ])
    res.status(201).json({ message: 'El usuario ha sido agregado correctamente.', usuario })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al agregar el usuario.'
    })
  }
}

const updateUsuario = async (req, res) => {
  try {
    const id = req.params.id
    const usuarios = await readData('usuarios')
    const index = usuarios.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `El usuario con ID ${id} no fue encontrado.`
      })
    }
    if (usuarios[index].activo === false) {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'No se puede editar un usuario inactivo.' });
    }
    const validacion = usuarioSchema.safeParse(req.body)
    if (!validacion.success) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Errores de validación',
        detalles: validacion.error.issues
      })
    }
    const { nombre, email, rol, unidad_negocio_id, activo } = validacion.data
    
    // 1. Calcular cuáles serán el rol y la unidad finales (los nuevos o los que ya tenía)
    const rolFinal = rol !== undefined ? rol : usuarios[index].rol;
    const unidadIdFinal = unidad_negocio_id !== undefined ? unidad_negocio_id : usuarios[index].unidad_negocio_id;

    // 2. Validar el cruce Rol vs Unidad
    const unidades = await readData('unidadesNegocio');
    const unidadFinal = unidades.find(u => u.id === unidadIdFinal && u.activo !== false);
    
    if (!unidadFinal) {
      return res.status(404).json({ error: true, codigo_http: 404, mensaje: 'La unidad de negocio asignada no existe o está inactiva.' });
    }
    if (rolFinal === 'ADMIN_PLANTA' && unidadFinal.tipo !== 'PLANTA_CENTRAL') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Un ADMIN_PLANTA solo puede pertenecer a una PLANTA_CENTRAL.' });
    }
    if (rolFinal === 'ENCARGADO_SUCURSAL' && unidadFinal.tipo !== 'SUCURSAL_PROPIA') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Un ENCARGADO_SUCURSAL solo puede pertenecer a una SUCURSAL_PROPIA.' });
    }
    if (rolFinal === 'FRANQUICIADO' && unidadFinal.tipo !== 'FRANQUICIA') {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'Un FRANQUICIADO solo puede pertenecer a una FRANQUICIA.' });
    }
    // Validar email si se actualiza
    if (email !== undefined) {
      const emailNorm = email.trim().toLowerCase()
      const duplicateEmail = usuarios.find(e => e.email === emailNorm && e.id !== id && e.activo !== false)
      if (duplicateEmail) {
        return res.status(409).json({
          error: true,
          codigo_http: 409,
          mensaje: 'El email ya está registrado para otro usuario.'
        })
      }
      usuarios[index].email = emailNorm
    }
    if (nombre !== undefined) {
      usuarios[index].nombre = nombre
    }
    if (rol !== undefined) {
      usuarios[index].rol = rol
    }
    if (unidad_negocio_id !== undefined) {
      const unidades = await readData('unidadesNegocio')
      const unidad = unidades.find(u => u.id === unidad_negocio_id && u.activo !== false)
      if (!unidad) {
        return res.status(404).json({
          error: true,
          codigo_http: 404,
          mensaje: 'La unidad de negocio asignada no existe o está inactiva.'
        })
      }
      usuarios[index].unidad_negocio_id = unidad_negocio_id
    }
    if (activo !== undefined) usuarios[index].activo = activo
    await writeData('usuarios', usuarios)
    res.json({ message: 'El usuario ha sido actualizado correctamente.', usuario: usuarios[index] })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al actualizar el usuario.'
    })
  }
}

const deleteUsuario = async (req, res) => {
  try {
    const id = req.params.id
    const usuarios = await readData('usuarios')
    const index = usuarios.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `El usuario con ID ${id} no fue encontrado.`
      })
    }
    if (usuarios[index].activo === false) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `El usuario con ID ${id} ya está dado de baja.`
      })
    }
    usuarios[index].activo = false
    await writeData('usuarios', usuarios)
    res.json({ message: `El usuario con ID ${id} ha sido dado de baja (soft delete).` })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al dar de baja el usuario.'
    })
  }
}

export { getUsuarios, getUsuario, addUsuario, updateUsuario, deleteUsuario }
