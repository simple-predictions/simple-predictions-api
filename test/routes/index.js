/* eslint-disable */
const { routes } = require('../../src/api/index')
const server = require('../../src/api/index').routes()

before(function() {
    this.server = server
})

describe('test router', function() {
    it('setup', async function() {
        await routes()
    })
})