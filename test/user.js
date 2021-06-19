/* eslint-disable */

const User = require('../src/models/user').user

const { resetPassword, createNewPassword, getUserInfo, auth_user } = require('../src/services/auth');

describe('user', function() {
    it("can login", async function() {
        auth_user().should.equal("Success")
    })

    it("can be created", async function() {
        await User.register(new User({ username: 'other', email: 'solomonabrahams100@gmail.com' }), 'testpass')
    })
    describe('that already exists', function() {
        it("can be read", async function() {
            await getUserInfo('sol')
        })
        it("can reset password", async function() {
            const emailRes = await resetPassword('sol')
            emailRes.should.equal('Email sent')
            await User.updateOne({ username: 'sol' }, { verification_token: 'stub' })
            const passwordRes = await createNewPassword('sol', 'stub', 'newpassword')
            passwordRes.should.equal('Password updated. Please login using your new password.')
        })
        it("cannot reset password with incorrect verification token", function() {
            return createNewPassword('sol', 'incorrecttoken', 'newpassword').should.eventually.be.rejectedWith("Verification token doesn't match")
        })
    })
    describe('that does not exist', function() {
        it("cannot be read", async function() {
            await getUserInfo('other').should.be.rejectedWith('User not found')
        })
        it("cannot request password reset", async function() {
            await resetPassword('other').should.be.rejectedWith('User not found')
        })
        it("cannot reset password", async function() {
            await createNewPassword('other', 'stub', 'newpassword').should.be.rejectedWith('User not found')
        })
    })
})