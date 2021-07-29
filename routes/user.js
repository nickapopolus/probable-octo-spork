const express = require('express');
const userController = require('../controllers/user');
const { body } = require('express-validator');
const isAuth = require('../middleware/is-auth');


const router = express.Router();

router.get('/status', isAuth, userController.getUserStatus);

router.patch('/status', isAuth, [ body('status').trim().not().isEmpty() ], userController.updateUserStatus);

module.exports = router;
