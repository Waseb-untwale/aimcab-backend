const express = require("express")
const { createBooking, 
    getBaseAmount, 
    getAllCarPrices, 
    updateBookingCarSelection, 
    getDetailsForInvoice, 
    updateInvoiceDetails, 
    getAllBookingDetails, getBookingDetailsByBookingId, deleteBookingByBookingId, updateBookingStatus, uploadExcel ,checkLocation } = require("../controller/cabBookingController");

const XLSX = require('xlsx');
require('dotenv').config();

const {checkLocationExists}=require("../services/locationService")
const { Location, sequelize } = require("../models/locationModel");
const upload = require('../utils/multerConfig');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

router.post("/create-booking", createBooking);

router.get('/getBaseAmount', getBaseAmount);

router.put('/update-booking', updateBookingCarSelection);

router.get('/get-invoice-details', getDetailsForInvoice);

router.post('/update-invoice-details', updateInvoiceDetails);

router.get('/get-all-car-prices', getAllCarPrices);

router.get('/get-all-bookings-details', getAllBookingDetails);

router.get('/get-bookings-details/:bookingId', getBookingDetailsByBookingId);

router.delete('/delete-booking/:bookingId', deleteBookingByBookingId);

router.put('/update-booking-status/:bookingId', updateBookingStatus);

router.post('/upload-excel', upload.single('excelFile'), uploadExcel);

// Check Location
router.post('/check-location', checkLocation);



module.exports = router;