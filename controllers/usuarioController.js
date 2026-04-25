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
        mensaje: `Usuario not found with ID ${id}`
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
    const duplicateEmail = usuarios.find(e => e.email === emailNorm && e.activo !== false)
    if (duplicateEmail) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: 'El email ya está registrado para otro usuario.'
      })
    }
    const id = uuidv4()
    const usuario = new Usuario(id, nombre, emailNorm, rol, unidad_negocio_id, true)
    await writeData('usuarios', [ ...usuarios, usuario ])
    res.status(201).json({ message: 'Usuario added.', usuario })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al agregar usuario.'
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
        mensaje: `Usuario not found with ID ${id}`
      })
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
      usuarios[index].unidad_negocio_id = unidad_negocio_id
    }
    if (activo !== undefined) usuarios[index].activo = activo
    await writeData('usuarios', usuarios)
    res.json({ message: 'Usuario actualizado.', usuario: usuarios[index] })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al actualizar usuario.'
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
        mensaje: `Usuario not found with ID ${id}`
      })
    }
    if (usuarios[index].activo === false) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `Usuario with ID ${id} ya está dado de baja.`
      })
    }
    usuarios[index].activo = false
    await writeData('usuarios', usuarios)
    res.json({ message: `Usuario with ID ${id} dado de baja (soft delete).` })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al dar de baja el usuario.'
    })
  }
}

export { getUsuarios, getUsuario, addUsuario, updateUsuario, deleteUsuario }
