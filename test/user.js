/* eslint-disable */

const User = require('../src/models/user').user

const { resetPassword, createNewPassword, getUserInfo, auth_user } = require('../src/services/auth');
const { addFriend, listFriends } = require('../src/services/friends')
const { expect } = require('chai');

describe('user', function() {
    it("can login", async function() {
        auth_user().should.equal("Success")
    })

    it("can be created", async function() {
        await User.register(await new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass')
    })
    describe('that already exists', function() {
        beforeEach((done) => {
            User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass', function(err, res) {
                done()
            })
        })
        it("can be read", async function() {
            await getUserInfo('sol')
        })
        it("can reset password", function(done) {
            const emailRes = resetPassword('sol')
            emailRes.should.eventually.equal('Email sent')
            User.updateOne({ username: 'sol' }, { verification_token: 'stub' }, async function(err) {
                if (err) throw err
                const passwordRes = createNewPassword('sol', 'stub', 'newpassword')
                passwordRes.should.eventually.equal('Password updated. Please login using your new password.')
                done()
            })
        })
        it("cannot reset password with incorrect verification token", async function() {
            await createNewPassword('sol', 'incorrecttoken', 'newpassword').should.be.rejectedWith("Verification token doesn't match")
        })

        describe("can handle friends", function() {
            beforeEach(async () => {
                await User.register(await new User({ username: 'friend1', email: 'friend@gmail.com' }), 'testpass').catch(err => {
                    // Ignore error as user may have already been created
                })
            })
            it("can add friends", async function() {
                await addFriend('sol', 'friend1')
            })
            it("cannot add friends that don't exist", async function() {
                await addFriend('sol', 'fakefriend').should.be.rejectedWith('Username not found')
            })
            it("cannot add friends twice", async function() {
                await addFriend('sol', 'friend1')
                await addFriend('sol', 'friend1').should.be.rejectedWith('You are already following friend1')
            })
            it("can list friends when added", async function() {
                await addFriend('sol', 'friend1')
                await listFriends('sol').should.eventually.have.lengthOf.above(1)
            })
            it("cannot list friends when not added", async function() {
                await listFriends('sol').should.eventually.have.lengthOf(1)
            })
        })
    })
    describe('that does not exist', function() {
        it("cannot be read", async function() {
            await getUserInfo('sol').should.be.rejectedWith('User not found')
        })
        it("cannot request password reset", async function() {
            await resetPassword('sol').should.be.rejectedWith('User not found')
        })
        it("cannot reset password", async function() {
            await createNewPassword('sol', 'stub', 'newpassword').should.be.rejectedWith('User not found')
        })
    })
})