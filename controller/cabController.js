const Cab = require('../models/cab.model');

// Add Cab
const addCab = async (req, res) => {
  try {
    const { regNo, rcNo, otherDetails } = req.body;
    const files = req.files;

    const cabData = {
      regNo,
      rcNo,
      otherDetails,
      rcNoImg: files?.rcNoImg?.[0]?.path,
      insurance: files?.insurance?.[0]?.path,
      permit: files?.permit?.[0]?.path,
      fitnessCertificate: files?.fitnessCertificate?.[0]?.path,
      cabImage: files?.cabImage?.[0]?.path,
      frontImage: files?.frontImage?.[0]?.path,
      backImage: files?.backImage?.[0]?.path,
      sideImage: files?.sideImage?.[0]?.path,
      status: 'pending',
    };

    const newCab = await Cab.create(cabData);
    res.status(200).json({ message: 'Cab added successfully', cab: newCab });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

const updateCabStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const cab = await Cab.findByPk(id);

    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' });
    }

    cab.status = status;
    await cab.save();

    res.status(200).json({ message: `Cab status updated to ${status}`, cab });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

const getAllCabs = async (req, res) => {
  try {
    const cabs = await Cab.findAll();
    res.status(200).json(cabs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Get Cab by ID
const getCabById = async (req, res) => {
  try {
    const { id } = req.params;
    const cab = await Cab.findByPk(id);

    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' });
    }

    res.status(200).json(cab);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

module.exports = {
  addCab,
  getAllCabs,
  getCabById,
  updateCabStatus,
};
