const User = require('../models/user');
const sequelize = require('../config/db');
const nodemailer = require("nodemailer");
require("dotenv").config();
const bcrypt = require('bcrypt');


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("pass",isMatch)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP
exports.sendResetOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await user.update({ otp, otpExpiry }); 

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ message: "Failed to send OTP", error: error.message });
      } else {
        return res.status(200).json({ message: "OTP sent successfully" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// verify otp
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date(user.otpExpiry) < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// change password
exports.changePassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Make sure OTPs are strings for comparison
    if (user.otp.toString() !== otp.toString() || Date.now() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await sequelize.query(
      `UPDATE user_login SET password = ?, otp = '', otpExpiry = NULL WHERE email = ?`,
      {
        replacements: [hashedPassword, email],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    return res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



