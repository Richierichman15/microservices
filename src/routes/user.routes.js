const express = require('express');
const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

// Routes for admin only
router
  .route('/')
  .get(
    authorize('admin'),
    validate(userValidation.getUsers),
    userController.getUsers
  )
  .post(
    authorize('admin'),
    validate(userValidation.createUser),
    userController.createUser
  );

router
  .route('/:id')
  .get(
    authorize('admin'),
    validate(userValidation.getUser),
    userController.getUser
  )
  .patch(
    authorize('admin'),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    authorize('admin'),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

module.exports = router; 