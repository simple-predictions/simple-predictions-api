/* eslint-disable */
const { ApolloServer } = require('apollo-server-express')
const schema = require('../../src/api/graphql/index')
const User = require('../../src/models/user').user
const { routes } = require('../../src/api/index')

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

describe('test router', function() {
    it('setup', async function() {
        await routes()
    })
})