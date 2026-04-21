import { readData, writeData } from "../lib/fs.js"
import Insumo from "../models/Insumo.js"
import { v4 as uuidv4 } from "uuid"

const getInsumos = async (req, res) => {
    const insumos = await readData('insumos')

    res.json(insumos)
}

const getInsumo = async (req, res) => {
    const id = req.params.id

    // read from json
    const insumos = await readData('insumos')

    // search insumo
    const insumo = insumos.find(e => e.id === id)

    if (!insumo) {
        res.json({ message: `Insumo not found with ID ${id}`})
    }

    res.json(insumo)
}

const addInsumo = async (req, res) => {
    const { nombre, unidad, cantidad } = req.body

    // create new insumo
    const id = uuidv4()
    const insumo = new Insumo(id, nombre, unidad, cantidad)
    
    // read from json
    const insumos = await readData('insumos')

    // is duplicated?
    const duplicate = insumos.find(e => e.id === id)

    if (duplicate) {
        return res.json({ message: `Insumo with ID ${id} already exists. Insumo was not added.`})
    }

    // save it
    await writeData('insumos', [ ...insumos, insumo ])

    res.json({ message: "Insumo added.", insumo: insumo})
}

export { getInsumos, getInsumo, addInsumo }
