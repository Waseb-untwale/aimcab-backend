const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cab = sequelize.define('Cab', {
  regNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rcNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
   rcNoImg: {
    type: DataTypes.STRING,
  },
  otherDetails: {
    type: DataTypes.TEXT,
  },
  insurance: {
    type: DataTypes.STRING,
  },
  permit: {
    type: DataTypes.STRING,
  },
  fitnessCertificate: {
    type: DataTypes.STRING,
  },
  cabImage: {
    type: DataTypes.STRING,
  },
  frontImage: {
    type: DataTypes.STRING,
  },
  backImage: {
    type: DataTypes.STRING,
  },
  sideImage: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
});

module.exports = Cab;
