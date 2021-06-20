/* eslint-disable */
const { ApolloServer } = require('apollo-server-express')
const schema = require('../../src/api/graphql/index')
const User = require('../../src/models/user').user

before(function() {
    const server = new ApolloServer({
        schema,
        context: async () => {
            const username = 'sol'
            const id = await User.findOne({ username })
            return { username, id: id._id.toString() }
        }
    })
    this.graphQLServer = server
})