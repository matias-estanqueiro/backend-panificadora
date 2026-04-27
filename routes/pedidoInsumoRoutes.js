// routes/pedidoInsumoRoutes.js
import { Router } from 'express';
import {
  addPedidoInsumo,
  getPedidosInsumos,
  getPedidoInsumo,
  updatePedidoInsumo,
  deletePedidoInsumo,
  patchEstadoInsumo
} from '../controllers/pedidoInsumoController.js';

const router = Router();


router.get('/', getPedidosInsumos);
router.get('/:id', getPedidoInsumo);
router.post('/', addPedidoInsumo);
router.put('/:id', updatePedidoInsumo);
router.delete('/:id', deletePedidoInsumo);
router.patch('/:id/estado', patchEstadoInsumo);

export default router;
