import { readData, writeData } from '../lib/fs.js'
import Usuario from '../models/Usuario.js'
import { v4 as uuidv4 } from 'uuid'

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
    const { nombre, rol, unidad_negocio_id } = req.body
    if (!nombre || !rol || !unidad_negocio_id) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Faltan datos obligatorios para crear el usuario.'
      })
    }
    const id = uuidv4()
    const usuario = new Usuario(id, nombre, rol, unidad_negocio_id, true)
    const usuarios = await readData('usuarios')
    const duplicate = usuarios.find(e => e.id === id)
    if (duplicate) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `Usuario with ID ${id} already exists. Usuario was not added.`
      })
    }
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
    const { nombre, rol, unidad_negocio_id } = req.body
    const usuarios = await readData('usuarios')
    const index = usuarios.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `Usuario not found with ID ${id}`
      })
    }
    if (nombre !== undefined) usuarios[index].nombre = nombre
    if (rol !== undefined) usuarios[index].rol = rol
    if (unidad_negocio_id !== undefined) usuarios[index].unidad_negocio_id = unidad_negocio_id
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
