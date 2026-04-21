import { Router } from 'express'
import { addInsumo, getInsumo, getInsumos } from '../controllers/insumoController.js'

const router = Router()

router.get('/', getInsumos)
router.get('/:id', getInsumo)
router.post('/', addInsumo)

export default router
