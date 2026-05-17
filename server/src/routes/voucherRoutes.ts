import { Router } from 'express';
import * as voucherController from '../controllers/voucherController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Only Admins manage vouchers
router.use(protect, restrictTo('admin'));

router.get('/', voucherController.getAllVouchers);
router.post('/', voucherController.createVoucher);
router.put('/:id', voucherController.updateVoucher);
router.delete('/:id', voucherController.deactivateVoucher);
router.get('/:id/usage', voucherController.getVoucherUsage);

export default router;
