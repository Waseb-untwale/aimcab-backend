const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('demo', 'root', 'Password@181298', {
    host: 'localhost',
    dialect: 'mysql',
});

const oneWayTrip  = sequelize.define('OnewayTrip',  {
    tripType: {
      type: DataTypes.ENUM('One Way', 'Round'),
      allowNull: false
    },
    source_state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source_city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    destination_state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    destination_cty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hatchback: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    sedan: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    suv: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    suvplus: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'oneway_trip',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['source_state', 'source_city', 'destination_state', 'destination_city']
      }
    ]
  });

  module.exports = oneWayTrip;

