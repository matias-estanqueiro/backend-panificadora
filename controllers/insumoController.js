

import { readData, writeData } from "../lib/fs.js"
import Insumo from "../models/Insumo.js"
import { v4 as uuidv4 } from "uuid"
import { generarCodigo } from "../lib/utils.js"
import { insumoSchema } from "../lib/schemas.js"


const getInsumos = async (req, res) => {
    try {
        const insumos = await readData('insumos')
        res.json(insumos)
    } catch (error) {
        res.status(500).json({
            error: true,
            codigo_http: 500,
            mensaje: 'Error al obtener insumos.'
        })
    }
}


const getInsumo = async (req, res) => {
    try {
        const id = req.params.id
        const insumos = await readData('insumos')
        const insumo = insumos.find(e => e.id === id)
        if (!insumo) {
            return res.status(404).json({
                error: true,
                codigo_http: 404,
                mensaje: `Insumo not found with ID ${id}`
            })
        }
        res.json(insumo)
    } catch (error) {
        res.status(500).json({
            error: true,
            codigo_http: 500,
            mensaje: 'Error al obtener el insumo.'
        })
    }
}


const addInsumo = async (req, res) => {
    try {
        const validacion = insumoSchema.safeParse(req.body)
        if (!validacion.success) {
            return res.status(400).json({
                error: true,
                codigo_http: 400,
                mensaje: 'Errores de validación',
                detalles: validacion.error.issues
            })
        }
        const { nombre, unidad_medida, stock_actual, punto_pedido, activo } = validacion.data
        const codigo = generarCodigo(nombre)
        const insumos = await readData('insumos')
        const duplicate = insumos.find(e => e.codigo === codigo && e.activo !== false)
        if (duplicate) {
            return res.status(409).json({
                error: true,
                codigo_http: 409,
                mensaje: 'La entidad ya existe.'
            })
        }
        const id = uuidv4()
        const insumo = new Insumo(id, nombre, codigo, unidad_medida, stock_actual, punto_pedido, activo ?? true)
        await writeData('insumos', [ ...insumos, insumo ])
        res.status(201).json({ message: "Insumo added.", insumo })
    } catch (error) {
        res.status(500).json({
            error: true,
            codigo_http: 500,
            mensaje: 'Error al agregar insumo.'
        })
    }
}

const deleteInsumo = async (req, res) => {
    try {
        const id = req.params.id
        const insumos = await readData('insumos')
        const index = insumos.findIndex(e => e.id === id)
        if (index === -1) {
            return res.status(404).json({
                error: true,
                codigo_http: 404,
                mensaje: `Insumo not found with ID ${id}`
            })
        }
        if (insumos[index].activo === false) {
            return res.status(409).json({
                error: true,
                codigo_http: 409,
                mensaje: `Insumo with ID ${id} ya está dado de baja.`
            })
        }
        insumos[index].activo = false
        await writeData('insumos', insumos)
        res.json({ message: `Insumo with ID ${id} dado de baja (soft delete).` })
    } catch (error) {
        res.status(500).json({
            error: true,
            codigo_http: 500,
            mensaje: 'Error al dar de baja el insumo.'
        })
    }
}

const updateInsumo = async (req, res) => {
    try {
        const id = req.params.id
        const insumos = await readData('insumos')
        const index = insumos.findIndex(e => e.id === id)
        if (index === -1) {
            return res.status(404).json({
                error: true,
                codigo_http: 404,
                mensaje: `Insumo not found with ID ${id}`
            })
        }
        const validacion = insumoSchema.safeParse(req.body)
        if (!validacion.success) {
            return res.status(400).json({
                error: true,
                codigo_http: 400,
                mensaje: 'Errores de validación',
                detalles: validacion.error.issues
            })
        }
        const { nombre, unidad_medida, stock_actual, punto_pedido, activo } = validacion.data
        // Si cambia el nombre, regenerar el código y validar duplicado
        if (nombre !== undefined) {
            const nuevoCodigo = generarCodigo(nombre)
            const existe = insumos.find(e => e.codigo === nuevoCodigo && e.id !== id && e.activo !== false)
            if (existe) {
                return res.status(409).json({
                    error: true,
                    codigo_http: 409,
                    mensaje: 'La entidad ya existe.'
                })
            }
            insumos[index].nombre = nombre
            insumos[index].codigo = nuevoCodigo
        }
        if (unidad_medida !== undefined) insumos[index].unidad_medida = unidad_medida
        if (stock_actual !== undefined) insumos[index].stock_actual = stock_actual
        if (punto_pedido !== undefined) insumos[index].punto_pedido = punto_pedido
        if (activo !== undefined) insumos[index].activo = activo
        await writeData('insumos', insumos)
        res.json({ message: 'Insumo actualizado.', insumo: insumos[index] })
    } catch (error) {
        res.status(500).json({
            error: true,
            codigo_http: 500,
            mensaje: 'Error al actualizar insumo.'
        })
    }
}

export { getInsumos, getInsumo, addInsumo, deleteInsumo, updateInsumo }
