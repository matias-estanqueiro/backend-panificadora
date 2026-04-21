import { readFile, writeFile } from 'fs/promises'

const BASE_PATH = 'data'

const readData = async (collection) => {
    const file = `${BASE_PATH}/${collection}.json`
    const data = await readFile(file)

    return JSON.parse(data)
}

const writeData = async (collection, data) => {
    const file = `${BASE_PATH}/${collection}.json`
    await writeFile(file, JSON.stringify(data, null, 4))
}


export { readData, writeData }
