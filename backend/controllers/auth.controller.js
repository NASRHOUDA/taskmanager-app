const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, provider: user.provider },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const user = await User.create({ email, password, name, provider: "local" });
    const token = generateToken(user);
    res.json({
      message: "User registered successfully",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`Auth failed: invalid credentials for email ${email} (user not found)`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      console.error(`Auth failed: invalid credentials for email ${email} (wrong password)`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mise à jour du profil (nom, etc.) — fonctionne pour TOUS les providers
// (local ET google), car protégé uniquement par le JWT, pas par un mot de passe.
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const user = req.user;
    user.name = name.trim();
    await user.save();

    const { password, ...userWithoutPassword } = user.toJSON();
    res.json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Changement de mot de passe — réservé aux comptes "local".
// Les comptes Google n'ont pas de mot de passe local et ne peuvent
// donc pas utiliser cette route (ils s'authentifient toujours via Google).
const changePassword = async (req, res) => {
  try {
    const user = req.user;

    if (user.provider !== "local") {
      return res.status(403).json({
        error: "Password change is not available for accounts authenticated via Google. Manage your password directly in your Google account.",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };