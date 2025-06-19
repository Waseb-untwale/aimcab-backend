const express = require('express');
const router = express.Router();
const {login, sendResetOTP, verifyOTP, changePassword} = require('../controller/authController');

router.post('/login', login);
router.post("/sendotp", sendResetOTP); // Send OTP
router.post("/verifyotp", verifyOTP); // Verify OTP
router.post("/resetpassword", changePassword); 

module.exports = router;