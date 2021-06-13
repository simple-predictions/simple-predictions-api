/* eslint-disable */

const { createMiniLeague, joinMiniLeague, getMiniLeagues } = require('../src/services/minileague')
const User = require('../src/models/user').user

describe('minileague', function() {
    it('can be created', async function() {
        await createMiniLeague('sol', 'testleague').should.eventually.equal('Mini-league created')
    })
    it('cannot be created with existing name', async function() {
        await createMiniLeague('sol', 'testleague')
        await createMiniLeague('sol', 'testleague').should.be.rejectedWith('A mini-league with this name already exists.')
    })

    it('can be joined', async function() {
        await User.register(await new User({ username: 'test2', email: 'testuser@gmail.com' }), 'testpass').catch(err => {
            // Ignore error as user may have already been created
        })
        await createMiniLeague('sol', 'testleague')
        await joinMiniLeague('test2', 'testleague').should.eventually.equal('Success')
    })

    it('cannot be joined twice', async function() {
        await User.register(await new User({ username: 'test2', email: 'testuser@gmail.com' }), 'testpass').catch(err => {
            // Ignore error as user may have already been created
        })
        await createMiniLeague('sol', 'testleague')
        await joinMiniLeague('test2', 'testleague')
        await joinMiniLeague('test2', 'testleague').should.be.rejectedWith('You are already a member of testleague')
    })

    it('cannot be joined if it does not exist', async function() {
        await joinMiniLeague('sol', 'fakeleague').should.be.rejectedWith("Mini-league doesn't exist")
    })

    it('can be viewed after created', async function() {
        await createMiniLeague('sol', 'testleague')
        const minileagues = await getMiniLeagues('sol')
        minileagues.should.have.length(1)
        minileagues[0].should.have.keys(['members','_id','name','table','rankings','__v'])
    })
})