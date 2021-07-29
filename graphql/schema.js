const { buildSchema } = require('graphql');
// ! means required in graphql
module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    
    type User {
    _id: ID!
    name: String!
    email: String!
    password: String
    status: String!
    posts: [Post!]!
    }   
     
    input UserInput {
        email: String!
        name: String!
        password: String!
    }
        type TestData {
        text: String!
        views: Int!
    }
    type AuthData {
    token: String!
    userId: String!
    }

     input PostInput {
     title: String!
     content: String!
     imageUrl: String!
     }
     
     type RootQuery {
        login(email: String!, password: String!): AuthData!
    }
    
    type RootMutation {
        createUser(UserInputData: UserInput): User!
        createPost(PostInputData: PostInput): Post!
    }
    
    schema {
    query: RootQuery
    mutation: RootMutation
    }
`);
// type TestData {
//     text: String!
//     views: Int!
// }
//
// type RootQuery {
//     hello: TestData
// }
//
// schema {
//     query: RootQuery
// }
