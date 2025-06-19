const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, "Password@181298", {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const Location = sequelize.define('Location', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  locationName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'location_name'
  }
}, {
  tableName: 'locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = { Location, sequelize };
