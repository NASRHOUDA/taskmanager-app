const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    console.log('✅ Auth success for:', req.user.email);
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Rediriger vers le dashboard avec le token
    const redirectUrl = 'http://localhost:3000/dashboard?token=' + token;
    console.log('🔀 Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  }
);

module.exports = router;
