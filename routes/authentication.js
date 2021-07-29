const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { body } = require('express-validator');

const authenticationController = require('../controllers/authentication');

router.put('/signup', [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Enter a valid email, fool')
        .custom((value, { req }) => {
            return User.findOne({email: req.body.email})
                .then(user => {
                    if(user){
                        return Promise.reject('Email Exists');
                    }
                })
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({min: 5}),
    body('name')
        .trim()
        .not()
        .isEmpty()
], authenticationController.signUp);

router.post('/login', authenticationController.login);

module.exports = router;
