import { readData, writeData } from '../lib/fs.js'
import UnidadNegocio from '../models/UnidadNegocio.js'
import { v4 as uuidv4 } from 'uuid'
import { generarCodigo } from '../lib/utils.js'
import { unidadNegocioSchema } from '../lib/schemas.js'

const getUnidadesNegocio = async (req, res) => {
  try {
    const unidades = await readData('unidadesNegocio')
    res.json(unidades)
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al obtener unidades de negocio.'
    })
  }
}

const getUnidadNegocio = async (req, res) => {
  try {
    const id = req.params.id
    const unidades = await readData('unidadesNegocio')
    const unidad = unidades.find(e => e.id === id)
    if (!unidad) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `UnidadNegocio not found with ID ${id}`
      })
    }
    res.json(unidad)
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al obtener la unidad de negocio.'
    })
  }
}

const addUnidadNegocio = async (req, res) => {
  try {
    const validacion = unidadNegocioSchema.safeParse(req.body)
    if (!validacion.success) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Errores de validación',
        detalles: validacion.error.issues
      })
    }
    const { nombre, tipo, direccion, activo } = validacion.data
    const codigo = generarCodigo(nombre)
    const unidades = await readData('unidadesNegocio')
    const duplicate = unidades.find(e => e.codigo === codigo && e.activo !== false)
    if (duplicate) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: 'La entidad ya existe.'
      })
    }
    const id = uuidv4()
    const unidad = new UnidadNegocio(id, nombre, codigo, tipo, direccion, activo ?? true)
    await writeData('unidadesNegocio', [ ...unidades, unidad ])
    res.status(201).json({ message: 'UnidadNegocio added.', unidad })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al agregar unidad de negocio.'
    })
  }
}

const updateUnidadNegocio = async (req, res) => {
  try {
    const validacion = unidadNegocioSchema.safeParse(req.body)
    if (!validacion.success) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Errores de validación',
        detalles: validacion.error.issues
      })
    }
    const id = req.params.id
    const { nombre, tipo, direccion, activo } = validacion.data
    const unidades = await readData('unidadesNegocio')
    const index = unidades.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `UnidadNegocio not found with ID ${id}`
      })
    }
    // Si cambia el nombre, regenerar el código y validar duplicado
    if (nombre !== undefined) {
      const nuevoCodigo = generarCodigo(nombre)
      const existe = unidades.find(e => e.codigo === nuevoCodigo && e.id !== id && e.activo !== false)
      if (existe) {
        return res.status(409).json({
          error: true,
          codigo_http: 409,
          mensaje: 'La entidad ya existe.'
        })
      }
      unidades[index].nombre = nombre
      unidades[index].codigo = nuevoCodigo
    }
    if (tipo !== undefined) unidades[index].tipo = tipo
    if (direccion !== undefined) unidades[index].direccion = direccion
    if (activo !== undefined) unidades[index].activo = activo
    await writeData('unidadesNegocio', unidades)
    res.json({ message: 'UnidadNegocio actualizada.', unidad: unidades[index] })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al actualizar la unidad de negocio.'
    })
  }
}

// Baja lógica (soft delete) de UnidadNegocio
const deleteUnidadNegocio = async (req, res) => {
  try {
    const id = req.params.id
    const unidades = await readData('unidadesNegocio')
    const index = unidades.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `UnidadNegocio not found with ID ${id}`
      })
    }
    if (unidades[index].activo === false) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `UnidadNegocio with ID ${id} ya está dada de baja.`
      })
    }
    unidades[index].activo = false
    await writeData('unidadesNegocio', unidades)
    res.json({ message: `UnidadNegocio with ID ${id} dada de baja (soft delete).` })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al dar de baja la unidad de negocio.'
    })
  }
}

export { getUnidadesNegocio, getUnidadNegocio, addUnidadNegocio, updateUnidadNegocio, deleteUnidadNegocio }
