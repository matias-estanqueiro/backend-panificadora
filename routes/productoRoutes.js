import { Router } from 'express'
import { getProductos, getProducto, addProducto, updateProducto, deleteProducto } from '../controllers/productoController.js'

const router = Router()

router.get('/', getProductos)
router.get('/:id', getProducto)
router.post('/', addProducto)
router.put('/:id', updateProducto)
router.delete('/:id', deleteProducto)

export default router
