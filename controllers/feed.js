const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');
const io = require('../socket').getIO;

exports.getPosts = async (request, response, next) => {
    const page = request.query.page;
    const postsPerPage = 2;
    try {
    const totalPosts = await Post.find()
        .countDocuments();
    const thePosts = await Post.find()
        .populate('creator')
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage);

    response.status(200).json({
        message: 'Posts Retrieved',
        posts: thePosts,
        totalItems: totalPosts
    });
    } catch (error) {
        console.log(error);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    };
}

exports.getPost = async (request, response, next) => {
    const postId = request.params.id;
    try {
        const thePost = await Post.findOne({_id: postId})
            .populate('creator');
        if (!thePost) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            next(error);
        }
        response.status(200).json({message: 'Message Retrieved', post: thePost});
    } catch(error) {
            console.log(error);
            if(!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        };
}


exports.postPost = async (request, response, next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        next(error);
    }
    if(!request.file) {
        const error = new Error('Image Not Provided');
        error.statusCode = 422;
        next(error);
    }
    const imageURL = request.file.path;
    const title = request.body.title;
    const content = request.body.content;


    const post = new Post({
        title: title,
        content: content,
        imageURL: imageURL,
        creator: request.userId,
    });
    try {
        const returnedPost = await post.save();

        const theAuthor = await User.findOne({_id: request.userId});
        theAuthor.posts.push(returnedPost);
        const theUpdatedAuthor = await theAuthor.save();
        io().emit('posts', {
            action: 'create',
            post: returnedPost
        });
        response.status(201).json({
            message: "Post Created Successfully!",
            post: returnedPost,
            creator: theUpdatedAuthor
        });
    } catch(error) {
            console.log(error)
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        };
}

exports.updatePost = async (request, response, next) => {
    const postId = request.params.id;
    const title = request.body.title;
    const content = request.body.content;
    let imageURL = request.body.image;
    const errors = validationResult(request);
    if(!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        next(error);
    }
    if(request.file) {
        imageURL = request.file.path;
    }
    if(!imageURL) {
        const error = new Error('There is no image associated with this post.');
        error.statusCode = 422;
        next(error);
    }
    try {
        const thePost = await Post.findOne({_id: postId}).populate('creator');
        if (!thePost) {
            const error = new Error('There wasn\'t a post with that ID');
            error.statusCode = 404;
            next(error);
        }
        if (thePost.creator._id.toString() !== request.userId) {
            const error = new Error('You can\'t edit someone elses post');
            error.statusCode = 403;
            next(error);
        }
        if (thePost.imageURL !== imageURL) {
            clearImage(thePost.imageURL);
        }
        thePost.title = title;
        thePost.content = content;
        thePost.imageURL = imageURL
        const theUpdatedPost = await thePost.save();
        io().emit('posts', { action: 'update', post: theUpdatedPost});
        response.status(200).json({message: 'Post Updated', post: theUpdatedPost});

    } catch(error) {
            if(!error.statusCode){
                error.statusCode = 500;
            }
            next(error);
        }
}

exports.deletePost = async (request, response, next) => {
    const postId = request.params.postId;
    try {
        const thePost = await Post.findOne({_id: postId});

        if (!thePost) {
            const error = new Error('Post does not exist');
            error.statusCode = 404;
            next(error);
        }
        if (thePost.creator.toString() !== request.userId) {
            const error = new Error('You can\'t edit someone elses post');
            error.statusCode = 403;
            next(error);
        }
        clearImage(thePost.imageURL);
        await Post.deleteOne({_id: postId});

        const theAuthor = await User.findOne({_id: request.userId});

        theAuthor.posts.pull(postId);
        await theAuthor.save();
        io().emit('posts', {action: 'delete', postId: postId});
        response.status(200).json({message: 'That post was deleted'});
    } catch(error) {
           if(!error.statusCode) {
               error.statusCode = 500;
           }
           next(error);
        };
}

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, error => console.log(error));
}

