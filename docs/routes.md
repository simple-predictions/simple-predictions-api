# API Routes

## Auth Routes

### Reset password `POST /resetpassword`

Request body parameters:

- username (string)

Resets the user's password on an existing account. Firstly, verifies that a username is supplied. If not, status code 500 is returned.

Calls [resetPassword](services.md#Reset-password) and returns the response. If the response is an error, it is returned with status code 500.

### Create new password `POST /createnewpassword`

Request body parameters:

- username (string)
- verification token (string)
- new password (string)

Creates a new password on an existing account. Firstly, verifies that a username, verification token and new password are supplied. If not, status code 500 is returned.

Calls [createnewpassword](services.md#Create-new-password) and returns the response. If the response is an error, it is returned with status code 500.

### Login `POST /login`

Request body parameters:

- username (string)
- password (string)

```javascript
passport.authenticate('local')
```

All authentication is handled by `passport.js`. An automatically generated error is returned or `Success` along with a `Set-Cookie` header if the login is successful.

### Register `POST /register`

Request body parameters:

- username (string)
- password (string)
- email (string)

Registers a new user. Firstly, verifies that a username, password and email are supplied. If not, status code 500 is returned.

Calls `User.register` with a new user object to register. Logs in with `passport.authenticate('local')` and returns on creation.

### User info `GET /userinfo`

> Protected route

Calls [getUserInfo](services.md#Get-user-info) and returns the response.

### Set Expo push token `POST /setexpopushtoken`

> Protected route

Calls [setUserExpoToken](services.md#Set-user-Expo-token) and returns the response.

## Friends Routes

### Add friend `POST /addfriend`

> Protected route

Body parameters:

- friend's username (string)

Verifies that the friend's username doesn't equal the current user's username or returns error code 403.

Calls [addFriend](services.md#Add-friend) and returns the response. If the response is an error, it is returned with status code 403.
