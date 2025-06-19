const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  addDriver,
  updateDriverStatus,
  getAllDrivers,
  getDriverById
} = require('../controller/driverController');

// Add Driver
router.post(
  '/add-driver',
  upload.fields([
    { name: 'driverImage', maxCount: 1 },
    { name: 'adhaarCardImage', maxCount: 1 },
    { name: 'drivingLicenseImage', maxCount: 1 },
    { name: 'pvcImage', maxCount: 1 },
  ]),
  addDriver
);

// Update Driver Status (approve/reject)
router.put('/update-status/:id', updateDriverStatus);

// Get All Drivers
router.get('/get-drivers', getAllDrivers);

// Get Driver by ID
router.get('/get-driver/:id', getDriverById);

module.exports = router;