// Lagacy code for promise.
// exports.getPosts = (request, response, next) => {
//     const page = request.query.page;
//     const postsPerPage = 2;
//     let totalPosts;
//     Post.find()
//         .countDocuments()
//         .then(count => {
//             totalPosts = count;
//             return Post.find()
//                 .skip((page -1) * postsPerPage)
//                 .limit(postsPerPage)
//         })
//         .then(thePosts => {
//             response.status(200).json({
//                 message: 'Posts Retrieved',
//                 posts: thePosts,
//                 totalItems: totalPosts
//             });
//         })
//         .catch(error => {
//             console.log(error);
//             if(!error.statusCode) {
//                 error.statusCode = 500;
//             }
//             next(error);
//         });
//
// }
//
// exports.getPost = (request, response, next) => {
//     const postId = request.params.id;
//     Post.findOne({_id: postId})
//         .then(thePost => {
//             if(!thePost){
//                 const error = new Error('Post not found');
//                 error.statusCode = 404;
//                 throw error;
//             }
//             response.status(200).json({ message: 'Message Retrieved', post: thePost });
//         })
//         .catch(error => {
//             console.log(error);
//             if(!error.statusCode) {
//                 error.statusCode = 500;
//             }
//             next(error);
//         });
// }
//
//
// exports.postPost = (request, response, next) => {
//     const errors = validationResult(request);
//     if(!errors.isEmpty()) {
//
//         const error = new Error('Validation Failed');
//         error.statusCode = 422;
//         throw error;
//
//     }
//     if(!request.file) {
//         const error = new Error('Image Not Provided');
//         error.statusCode = 422;
//         throw error
//     }
//     const imageURL = request.file.path;
//     const title = request.body.title;
//     const content = request.body.content;
//
//     let savedPost;
//     const post = new Post({
//         title: title,
//         content: content,
//         imageURL: imageURL,
//         creator: request.userId,
//     });
//     post
//         .save()
//         .then(returnedPost => {
//             savedPost = returnedPost;
//             return User.findOne({_id: request.userId});
//         })
//         .then(user => {
//             user.posts.push(post);
//             return user.save();
//
//         })
//         .then(user => {
//             response.status(201).json({
//                 message: "Post Created Successfully!",
//                 post: savedPost,
//                 creator: user
//             })
//         })
//         .catch(error => {
//             console.log(error)
//             if(!error.statusCode){
//                 error.statusCode = 500;
//             }
//             next(error);
//         });
// }
//
// exports.updatePost = (request, response, next) => {
//     const postId = request.params.id;
//     const title = request.body.title;
//     const content = request.body.content;
//     let imageURL = request.body.image;
//     const errors = validationResult(request);
//     if(!errors.isEmpty()) {
//         const error = new Error('Validation Failed');
//         error.statusCode = 422;
//         throw error;
//
//     }
//     if(request.file) {
//
//         imageURL = request.file.path;
//     }
//     if(!imageURL) {
//         const error = new Error('There is no image associated with this post.');
//         error.statusCode = 422;
//         throw error;
//     }
//
//     Post.findOne({_id: postId})
//         .then(thePost => {
//             if(!thePost){
//                 const error = new Error('There wasn\'t a post with that ID');
//                 error.statusCode = 404;
//                 throw error;
//             }
//
//             if(thePost.creator.toString() !== request.userId) {
//                 const error = new Error('You can\'t edit someone elses post');
//                 error.statusCode = 403;
//                 throw error;
//             }
//             if(thePost.imageURL !== imageURL){
//                 clearImage(thePost.imageURL);
//             }
//             thePost.title = title;
//             thePost.content = content;
//             thePost.imageURL = imageURL
//             return thePost.save();
//         })
//         .then(theUpdatedPost => {
//             response.status(200).json({ message: 'Post Updated', post: theUpdatedPost});
//         })
//         .catch(error => {
//             if(!error.statusCode){
//                 error.statusCode = 500;
//             }
//             next(error);
//         })
// }
//
// exports.deletePost = (request, response, next) => {
//     const postId = request.params.postId;
//     Post.findOne({_id: postId})
//         .then(thePost => {
//             if(!thePost) {
//                 const error = new Error('Post does not exist');
//                 error.statusCode = 404;
//                 throw error;
//             }
//             if( thePost.creator.toString() !== request.userId) {
//                 const error = new Error('You can\'t edit someone elses post');
//                 error.statusCode = 403;
//                 throw error;
//             }
//             clearImage(thePost.imageURL);
//             return Post.deleteOne({ _id: postId});
//         })
//         .then(dBResponse => {
//             return User.findOne({_id: request.userId});
//         })
//         .then(user => {
//             user.posts.pull(postId);
//             return user.save();
//         })
//         .then(dBResponse => {
//
//             response.status(200).json({message: 'That post was deleted'});
//         })
//         .catch(error => {
//             if(!error.statusCode) {
//                 error.statusCode = 500;
//             }
//             next(error);
//         });
// }
