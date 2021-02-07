# API Routes

## Auth Routes

### Reset password (`POST /resetpassword`)

Request body parameters:

- username (string)

Resets the user's password on an existing account. Firstly, verifies that a username is supplied. If not, status code 500 is returned.

Calls the [resetPassword](services.md#Reset%20password) function and returns the response. If the response is an error, it is returned with status code 500.

### Create new password (`POST /createnewpassword`)

Request body parameters:

- username (string)
- verification token (string)
- new password (string)

Creates a new password on an existing account. Firstly, verifies that a username, verification token and new password are supplied. If not, status code 500 is returned.

Calls the [createnewpassword](services.md#Create%20New%20Password) function and returns the response. If the response is an error, it is returned with status code 500.

### Login (`POST /login`)

Request body parameters:

- username (string)
- password (string)

```javascript
passport.authenticate('local')
```

All authentication is handled by `passport.js`. An automatically generated error is returned or `Success` along with a `Set-Cookie` header if the login is successful.

### Register (`POST /register`)
