const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

// Logs pour diagnostiquer les variables d'environnement
console.log('=== LOADING PASSPORT CONFIG ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ EXISTS (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : '❌ MISSING');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ EXISTS (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : '❌ MISSING');
console.log('===============================');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ FATAL: Google OAuth credentials are missing!');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('📧 Google OAuth callback received for:', profile.emails[0]?.value);
        
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
        console.error('❌ Google Strategy error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
