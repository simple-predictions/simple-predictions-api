/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
const { gql } = require('apollo-server')
const { match: Match } = require('../../src/models/user')

describe('test match schema', function() {
    beforeEach(async function() {
        await Match.create({home_team: "Arsenal", away_team: "Tottenham", gameweek: 1})
    })
    it('should exist', function() {
        assert.isDefined(schema.getType('matches'))
    })
    it('should get a single match', async function() {
        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchOne {
                    home_team
                    away_team
                }
            }`
        })
        res.data.matchOne.home_team.should.equal("Arsenal")
        res.data.matchOne.away_team.should.equal("Tottenham")
    })
    it('should get a specific single match', async function() {
        await Match.create({home_team: 'Chelsea', away_team: 'Liverpool'})

        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchOne(filter: {home_team: "Chelsea", away_team: "Liverpool"}) {
                    home_team
                    away_team
                }
            }`
        })
        res.data.matchOne.home_team.should.equal("Chelsea")
        res.data.matchOne.away_team.should.equal("Liverpool")
    })
    it('should get multiple matches', async function() {
        await Match.create({home_team: 'Chelsea', away_team: 'Liverpool', gameweek: 1})

        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchMany(filter: {gameweek: 1}) {
                    home_team
                    away_team
                }
            }`
        })

        res.data.matchMany.should.have.length(2)
        res.data.matchMany[0].home_team.should.equal("Arsenal")
        res.data.matchMany[0].away_team.should.equal("Tottenham")
        res.data.matchMany[1].home_team.should.equal("Chelsea")
        res.data.matchMany[1].away_team.should.equal("Liverpool")
    })
})