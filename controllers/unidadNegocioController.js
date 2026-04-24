import { readData, writeData } from '../lib/fs.js'
import UnidadNegocio from '../models/UnidadNegocio.js'
import { v4 as uuidv4 } from 'uuid'

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
    const { nombre, tipo } = req.body
    if (!nombre || !tipo) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Faltan datos obligatorios para crear la unidad de negocio.'
      })
    }
    const id = uuidv4()
    const unidad = new UnidadNegocio(id, nombre, tipo, true)
    const unidades = await readData('unidadesNegocio')
    const duplicate = unidades.find(e => e.id === id)
    if (duplicate) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `UnidadNegocio with ID ${id} already exists. UnidadNegocio was not added.`
      })
    }
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
    const id = req.params.id
    const { nombre, tipo } = req.body
    const unidades = await readData('unidadesNegocio')
    const index = unidades.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `UnidadNegocio not found with ID ${id}`
      })
    }
    if (nombre !== undefined) unidades[index].nombre = nombre
    if (tipo !== undefined) unidades[index].tipo = tipo
    await writeData('unidadesNegocio', unidades)
    res.json({ message: 'UnidadNegocio actualizada.', unidad: unidades[index] })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al actualizar unidad de negocio.'
    })
  }
}

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
