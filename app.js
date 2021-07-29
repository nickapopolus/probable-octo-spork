const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('./socket').init(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', "POST", "PATCH", "PUT", "DELETE"]
    },
    transport: ['websocket']
});
const path = require('path');

const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver= require('./graphql/resolvers');

const feedRoutes = require('./routes/feed');
const authenticationRoutes = require('./routes/authentication');
const userRoutes = require('./routes/user');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const isAuth = require('./middleware/is-auth');

const fileStorage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, 'images');
    },
    filename: (request, file, callback) => {
        callback(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (request, file, callback) => {
if(file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg') {
        callback(null, true);
} else {
    callback(null, false);
}}

const MONGO_DB_URI = 'mongodb://127.0.0.1:27017/blog';



app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((request, response, next) => {
    // instead of the wildcard you can set specific urls separated by commas to access this
    //this middleware stops CORS issues
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(request.method === 'OPTIONS'){
        return response.sendStatus(200);
    }
    next();
})

app.use('/feed', feedRoutes);
app.use('/authentication', authenticationRoutes);
app.use('/user', userRoutes);
app.use(isAuth);
app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(error){
        if(!error.originalError){
            return error;
        }
        const data = error.originalError.data || 'error!';
        const message = error.originalError.message || 'An error!';
        const code = error.originalError.code || 500;
        return { message: message, status: code, data: data};
    }
}));

app.use((error, request, response, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    response.status(status).json({message: message, data: data});
});

mongoose.connect(MONGO_DB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(connection =>
    {
        io.on('connection', socket => {
           console.log('client connected');
        });
        httpServer.listen(8080);
    })
    .catch(error => console.log(error))

