const express = require("express");

const router = express.Router();

const { updatePriceTripType, addNewTripPrice, tripPriceExist,downloadTripData,applyExcelDataTemporarily,revertTripDataNow  } = require('../controller/tripTypePripce');
const upload = require('../middleware/upload')

router.post('/upload-trip-data', upload.single('file'), applyExcelDataTemporarily);

router.post('/revert-now', revertTripDataNow);

router.get('/download-trip-data', downloadTripData);

router.put('/update-price', updatePriceTripType);

router.post('/add-price', addNewTripPrice);

router.post('/exist-trip-price', tripPriceExist);

module.exports = router;
