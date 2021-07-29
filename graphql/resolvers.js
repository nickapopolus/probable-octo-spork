const User = require('../models/user');
const Post = require('../models/post')
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

module.exports = {
    hello() {
        return {
            text: 'Hello World',
            views: 25
        };
    },

    createUser: async function({ UserInputData: user }, request) {
        const errors = [];
        if(!validator.isEmail(user.email)){
            errors.push({ message: 'Email is invalid'});
        };
        if(validator.isEmpty(user.password) || !validator.isLength(user.password, { min: 5 })){
            errors.push( {message: 'Password Sucks'});
        };
        if(validator.isEmpty(user.name)){
            errors.push({message: 'Name yourself!'});
        };
        if(errors.length > 0) {
            const error = new Error('Invalid inputs');
            error.code = 422;
            error.data = errors;
            throw error;
        }
        const existingUser = await User.findOne({email: user.email});
        if(existingUser){
            const error = new Error('User Already Exists');

            throw error;
        }
        const hashedPassword = await bcrypt.hash(user.password, 12);
        const newUser = new User({
            email: user.email,
            name: user.name,
            password: hashedPassword
        });
        const createdUser = await newUser.save();
        return { ...createdUser._doc, _id: createdUser._id.toString()};
    },

    login: async function({email, password}) {
        const user = await User.findOne({email: email});
        if(!user) {
            const error = new Error('User Not Found!');
            error.code = 422;
            throw error;
        }
        const isPasswordEqual = await bcrypt.compare(password, user.password);
        if(!isPasswordEqual){
            const error = new Error('Speak Friend and Enter');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({userId: user._id, email: user.email}, 'Calmer25Than25You25Are.', {expiresIn: '1h'});
        return {token: token, userId: user._id.toString()};
    },

    createPost: async function({PostInputData: post}, request) {
        if(!request.isAuth) {
            const error = new Error('Not Authenticated');
            error.code = 401;
            throw error;
        }
        const errors = [];
        if(validator.isEmpty(post.title) || !validator.isLength(post.title, {min: 5})) {
            errors.push({ message: 'Your Title Sucks'});
        }
        if(validator.isEmpty(post.content) || !validator.isLength(post.content, {min: 5})) {
            errors.push({ message: 'Your Content Sucks'});
        }
        if (errors.length > 0) {
            const error = new Error('Invalid Input');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        const user = await User.findOne({_id: request.userId});
        if(!user){
            const error = new Error('Invalid User');
            error.code = 422;
            throw error;
        }
        const newPost = new Post({
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            creator: user._id
        });
        const createdPost = await newPost.save();
        user.posts.push(createdPost);
        await user.save();
        return {...createdPost._doc,
            id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()}
    }
};
