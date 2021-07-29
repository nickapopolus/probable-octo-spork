const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jsonWebToken = require('jsonwebtoken');

const {validationResult} = require('express-validator');

exports.signUp = async (request, response, next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        error.data = errors.array();
        next(error);
    }
    const email = request.body.email;
    const name = request.body.name;
    const password = request.body.password;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashedPassword,
        });
        const savedUser = await user.save();
        response.status(201).json({message: 'User created!', userId: savedUser._id});
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.login = async (request, response, next) => {
    const email = request.body.email;
    const password = request.body.password;
    const loadedUser = await User.findOne( {email: email});
     try {
         if (!loadedUser) {
             const error = new Error('There\'s no one here by that name');
             error.statusCode = 401;
             next(error);
         }
         const isPasswordCorrect = await bcrypt.compare(password, loadedUser.password);
         if (!isPasswordCorrect) {
             const error = new Error('That isnt the code word.');
             error.statusCode = 401;
             next(error);
         }
         const token = jsonWebToken.sign({
             email: loadedUser.email,
             userId: loadedUser._id.toString()
         }, 'Calmer25Than25You25Are.', {expiresIn: '1h'});
         response.status(200).json({token: token, userId: loadedUser._id.toString(), message: 'Login Successful'});
     } catch(error) {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        };
}

//legacy code to add async await
// exports.signUp = (request, response, next) => {
//     const errors = validationResult(request);
//     if(!errors.isEmpty()) {
//         const error = new Error('Validation Failed');
//         error.statusCode = 422;
//         error.data = errors.array();
//         throw error;
//     }
//     const email = request.body.email;
//     const name = request.body.name;
//     const password = request.body.password;
//     bcrypt.hash(password, 12)
//         .then( hashedPassword => {
//             const user = new User({
//                 email: email,
//                 name: name,
//                 password: hashedPassword,
//             });
//
//             return user.save();
//         })
//         .then(newUser => {
//             response.status(201).json({ message: 'User created!', userId: newUser._id });
//         })
//         .catch(error => {
//             if(!error.statusCode) {
//                 error.statusCode = 500;
//             }
//             next(error);
//         })
//
// }
//
// exports.login = (request, response, next) => {
//     const email = request.body.email;
//     const password = request.body.password;
//     let loadedUser;
//     User.findOne( {email: email})
//         .then(user => {
//             if(!user){
//                 const error = new Error('There\'s no one here by that name');
//                 error.statusCode = 401;
//                 throw error;
//             }
//             loadedUser = user;
//             return bcrypt.compare(password, user.password);
//         })
//         .then(isEqual => {
//             if(!isEqual){
//                 const error = new Error('That isnt the code word.');
//                 error.statusCode = 401;
//                 throw error;
//             }
//             const token = jsonWebToken.sign({
//                 email: loadedUser.email,
//                 userId: loadedUser._id.toString()
//             }, 'Calmer25Than25You25Are.', { expiresIn: '1h' });
//             response.status(200).json({ token: token, userId: loadedUser._id.toString(), message: 'Login Successful'});
//         })
//         .catch(error => {
//             if(!error.statusCode){
//                 error.statusCode = 500;
//             }
//             next(error);
//         });
// }


