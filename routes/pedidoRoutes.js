import express from 'express';
import { addPedido, getPedidos, getPedido, updatePedido, deletePedido, patchPedidoEstado } from '../controllers/pedidoController.js';

const router = express.Router();

router.get('/', getPedidos);
router.get('/:id', getPedido);
router.put('/:id', updatePedido);
router.delete('/:id', deletePedido);
router.post('/', addPedido);
router.patch('/:id/estado', patchPedidoEstado);

export default router;
