const Driver = require('../models/driver.model');

// Add Driver
const addDriver = async (req, res) => {
  try {
    const {
      name,
      contactNo,
      alternateMobile,
      email,
      address,
      adhaarNo,
      drivingLicenseNo,
      pvcNo,
      otherDetails
    } = req.body;

    const files = req.files;

    const driverData = {
      name,
      contactNo,
      alternateMobile,
      email,
      address,
      adhaarNo,
      drivingLicenseNo,
      pvcNo,
      otherDetails,
      driverImage: files.driverImage?.[0]?.path,
      adhaarCardImage: files.adhaarCardImage?.[0]?.path,
      drivingLicenseImage: files.drivingLicenseImage?.[0]?.path,
      pvcImage: files.pvcImage?.[0]?.path,
      status: 'pending',
    };

    const newDriver = await Driver.create(driverData);
    res.status(200).json({ message: 'Driver added successfully', driver: newDriver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Update Driver Status
const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const driver = await Driver.findByPk(id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.status = status;
    await driver.save();

    res.status(200).json({ message: `Driver status updated to ${status}`, driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Get All Drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.findAll();
    res.status(200).json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Get Driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByPk(id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

module.exports = {
  addDriver,
  updateDriverStatus,
  getAllDrivers,
  getDriverById
};
