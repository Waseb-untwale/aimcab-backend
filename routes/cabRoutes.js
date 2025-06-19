const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { addCab, updateCabStatus, getAllCabs, getCabById } = require('../controller/cabController');

// Add Cab
router.post(
  '/add-cab',
  upload.fields([
    { name: 'rcNoImg', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'permit', maxCount: 1 },
    { name: 'fitnessCertificate', maxCount: 1 },
    { name: 'cabImage', maxCount: 1 },
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'sideImage', maxCount: 1 },
  ]),
  addCab
);

// Update Cab Status (approve/reject)
router.put('/update-status/:id', updateCabStatus);

router.get('/get-cabs', getAllCabs);

router.get('/get-cab/:id', getCabById);

module.exports = router;
