import { readData, writeData } from '../lib/fs.js'
import Producto from '../models/Producto.js'
import { v4 as uuidv4 } from 'uuid'
import { generarCodigo } from '../lib/utils.js'
import { productoSchema } from '../lib/schemas.js'

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
    const validacion = productoSchema.safeParse(req.body)
    if (!validacion.success) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Errores de validación',
        detalles: validacion.error.issues
      })
    }
    const { nombre, precio_costo, precio_franquicia, activo } = validacion.data
    const codigo = generarCodigo(nombre)
    const productos = await readData('productos')
    const existente = productos.find(p => p.codigo === codigo);
    if (existente) {
      if (existente.activo !== false) {
        return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'El producto ya existe.' });
      } else {
        // Resurrección (Auto-Upsert)
        existente.activo = true;
        existente.nombre = nombre;
        existente.precio_costo = precio_costo;
        existente.precio_franquicia = precio_franquicia;
        await writeData('productos', productos);
        return res.status(200).json({ mensaje: 'Producto reactivado y actualizado exitosamente.', producto: existente });
      }
    }
    const id = uuidv4()
    // El modelo espera: id, nombre, codigo, unidad, precio_costo, precio_franquicia, activo
    const producto = new Producto(id, nombre, codigo, precio_costo, precio_franquicia, activo ?? true)
    await writeData('productos', [ ...productos, producto ])
    res.status(201).json({ message: `El producto con ID ${id} ha sido agregado correctamente.`, producto })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: `Error al agregar el producto.`
    })
  }
}

const updateProducto = async (req, res) => {
  try {
    const id = req.params.id
    const productos = await readData('productos')
    const index = productos.findIndex(e => e.id === id)
    if (index === -1) {
      return res.status(404).json({
        error: true,
        codigo_http: 404,
        mensaje: `El producto con ID ${id} no fue encontrado.`
      })
    }
    if (productos[index].activo === false) {
      return res.status(409).json({ error: true, codigo_http: 409, mensaje: 'No se puede editar un producto inactivo.' });
    }
    const validacion = productoSchema.safeParse(req.body)
    if (!validacion.success) {
      return res.status(400).json({
        error: true,
        codigo_http: 400,
        mensaje: 'Errores de validación',
        detalles: validacion.error.issues
      })
    }
    const { nombre, precio_costo, precio_franquicia, activo } = validacion.data
    // Si cambia el nombre, regenerar el código y validar duplicado
    if (nombre !== undefined) {
      const nuevoCodigo = generarCodigo(nombre)
      const existe = productos.find(e => e.codigo === nuevoCodigo && e.id !== id && e.activo !== false)
      if (existe) {
        return res.status(409).json({
          error: true,
          codigo_http: 409,
          mensaje: 'El producto ya existe.'
        })
      }
      productos[index].nombre = nombre
      productos[index].codigo = nuevoCodigo
    }
    if (precio_costo !== undefined) productos[index].precio_costo = precio_costo
    if (precio_franquicia !== undefined) productos[index].precio_franquicia = precio_franquicia
    if (activo !== undefined) productos[index].activo = activo
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
        mensaje: `El producto con ID ${id} no fue encontrado.`
      })
    }
    if (productos[index].activo === false) {
      return res.status(409).json({
        error: true,
        codigo_http: 409,
        mensaje: `El producto con ID ${id} ya está dado de baja.`
      })
    }
    productos[index].activo = false
    await writeData('productos', productos)
    res.json({ message: `El producto con ID ${id} ha sido dado de baja (soft delete).` })
  } catch (error) {
    res.status(500).json({
      error: true,
      codigo_http: 500,
      mensaje: `Error al dar de baja el producto con ID ${id}.`
    })
  }
}

export { getProductos, getProducto, addProducto, updateProducto, deleteProducto }
