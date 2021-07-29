const express = require('express');
const {body} = require('express-validator');
const isAuthenticated = require('../middleware/is-auth');

const router = express.Router();

const feedController = require('../controllers/feed');

router.get('/posts', isAuthenticated,  feedController.getPosts);

router.get('/post/:id', feedController.getPost);

router.post('/post', isAuthenticated, [body('title').trim().isLength({min: 5}), body('content').trim().isLength({min: 5})], feedController.postPost);

router.put('/post/:id', isAuthenticated, [body('title').trim().isLength({min: 5}), body('content').trim().isLength({min: 5})], feedController.updatePost);

router.delete('/post/:postId', isAuthenticated, feedController.deletePost);

module.exports = router;
