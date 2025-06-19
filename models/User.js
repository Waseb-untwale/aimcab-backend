const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('authController', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
 otp: {
    type: DataTypes.STRING,
    allowNull: false 
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true 
  },
}, {
  tableName: 'user_login', 
  timestamps: false
});

module.exports = User;