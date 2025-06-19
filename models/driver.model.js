const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Driver = sequelize.define('Driver', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  alternateMobile: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  driverImage: {
    type: DataTypes.STRING,
  },
  adhaarCardNo: {
    type: DataTypes.STRING,
  },
  adhaarCardImage: {
    type: DataTypes.STRING,
  },
  drivingLicenseNo: {
    type: DataTypes.STRING,
  },
  drivingLicenseImage: {
    type: DataTypes.STRING,
  },
  pvcNo: {
    type: DataTypes.STRING,
  },
  pvcImage: {
    type: DataTypes.STRING,
  },
  otherDetails: {
    type: DataTypes.TEXT,
  },
   status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
});

module.exports = Driver;
