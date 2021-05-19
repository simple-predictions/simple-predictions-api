# Services

## Auth Services

### Reset password

Parameters:

- username (string)

Finds the user with the given username. Gets the user or returns a `User not found` error.

Generates a random verification token using `randomstring`. Updates the user with the generated verification token.

Sends a reset link including the username and verification token to the user's email using `transporter`. The promise is then resolved when the email is sent.

### Create new password

Parameters:

- username (string)
- verification token (string)
- password (string)

Finds a user with the given username. Gets the user or returns a `User not found` error.

Verifies the verification token passed matches the verification token stored in the user object or returns a `Verification token doesn't match` error.

Updates the user's password and resets the verification token to null. Resolves the promise after the user is saved.

### Get user info

Parameters:

- username (string)

Finds a user with the given username and populates its friends.

Calls [getUserTotalPoints](#Get%20user%20total%20points) and sets the user's total points to the response. Resolves the promise with the user object.

### Set user expo token

Parameters:

- username (string)
- expo push token (string)

Find and update the user by username with the new expo push token and resolve the promise.

## Friends Services

### Add friend

Parameters:

- currentUsername (string)
- friendUsername (string)

Finds a user with the friend's username. Gets the user or returns a `Username not found` error.

Updates the user with the current username with `$addToSet: { friends: res._id }`. This adds the friend's id to the friends array. If the friend is already in the array, a `You are already following` error is returned.
