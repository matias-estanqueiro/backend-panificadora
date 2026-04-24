import { Router } from 'express'
import { getUnidadesNegocio, getUnidadNegocio, addUnidadNegocio, updateUnidadNegocio, deleteUnidadNegocio } from '../controllers/unidadNegocioController.js'

const router = Router()

router.get('/', getUnidadesNegocio)
router.get('/:id', getUnidadNegocio)
router.post('/', addUnidadNegocio)
router.put('/:id', updateUnidadNegocio)
router.delete('/:id', deleteUnidadNegocio)

export default router
