import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { mkdir, access } from 'fs/promises'

const BASE_PATH = 'data'


// Función auxiliar no exportada
const ensureFileExists = async (filePath) => {
    const dir = path.dirname(filePath)
    // Crear directorio si no existe
    try {
        await mkdir(dir, { recursive: true })
    } catch (e) {}
    // Verificar si el archivo existe
    try {
        await access(filePath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            await writeFile(filePath, '[]')
        } else {
            throw err
        }
    }
}

const readData = async (collection) => {
    const file = `${BASE_PATH}/${collection}.json`
    await ensureFileExists(file)
    const data = await readFile(file)
    return JSON.parse(data)
}

const writeData = async (collection, data) => {
    const file = `${BASE_PATH}/${collection}.json`
    await ensureFileExists(file)
    await writeFile(file, JSON.stringify(data, null, 4))
}


export { readData, writeData }
