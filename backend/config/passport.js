const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          where: { provider: 'google', providerId: profile.id },
        });
        
        if (!user) {
          user = await User.findOne({ where: { email: profile.emails[0].value } });
          if (user) {
            await user.update({
              provider: 'google',
              providerId: profile.id,
            });
          } else {
            user = await User.create({
              email: profile.emails[0].value,
              name: profile.displayName,
              provider: 'google',
              providerId: profile.id,
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
