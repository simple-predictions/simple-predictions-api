/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
describe('test match schema', function() {
    it('should exist', function() {
        assert.isDefined(schema.getType('matches'))
    })
})