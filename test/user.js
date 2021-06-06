/* eslint-disable */

const User = require('../src/models/user').user

const { createMiniLeague } = require('../src/services/minileague');
const { resetPassword, createNewPassword, getUserInfo, auth_user } = require('../src/services/auth');
const { addFriend } = require('../src/services/friends')
const { expect, assert } = require('chai');

describe('user', function() {
    it("can login", async function() {
        auth_user().should.equal("Success")
    })

    it("can be created", async function() {
        await User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass')
    })
    describe('that already exists', function() {
        beforeEach(async () => {
            await User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass').catch(err => {
                // Ignore error as user may have already been created
            })
        })
        it("can be read", async function() {
            await getUserInfo('sol')
        })
        it("can reset password", async function() {
            const emailRes = await resetPassword('sol')
            expect(emailRes).to.equal('Email sent')

            await User.updateOne({ username: 'sol' }, { verification_token: 'stub' })
            const passwordRes = await createNewPassword('sol', 'stub', 'newpassword')
            expect(passwordRes).to.equal('Password updated. Please login using your new password.')
        })
        it("cannot reset password with incorrect verification token", async function() {
            await createNewPassword('sol', 'incorrecttoken', 'newpassword').should.be.rejectedWith("Verification token doesn't match")
        })

        describe("can handle friends", function() {
            beforeEach(async () => {
                await User.register(new User({ username: 'friend1', email: 'friend@gmail.com' }), 'testpass').catch(err => {
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
                await User.updateOne({ username: 'sol'}, { friends: [] })
                await addFriend('sol', 'friend1')
                await addFriend('sol', 'friend1').should.be.rejectedWith('You are already following friend1')
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