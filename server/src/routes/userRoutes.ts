import { Router } from 'express';
import * as userController from '../controllers/userController';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import Joi from 'joi';

const router = Router();

// All user routes require authentication
router.use(protect);

router.get('/me', userController.getProfile);

router.patch(
  '/me',
  validate(
    Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      phone: Joi.string(),
      avatar: Joi.string(),
    })
  ),
  userController.updateProfile
);

router.patch(
  '/me/password',
  validate(
    Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must be at least 8 characters long and contain at least one uppercase letter and one number')
        .required(),
    })
  ),
  userController.changePassword
);

const addressSchema = Joi.object({
  label: Joi.string().optional(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().required(),
  country: Joi.string().required(),
  isDefault: Joi.boolean().default(false),
});

router.post('/me/addresses', validate(addressSchema), userController.addAddress);
router.patch('/me/addresses/:id', validate(addressSchema), userController.updateAddress);
router.delete('/me/addresses/:id', userController.deleteAddress);

router.get('/me/wishlist', userController.getWishlist);
router.post('/me/wishlist/:productId', userController.toggleWishlist);

router.get('/me/orders', userController.getUserOrders);

export default router;
