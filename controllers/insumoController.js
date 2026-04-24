import { readData, writeData } from "../lib/fs.js"
import Insumo from "../models/Insumo.js"
import { v4 as uuidv4 } from "uuid"


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
        const { nombre, unidad, cantidad } = req.body
        if (!nombre || !unidad || cantidad === undefined) {
            return res.status(400).json({
                error: true,
                codigo_http: 400,
                mensaje: 'Faltan datos obligatorios para crear el insumo.'
            })
        }
        const id = uuidv4()
        const insumo = new Insumo(id, nombre, unidad, cantidad, true)
        const insumos = await readData('insumos')
        const duplicate = insumos.find(e => e.id === id)
        if (duplicate) {
            return res.status(409).json({
                error: true,
                codigo_http: 409,
                mensaje: `Insumo with ID ${id} already exists. Insumo was not added.`
            })
        }
        await writeData('insumos', [ ...insumos, insumo ])
        res.status(201).json({ message: "Insumo added.", insumo: insumo })
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
        const { nombre, unidad, cantidad } = req.body
        const insumos = await readData('insumos')
        const index = insumos.findIndex(e => e.id === id)
        if (index === -1) {
            return res.status(404).json({
                error: true,
                codigo_http: 404,
                mensaje: `Insumo not found with ID ${id}`
            })
        }
        if (nombre !== undefined) insumos[index].nombre = nombre
        if (unidad !== undefined) insumos[index].unidad = unidad
        if (cantidad !== undefined) insumos[index].cantidad = cantidad
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
