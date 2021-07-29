const { validationResult } = require('express-validator');

const User = require('../models/user');

exports.getUserStatus = async (request, response, next) => {
    try {
        const user = await User.findOne({_id: request.userId});
        if (!user) {
            const error = new Error('No User');
            error.statusCode = 404;
            throw error;
        }
        response.status(200).json({message: 'Status Retrieved', status: user.status});
    } catch(error) {
        if(!error.statusCode){
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.updateUserStatus = async (request, response, next) => {
    const userId = request.userId;
    const newStatus = request.body.status;
    const validationErrors = validationResult(request);
    if(!validationErrors.isEmpty()){
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        error.data = validationErrors.array();
        next(error);
    }
    try {
        const user = await User.findOne({_id: userId});
        if (!user) {
            const error = new Error('No User Found');
            error.statusCode = 404;
            next(error);
        }
        user.status = newStatus;
        const updatedUser = user.save();
        response.status(200).json({message: 'Status Updated Successfully', status: updatedUser.status});
    } catch(error) {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        }
}
// Legacy code with promises to add async await
// exports.getUserStatus = (request, response, next) => {
//     User.findOne({_id: request.userId})
//         .then(user => {
//             if(!user) {
//                 const error = new Error('No User');
//                 error.statusCode = 404;
//                 throw error;
//             }
//             response.status(200).json({message: 'Status Retrieved', status: user.status});
//         })
//         .catch(error => {
//             if(!error.statusCode){
//                 error.statusCode = 500;
//             }
//             next(error);
//         })
// }
//
// exports.updateUserStatus = (request, response, next) => {
//     console.log(request);
//     const userId = request.userId;
//     const newStatus = request.body.status;
//     console.log(request.body);
//     const validationErrors = validationResult(request);
//     if(!validationErrors.isEmpty()){
//         const error = new Error('Validation Failed');
//         error.statusCode = 422;
//         error.data = validationErrors.array();
//         throw error;
//     }
//     User.findOne({_id: userId})
//         .then(user => {
//             if(!user){
//                 const error = new Error('No User Found');
//                 error.statusCode = 404;
//                 throw error;
//             }
//
//             user.status = newStatus;
//
//             return user.save();
//             })
//         .then(user => {
//             response.status(200).json({message: 'Status Updated Successfully', status: user.status});
//         })
//         .catch(error => {
//         if(!error.statusCode){
//             error.statusCode = 500;
//         }
//         next(error);
//     })
// }
