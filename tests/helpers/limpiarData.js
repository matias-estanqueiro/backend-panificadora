import fs from 'fs'
import path from 'path'

const dataDir = path.resolve(process.cwd(), 'data')

export function limpiarData() {
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true })
  }
  fs.mkdirSync(dataDir, { recursive: true })
}
