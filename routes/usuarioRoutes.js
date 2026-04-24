import { Router } from 'express'
import { getUsuarios, getUsuario, addUsuario, updateUsuario, deleteUsuario } from '../controllers/usuarioController.js'

const router = Router()

router.get('/', getUsuarios)
router.get('/:id', getUsuario)
router.post('/', addUsuario)
router.put('/:id', updateUsuario)
router.delete('/:id', deleteUsuario)

export default router
