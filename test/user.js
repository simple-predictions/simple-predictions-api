/* eslint-disable */

const User = require('../src/models/user').user

const { createMiniLeague } = require('../src/services/minileague');
const { resetPassword, createNewPassword, getUserInfo } = require('../src/services/auth');
const { expect } = require('chai');

describe('user', function() {
    it("can be created", async function() {
        await User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass')
    })
    describe('read', function() {
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
    })
})