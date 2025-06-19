const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('demo', 'root', 'Password@181298', {
    host: 'localhost',
    dialect: 'mysql',
});

const CabBooking = sequelize.define('CabBooking', {
    user_trip_type: {
        type: DataTypes.ENUM('One Way', 'Round Trip', 'Rental'),
        allowNull: false
    },
    user_pickup: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_drop: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    return_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    time_end: {
        type: DataTypes.TIME,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            is: /^[0-9]{10}$/
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    distance: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    baseAmount: {
        type: DataTypes.JSON,
        allowNull: true
    },
    car: {
        type: DataTypes.ENUM('hatchback', 'sedan', 'suv', 'suvplus'),
        allowNull: true
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    bookingId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    totalAmount: {
        type: DataTypes.FLOAT, 
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Completed'),
        allowNull: false,
        defaultValue: 'Pending'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
},
    {
        tableName: 'user_booking',
        timestamps: false
    });

module.exports = CabBooking;
