/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
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
    it('should lock past games', async function() {
        await Match.create({home_team: 'Chelsea', away_team: 'Liverpool', gameweek: 1, kick_off_time: new Date(Date.now() - 604800000)})

        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchOne(filter: {home_team: "Chelsea", away_team: "Liverpool"}) {
                    home_team
                    away_team
                    locked
                    kick_off_time
                }
            }`
        })
        res.data.matchOne.locked.should.equal(true)
    })
    it('should not lock future games', async function() {
        await Match.create({home_team: 'Chelsea', away_team: 'Liverpool', gameweek: 1, kick_off_time: new Date(Date.now() + 604800000)})

        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchOne(filter: {home_team: "Chelsea", away_team: "Liverpool"}) {
                    home_team
                    away_team
                    locked
                    kick_off_time
                }
            }`
        })
        res.data.matchOne.locked.should.equal(false)
    })
    it('should get the correct gameweek when none is specified', async function() {
        for (let i = 1; i < 39; i++) {
            await Match.create({home_team: 'Team'+i.toString(), away_team: 'Team'+(i+38).toString(), gameweek: i})
        }
        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchMany(filter: {gameweek: 0}) {
                    home_team
                    away_team
                    gameweek
                }
            }`
        })
        res.data.matchMany.should.have.length(1)
    })
    it('should get multiple matches by ids', async function() {
        const { _id: id1 } = await Match.create({home_team: 'Team1', away_team: 'Team2'})
        const { _id: id2 } = await Match.create({home_team: 'Team3', away_team: 'Team4'})
        const { _id: id3 } = await Match.create({home_team: 'Team5', away_team: 'Team6'})

        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchByIds(_ids: ["${id1}", "${id2}", "${id3}"]) {
                    home_team
                    away_team
                }
            }`
        })
        res.data.matchByIds.should.have.length(3)
    })
})