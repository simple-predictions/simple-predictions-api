# Services

## Auth services

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
