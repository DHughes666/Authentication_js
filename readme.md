For passport-local-mongoose to work, the email, username and password fields must be set to false. If set to true, the authentication won't work.

When trying to use the logout() feature, a callback function is necessary, else the code won't work

When Google-oauth is implemented, it's only the expanded form of passport.serializeUser and passport.deserializeUser that would work.
