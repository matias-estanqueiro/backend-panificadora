import { readData, writeData } from '../lib/fs.js'
import Producto from '../models/Producto.js'
import { v4 as uuidv4 } from 'uuid'

const getProductos = async (req, res) => {
  try {
    const productos = await readData('productos')
    res.json(productos)
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al obtener productos.'
    })
  }
}

const getProducto = async (req, res) => {
  try {
    const id = req.params.id
    const productos = await readData('productos')
    const producto = productos.find(e => e.id === id)
    if (!producto) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `Producto not found with ID ${id}`
      })
    }
    res.json(producto)
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al obtener el producto.'
    })
  }
}

const addProducto = async (req, res) => {
  try {
    const { nombre, unidad, precio_costo, precio_franquicia } = req.body
    if (!nombre || !unidad || precio_costo === undefined || precio_franquicia === undefined) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Faltan datos obligatorios para crear el producto.'
      })
    }
    const id = uuidv4()
    const producto = new Producto(id, nombre, unidad, precio_costo, precio_franquicia, true)
    const productos = await readData('productos')
    const duplicate = productos.find(e => e.id === id)
    if (duplicate) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `Producto with ID ${id} already exists. Producto was not added.`
      })
    }
    await writeData('productos', [ ...productos, producto ])
    res.status(201).json({ message: 'Producto added.', producto })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al agregar producto.'
    })
  }
}

const updateProducto = async (req, res) => {
  try {
    const id = req.params.id
    const { nombre, unidad, precio_costo, precio_franquicia } = req.body
    const productos = await readData('productos')
    const index = productos.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `Producto not found with ID ${id}`
      })
    }
    // Actualizar solo los campos enviados
    if (nombre !== undefined) productos[index].nombre = nombre
    if (unidad !== undefined) productos[index].unidad = unidad
    if (precio_costo !== undefined) productos[index].precio_costo = precio_costo
    if (precio_franquicia !== undefined) productos[index].precio_franquicia = precio_franquicia
    await writeData('productos', productos)
    res.json({ message: 'Producto actualizado.', producto: productos[index] })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al actualizar producto.'
    })
  }
}

const deleteProducto = async (req, res) => {
  try {
    const id = req.params.id
    const productos = await readData('productos')
    const index = productos.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `Producto not found with ID ${id}`
      })
    }
    if (productos[index].activo === false) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `Producto with ID ${id} ya está dado de baja.`
      })
    }
    productos[index].activo = false
    await writeData('productos', productos)
    res.json({ message: `Producto with ID ${id} dado de baja (soft delete).` })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: 'Error al dar de baja el producto.'
    })
  }
}

export { getProductos, getProducto, addProducto, updateProducto, deleteProducto }
