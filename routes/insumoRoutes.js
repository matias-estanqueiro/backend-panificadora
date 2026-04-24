import { Router } from 'express'
import { addInsumo, getInsumo, getInsumos, updateInsumo, deleteInsumo } from '../controllers/insumoController.js'

const router = Router()

router.get('/', getInsumos)
router.get('/:id', getInsumo)
router.post('/', addInsumo)
router.delete('/:id', deleteInsumo)
router.put('/:id', updateInsumo)

export default router
