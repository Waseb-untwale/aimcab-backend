const cabBookingSchema = require("../models/cabBook");

const dotenv = require("dotenv");
const axios = require("axios");
const { Op } = require("sequelize");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");
const {checkLocationExists}=require("../services/locationService")
const cloudinary = require('../config/cloudinary');
const XLSX = require('xlsx');
const { Location } = require("../models/locationModel");


dotenv.config();

// distance calculate
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getDistance(origin, destination) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: origin,
          destinations: destination,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (
      response.data.status === "OK" &&
      response.data.rows[0] &&
      response.data.rows[0].elements[0].status === "OK"
    ) {
      const distanceInMeters = response.data.rows[0].elements[0].distance.value;
      return distanceInMeters / 1000;
    } else {
      console.error("❌ Invalid response from Google Maps API:", response.data);
      return null;
    }
  } catch (error) {
    console.error(
      "❌ Error fetching distance:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

// post booking
// const createBooking = async (req, res) => {
//   try {
//     console.log("🚖 Creating Booking...");

//     const {
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       date,
//       time,
//       return_date,
//       time_end,
//       name,
//       phone,
//       email,
//       carType,
//       bookingId,
//     } = req.body;

//     if (
//       !user_trip_type ||
//       !user_pickup ||
//       !user_drop ||
//       !date ||
//       !time ||
//       !name ||
//       !phone ||
//       !email
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All fields are required" });
//     }

//     if (user_trip_type === "Round Trip" && (!return_date || !time_end)) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Return Date and Time are required for Round Trip",
//         });
//     }

//     // Extract city and state from pickup/drop locations
//     const extractCityAndState = (location) => {
//       const parts = location.split(",").map((p) => p.trim());
//       return {
//         city: parts[0] || null,
//         state: parts[1] || null,
//       };
//     };

//     const pickupInfo = extractCityAndState(user_pickup);
//     const dropInfo = extractCityAndState(user_drop);

//     const source_city = pickupInfo.city;
//     const source_state = pickupInfo.state;
//     const destination_city = dropInfo.city;
//     const destination_state = dropInfo.state;

//     if (
//       !source_city ||
//       !source_state ||
//       !destination_city ||
//       !destination_state
//     ) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Invalid pickup or drop location format",
//         });
//     }

//     // Get Distance
//     const distance = await getDistance(user_pickup, user_drop);
//     if (!distance) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Error calculating distance" });
//     }

//     console.log(`📏 Distance: ${distance} km`);

//     const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
//     let priceDetails = {};
//     let selectedCarType = null;

//     const defaultRates = {
//       hatchback: 12,
//       sedan: 15,
//       suv: 18,
//       suvplus: 22,
//     };

//     let usedDefaultRates = false;

//     // Fetch Rate per KM from MySQL db
//     const ratePerKmQuery =
//       user_trip_type === "One Way"
//         ? `SELECT hatchback, sedan, suv, suvplus 
//                    FROM oneway_trip 
//                    WHERE source_city = ? 
//                      AND destination_city = ? 
//                      AND source_state = ? 
//                      AND destination_state = ?`
//         : `SELECT hatchback, sedan, suv, suvplus 
//                    FROM round_trip 
//                    WHERE source_city = ? 
//                      AND destination_city = ? 
//                      AND source_state = ? 
//                      AND destination_state = ?`;

//     console.log("Running ratePerKmQuery...");

// const rateRows = await sequelize.query(ratePerKmQuery, {
//   replacements: [
//     source_city,
//     destination_city,
//     source_state,
//     destination_state,
//   ],
//   type: QueryTypes.SELECT,
// });

//     let rates = {};

//     if (rateRows.length === 0) {
//       console.warn("⚠️ Pricing not found in MySQL. Using default rates.");
//       rates = defaultRates;
//       usedDefaultRates = true;
//       console.log("rate", rates);
//     } else {
//       rates = rateRows[0];
//       console.log("rate", rates);
//     }

//     if (user_trip_type === "Round Trip") {
//       const pickupDate = new Date(date);
//       const dropDate = new Date(return_date);
//       const timeDiff = Math.abs(pickupDate - dropDate);
//       const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

//       const minKmPerDay = 300;
//       const driverAllowancePerDay = 300;
//       const totalMinKm = minKmPerDay * totalDays;
//       const driverAllowance = driverAllowancePerDay * totalDays;
//       const totalDistance = distance * totalDays;

//       for (const type of validCarTypes) {
//         const rate = rates[type];
//         if (!rate) continue;

//         let totalCost = 0;
//         if (totalDistance < totalMinKm) {
//           totalCost = totalMinKm * rate + driverAllowance;
//         } else {
//           totalCost = totalDistance * rate;
//         }

//         priceDetails[type] = parseFloat(totalCost.toFixed(2));
//       }
//     } else {
//       for (const type of validCarTypes) {
//         if (rates[type]) {
//           priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
//         }
//       }
//     }

//     if (Object.keys(priceDetails).length === 0) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "No pricing found for selected car types",
//         });
//     }

//     // Select car type
//     if (carType) {
//       if (!validCarTypes.includes(carType)) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid car type" });
//       }
//       selectedCarType = carType;
//     } else {
//       selectedCarType = Object.entries(priceDetails).reduce(
//         (min, [type, price]) => (price < priceDetails[min] ? type : min),
//         validCarTypes.find((type) => priceDetails[type])
//       );
//     }

//     // Format Dates
//     const formattedDate = new Date(date);
//     const formattedReturnDate = return_date ? new Date(return_date) : null;

//     // Save to db
//     const booking = await cabBookingSchema.create({
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       source_state,
//       destination_state,
//       date: formattedDate,
//       time,
//       return_date: formattedReturnDate,
//       time_end,
//       name,
//       phone,
//       email,
//       distance,
//       baseAmount: priceDetails,
//       car: selectedCarType,
//       bookingId,
//     });

//     console.log("✅ Booking Saved Successfully!");
//     console.log("✅ Booking", booking);

//     res.status(201).json({
//       success: true,
//       message: "Booking Created Successfully",
//       bookingId,
//       usedDefaultRates,
//       data: {
//         ...booking.toJSON(),
//         baseAmount: priceDetails,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error creating booking:", error.message);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// const createBooking = async (req, res) => {
//   try {
//     console.log("🚖 Creating Booking...");

//     const {
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       date,
//       time,
//       return_date,
//       time_end,
//       name,
//       phone,
//       email,
//       carType,
//       bookingId,
//     } = req.body;

//     // Basic Validation
//     if (!user_trip_type || !user_pickup || !user_drop || !date || !time || !name || !phone || !email) {
//       return res.status(400).json({ success: false, message: "All fields are required" });
//     }

//     if (user_trip_type === "Round Trip" && (!return_date || !time_end)) {
//       return res.status(400).json({ success: false, message: "Return Date and Time are required for Round Trip" });
//     }

//     const extractCityAndState = (location) => {
//       const parts = location.split(',').map(p => p.trim());
//       return {
//         city: parts[0] || null,
//         state: parts[1] || null,
//       };
//     };

//     const pickupInfo = extractCityAndState(user_pickup);
//     const dropInfo = extractCityAndState(user_drop);

//     const source_city = pickupInfo.city;
//     const source_state = pickupInfo.state;
//     const destination_city = dropInfo.city;
//     const destination_state = dropInfo.state;

//     if (!source_city || !source_state || !destination_city || !destination_state) {
//       return res.status(400).json({ success: false, message: "Invalid pickup or drop location format" });
//     }

//     const distance = await getDistance(user_pickup, user_drop);
//     if (!distance || distance <= 0) {
//       return res.status(500).json({ success: false, message: "Error calculating distance" });
//     }

//     console.log(`📏 Distance: ${distance} km`);

//     const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
//     let priceDetails = {};
//     let selectedCarType = null;
//     let usedDefaultRates = false;
//     let rates = {};

//     const calculateDistanceBasedRate = (distance) => {
//       const baseRateAt150 = 16.66;
//       if (distance === 150) return baseRateAt150;

//       let rangesBelow150 = Math.floor((150 - distance) / 10);
//       let totalIncrement = 0;

//       for (let i = 1; i <= rangesBelow150; i++) {
//         totalIncrement += 1.19 + ((i - 1) * 0.19);
//       }

//       return parseFloat((baseRateAt150 + totalIncrement).toFixed(2));
//     };

//     const rateQuery = `
//       SELECT hatchback, sedan, suv, suvplus 
//       FROM ${user_trip_type === "One Way" ? "oneway_trip" : "round_trip"} 
//       WHERE source_city = ? AND destination_city = ? AND source_state = ? AND destination_state = ?
//     `;

//     if (distance > 150) {
//       console.log("📦 Distance > 150km — checking DB for rates...");
//       const rateRows = await sequelize.query(rateQuery, {
//         replacements: [source_city, destination_city, source_state, destination_state],
//         type: QueryTypes.SELECT,
//       });
//       if (rateRows.length > 0) {
//         rates = rateRows[0];
//         usedDefaultRates = false;
//         console.log("📦 Rates found in DB:", rates);
//       } else {
//         rates = { hatchback: 12, sedan: 15, suv: 18, suvplus: 22 };
//         usedDefaultRates = true;
//         console.log("📦 No DB match. Using default fixed rates for >150km:", rates);
//       }
//     } else if (distance > 100 && distance < 150) {
//       console.log(" Distance 100–150km — checking DB or using dynamic pricing...");
//       const rateRows = await sequelize.query(rateQuery, {
//         replacements: [source_city, destination_city, source_state, destination_state],
//         type: QueryTypes.SELECT,
//       });
//       if (rateRows.length > 0) {
//         rates = rateRows[0];
//         usedDefaultRates = false;
//         console.log(" Rates found in DB:", rates);
//       } else {
//         const dynamicRate = calculateDistanceBasedRate(distance);
//         rates = {
//           hatchback: dynamicRate,
//           sedan: dynamicRate,
//           suv: dynamicRate,
//           suvplus: dynamicRate,
//         };
//         usedDefaultRates = true;
//         console.log("🧮 Using dynamic rates for 100–150km:", rates);
//       }
//     } else {
//       console.log("🎯 Distance < 100km — using dynamic pricing...");
//       const dynamicRate = calculateDistanceBasedRate(distance);
//       rates = {
//         hatchback: dynamicRate,
//         sedan: dynamicRate,
//         suv: dynamicRate,
//         suvplus: dynamicRate,
//       };
//       usedDefaultRates = true;
//       console.log("🧮 Calculated dynamic rates:", rates);
//     }

//     if (user_trip_type === "Round Trip") {
//       const pickupDate = new Date(date);
//       const dropDate = new Date(return_date);
//       const totalDays = Math.ceil(Math.abs(pickupDate - dropDate) / (1000 * 60 * 60 * 24)) + 1;

//       const minKmPerDay = 300;
//       const driverAllowancePerDay = 300;
//       const totalMinKm = minKmPerDay * totalDays;
//       const driverAllowance = driverAllowancePerDay * totalDays;
//       const totalDistance = distance * totalDays;

//       console.log(`📅 Round Trip Days: ${totalDays}, Total KM: ${totalDistance}, Min KM: ${totalMinKm}`);

//       for (const type of validCarTypes) {
//         const rate = rates[type];
//         if (!rate) continue;
//         let totalCost = 0;
//         if (totalDistance < totalMinKm) {
//           totalCost = totalMinKm * rate + driverAllowance;
//         } else {
//           totalCost = totalDistance * rate;
//         }
//         priceDetails[type] = parseFloat(totalCost.toFixed(2));
//         console.log(`💰 ${type} → Rate: ${rate}, Total: ${priceDetails[type]}`);
//       }
//     } else {
//       for (const type of validCarTypes) {
//         if (rates[type]) {
//           priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
//           console.log(`💰 ${type} → Rate: ${rates[type]}, Total: ${priceDetails[type]}`);
//         }
//       }
//     }

//     if (Object.keys(priceDetails).length === 0) {
//       return res.status(400).json({ success: false, message: "No pricing found for selected car types" });
//     }

//     selectedCarType = carType && validCarTypes.includes(carType)
//       ? carType
//       : Object.entries(priceDetails).reduce(
//           (min, [type, price]) => price < priceDetails[min] ? type : min,
//           validCarTypes.find(type => priceDetails[type])
//         );

//     const formattedDate = new Date(date);
//     const formattedReturnDate = return_date ? new Date(return_date) : null;

//     const booking = await cabBookingSchema.create({
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       source_state,
//       destination_state,
//       date: formattedDate,
//       time,
//       return_date: formattedReturnDate,
//       time_end,
//       name,
//       phone,
//       email,
//       distance,
//       baseAmount: priceDetails,
//       car: selectedCarType,
//       bookingId,
//     });

//     console.log("✅ Booking Saved Successfully!");

//     res.status(201).json({
//       success: true,
//       message: "Booking Created Successfully",
//       bookingId,
//       usedDefaultRates,
//       data: {
//         ...booking.toJSON(),
//         baseAmount: priceDetails,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error creating booking:", error.message);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


// const createBooking = async (req, res) => {
//   try {
//     console.log("🚖 Creating Booking...");

//     const {
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       date,
//       time,
//       return_date,
//       time_end,
//       name,
//       phone,
//       email,
//       carType,
//       bookingId,
//     } = req.body;

//     // Basic Validation
//     if (!user_trip_type || !user_pickup || !user_drop || !date || !time || !name || !phone || !email) {
//       return res.status(400).json({ success: false, message: "All fields are required" });
//     }

//     if (user_trip_type === "Round Trip" && (!return_date || !time_end)) {
//       return res.status(400).json({ success: false, message: "Return Date and Time are required for Round Trip" });
//     }

//     const extractCityAndState = (location) => {
//       const parts = location.split(',').map(p => p.trim());
//       return {
//         city: parts[0] || null,
//         state: parts[1] || null,
//       };
//     };

//     const pickupInfo = extractCityAndState(user_pickup);
//     const dropInfo = extractCityAndState(user_drop);

//     const source_city = pickupInfo.city;
//     const source_state = pickupInfo.state;
//     const destination_city = dropInfo.city;
//     const destination_state = dropInfo.state;

//     if (!source_city || !source_state || !destination_city || !destination_state) {
//       return res.status(400).json({ success: false, message: "Invalid pickup or drop location format" });
//     }

//     const distance = await getDistance(user_pickup, user_drop);
//     if (!distance || distance <= 0) {
//       return res.status(500).json({ success: false, message: "Error calculating distance" });
//     }

//     console.log(`📏 Distance: ${distance} km`);

//     const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
//     let priceDetails = {};
//     let selectedCarType = null;
//     let usedDefaultRates = false;
//     let rates = {};

//     const calculateDistanceBasedRates = (distance) => {
//       const baseRates = {
//         hatchback: 16.66,
//         sedan: 16.66,
//         suv: 20.82,
//         suvplus: 25.0,
//       };

//       const increments = {
//         hatchback: 1.19,
//         sedan: 1.19,
//         suv: 1.25,
//         suvplus: 1.5,
//       };

//       const rates = {};

//       for (const carType of validCarTypes) {
//         let rate = baseRates[carType];

//         if (distance < 150) {
//           const rangesBelow150 = Math.floor((150 - distance) / 10);
//           let totalIncrement = 0;

//           for (let i = 1; i <= rangesBelow150; i++) {
//             totalIncrement += increments[carType] + ((i - 1) * 0.19);
//           }

//           rate += totalIncrement;
//         }

//         rates[carType] = parseFloat(rate.toFixed(2));
//       }

//       return rates;
//     };

//     const rateQuery = `
//       SELECT hatchback, sedan, suv, suvplus 
//       FROM ${user_trip_type === "One Way" ? "oneway_trip" : "round_trip"} 
//       WHERE source_city = ? AND destination_city = ? AND source_state = ? AND destination_state = ?
//     `;

//     if (distance > 150) {
//       console.log("📦 Distance > 150km — checking DB for rates...");
//       const rateRows = await sequelize.query(rateQuery, {
//         replacements: [source_city, destination_city, source_state, destination_state],
//         type: QueryTypes.SELECT,
//       });
//       if (rateRows.length > 0) {
//         rates = rateRows[0];
//         usedDefaultRates = false;
//         console.log("📦 Rates found in DB:", rates);
//       } else {
//         rates = { hatchback: 12, sedan: 15, suv: 18, suvplus: 22 };
//         usedDefaultRates = true;
//         console.log("📦 No DB match. Using default fixed rates for >150km:", rates);
//       }
//     } else if (distance > 100 && distance < 150) {
//       console.log("📐 Distance 100–150km — checking DB or using dynamic pricing...");
//       const rateRows = await sequelize.query(rateQuery, {
//         replacements: [source_city, destination_city, source_state, destination_state],
//         type: QueryTypes.SELECT,
//       });
//       if (rateRows.length > 0) {
//         rates = rateRows[0];
//         usedDefaultRates = false;
//         console.log(" Rates found in DB:", rates);
//       } else {
//         rates = calculateDistanceBasedRates(distance);
//         usedDefaultRates = true;
//         console.log("🧮 Using car-type specific dynamic rates for 100–150km:", rates);
//       }
//     } else {
//       console.log("🎯 Distance < 100km — using dynamic pricing...");
//       rates = calculateDistanceBasedRates(distance);
//       usedDefaultRates = true;
//       console.log("🧮 Calculated car-type specific dynamic rates:", rates);
//     }

//     if (user_trip_type === "Round Trip") {
//       const pickupDate = new Date(date);
//       const dropDate = new Date(return_date);
//       const totalDays = Math.ceil(Math.abs(pickupDate - dropDate) / (1000 * 60 * 60 * 24)) + 1;

//       const minKmPerDay = 300;
//       const driverAllowancePerDay = 300;
//       const totalMinKm = minKmPerDay * totalDays;
//       const driverAllowance = driverAllowancePerDay * totalDays;
//       const totalDistance = distance * totalDays;

//       console.log(`📅 Round Trip Days: ${totalDays}, Total KM: ${totalDistance}, Min KM: ${totalMinKm}`);

//       for (const type of validCarTypes) {
//         const rate = rates[type];
//         if (!rate) continue;
//         let totalCost = 0;
//         if (totalDistance < totalMinKm) {
//           totalCost = totalMinKm * rate + driverAllowance;
//         } else {
//           totalCost = totalDistance * rate;
//         }
//         priceDetails[type] = parseFloat(totalCost.toFixed(2));
//         console.log(`💰 ${type} → Rate: ${rate}, Total: ${priceDetails[type]}`);
//       }
//     } else {
//       for (const type of validCarTypes) {
//         if (rates[type]) {
//           priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
//           console.log(`💰 ${type} → Rate: ${rates[type]}, Total: ${priceDetails[type]}`);
//         }
//       }
//     }

//     if (Object.keys(priceDetails).length === 0) {
//       return res.status(400).json({ success: false, message: "No pricing found for selected car types" });
//     }

//     selectedCarType = carType && validCarTypes.includes(carType)
//       ? carType
//       : Object.entries(priceDetails).reduce(
//           (min, [type, price]) => price < priceDetails[min] ? type : min,
//           validCarTypes.find(type => priceDetails[type])
//         );

//     const formattedDate = new Date(date);
//     const formattedReturnDate = return_date ? new Date(return_date) : null;

//     const booking = await cabBookingSchema.create({
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       source_state,
//       destination_state,
//       date: formattedDate,
//       time,
//       return_date: formattedReturnDate,
//       time_end,
//       name,
//       phone,
//       email,
//       distance,
//       baseAmount: priceDetails,
//       car: selectedCarType,
//       bookingId,
//     });

//     console.log("✅ Booking Saved Successfully!");

//     res.status(201).json({
//       success: true,
//       message: "Booking Created Successfully",
//       bookingId,
//       usedDefaultRates,
//       data: {
//         ...booking.toJSON(),
//         baseAmount: priceDetails,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error creating booking:", error.message);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


// const createBooking = async (req, res) => {
//   try {
//     console.log("🚖 Creating Booking...");

//     const {
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       date,
//       time,
//       return_date,
//       time_end,
//       name,
//       phone,
//       email,
//       carType,
//       bookingId,
//     } = req.body;

//     // Basic Validation
//     if (!user_trip_type || !user_pickup || !user_drop || !date || !time || !name || !phone || !email) {
//       return res.status(400).json({ success: false, message: "All fields are required" });
//     }

//     if (user_trip_type === "Round Trip" && (!return_date || !time_end)) {
//       return res.status(400).json({ success: false, message: "Return Date and Time are required for Round Trip" });
//     }

//     const extractCityAndState = (location) => {
//       const parts = location.split(',').map(p => p.trim());
//       return {
//         city: parts[0] || null,
//         state: parts[1] || null,
//       };
//     };

//     const pickupInfo = extractCityAndState(user_pickup);
//     const dropInfo = extractCityAndState(user_drop);

//     const source_city = pickupInfo.city;
//     const source_state = pickupInfo.state;
//     const destination_city = dropInfo.city;
//     const destination_state = dropInfo.state;

//     if (!source_city || !source_state || !destination_city || !destination_state) {
//       return res.status(400).json({ success: false, message: "Invalid pickup or drop location format" });
//     }

//     const distance = await getDistance(user_pickup, user_drop);
//     if (!distance || distance <= 0) {
//       return res.status(500).json({ success: false, message: "Error calculating distance" });
//     }

//     console.log(`📏 Distance: ${distance} km`);

//     const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
//     let priceDetails = {};
//     let selectedCarType = null;
//     let usedDefaultRates = false;
//     let rates = {};

//     const calculateDistanceBasedRates = (distance) => {
//       const baseRates = {
//         hatchback: 16.66,
//         sedan: 16.66,
//         suv: 20.82,
//         suvplus: 25.0,
//       };

//       const increments = {
//         hatchback: 1.19,
//         sedan: 1.19,
//         suv: 1.25,
//         suvplus: 1.5,
//       };

//       const rates = {};

//       for (const carType of validCarTypes) {
//         let rate = baseRates[carType];

//         if (distance < 150) {
//           const rangesBelow150 = Math.floor((150 - distance) / 10);
//           let totalIncrement = 0;

//           for (let i = 1; i <= rangesBelow150; i++) {
//             totalIncrement += increments[carType] + ((i - 1) * 0.19);
//           }

//           rate += totalIncrement;
//         }

//         rates[carType] = parseFloat(rate.toFixed(2));
//       }

//       return rates;
//     };

//     const rateQuery = `
//       SELECT hatchback, sedan, suv, suvplus 
//       FROM ${user_trip_type === "One Way" ? "oneway_trip" : "round_trip"} 
//       WHERE source_city = ? AND destination_city = ? AND source_state = ? AND destination_state = ?
//     `;

//     if (distance > 150) {
//       console.log("📦 Distance > 150km — checking DB for rates...");
//       const rateRows = await sequelize.query(rateQuery, {
//         replacements: [source_city, destination_city, source_state, destination_state],
//         type: QueryTypes.SELECT,
//       });
//       if (rateRows.length > 0) {
//         rates = rateRows[0];
//         usedDefaultRates = false;
//         console.log("📦 Rates found in DB:", rates);
//       } else {
//         rates = { hatchback: 12, sedan: 15, suv: 18, suvplus: 22 };
//         usedDefaultRates = true;
//         console.log("📦 No DB match. Using default fixed rates for >150km:", rates);
//       }
//     } else if (distance > 100 && distance <= 150) {
//       console.log("📐 Distance 100–150km — checking DB or using dynamic pricing...");
//       const rateRows = await sequelize.query(rateQuery, {
//         replacements: [source_city, destination_city, source_state, destination_state],
//         type: QueryTypes.SELECT,
//       });
//       if (rateRows.length > 0) {
//         rates = rateRows[0];
//         usedDefaultRates = false;
//         console.log(" Rates found in DB:", rates);
//       } else {
//         rates = calculateDistanceBasedRates(distance);
//         usedDefaultRates = true;
//         console.log("🧮 Using car-type specific dynamic rates for 100–150km:", rates);
//       }
//     } else if (distance >= 40 && distance <= 80) {
//       console.log("🎯 Distance 40–80km — applying slab rates...");
//       rates = {
//         hatchback: 22,
//         sedan: 22,
//         suv: 27,
//         suvplus: 26
//       };
//       usedDefaultRates = true;
//       console.log("🧾 Applied fixed rates for 40–80km:", rates);
//     } else if (distance > 80 && distance <= 100) {
//       console.log("🎯 Distance 80–100km — applying slab rates...");
//       rates = {
//         hatchback: 24,
//         sedan: 24,
//         suv: 27,
//         suvplus: 28
//       };
//       usedDefaultRates = true;
//       console.log("🧾 Applied fixed rates for 80–100km:", rates);
//     } else {
//       console.log("🎯 Distance < 40km — using dynamic pricing...");
//       rates = calculateDistanceBasedRates(distance);
//       usedDefaultRates = true;
//       console.log("🧮 Calculated car-type specific dynamic rates:", rates);
//     }

//     if (user_trip_type === "Round Trip") {
//       const pickupDate = new Date(date);
//       const dropDate = new Date(return_date);
//       const totalDays = Math.ceil(Math.abs(pickupDate - dropDate) / (1000 * 60 * 60 * 24)) + 1;

//       const minKmPerDay = 300;
//       const driverAllowancePerDay = 300;
//       const totalMinKm = minKmPerDay * totalDays;
//       const driverAllowance = driverAllowancePerDay * totalDays;
//       const totalDistance = distance * totalDays;

//       console.log(`📅 Round Trip Days: ${totalDays}, Total KM: ${totalDistance}, Min KM: ${totalMinKm}`);

//       for (const type of validCarTypes) {
//         const rate = rates[type];
//         if (!rate) continue;
//         let totalCost = 0;
//         if (totalDistance < totalMinKm) {
//           totalCost = totalMinKm * rate + driverAllowance;
//         } else {
//           totalCost = totalDistance * rate;
//         }
//         priceDetails[type] = parseFloat(totalCost.toFixed(2));
//         console.log(`💰 ${type} → Rate: ${rate}, Total: ${priceDetails[type]}`);
//       }
//     } else {
//       for (const type of validCarTypes) {
//         if (rates[type]) {
//           priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
//           console.log(`💰 ${type} → Rate: ${rates[type]}, Total: ${priceDetails[type]}`);
//         }
//       }
//     }

//     if (Object.keys(priceDetails).length === 0) {
//       return res.status(400).json({ success: false, message: "No pricing found for selected car types" });
//     }

//     selectedCarType = carType && validCarTypes.includes(carType)
//       ? carType
//       : Object.entries(priceDetails).reduce(
//           (min, [type, price]) => price < priceDetails[min] ? type : min,
//           validCarTypes.find(type => priceDetails[type])
//         );

//     const formattedDate = new Date(date);
//     const formattedReturnDate = return_date ? new Date(return_date) : null;

//     const booking = await cabBookingSchema.create({
//       user_trip_type,
//       user_pickup,
//       user_drop,
//       source_state,
//       destination_state,
//       date: formattedDate,
//       time,
//       return_date: formattedReturnDate,
//       time_end,
//       name,
//       phone,
//       email,
//       distance,
//       baseAmount: priceDetails,
//       car: selectedCarType,
//       bookingId,
//     });

//     console.log("✅ Booking Saved Successfully!");

//     res.status(201).json({
//       success: true,
//       message: "Booking Created Successfully",
//       bookingId,
//       usedDefaultRates,
//       data: {
//         ...booking.toJSON(),
//         baseAmount: priceDetails,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error creating booking:", error.message);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

const createBooking = async (req, res) => {
  try {
    console.log("🚖 Creating Booking...");

    const {
      user_trip_type,
      user_pickup,
      user_drop,
      date,
      time,
      return_date,
      time_end,
      name,
      phone,
      email,
      carType,
      bookingId,
    } = req.body;

    console.log("📥 Incoming Body:", req.body);

    if (!user_trip_type || !user_pickup || !user_drop || !date || !time || !name || !phone || !email) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (user_trip_type === "Round Trip" && (!return_date || !time_end)) {
      return res.status(400).json({ success: false, message: "Return Date and Time are required for Round Trip" });
    }

    const extractCityAndState = (location) => {
      const parts = location.split(',').map(p => p.trim());
      return {
        city: parts[0] || null,
        state: parts[1] || null,
      };
    };

    const pickupInfo = extractCityAndState(user_pickup);
    const dropInfo = extractCityAndState(user_drop);

    const source_city = pickupInfo.city;
    const source_state = pickupInfo.state;
    const destination_city = dropInfo.city;
    const destination_state = dropInfo.state;

    const distance = await getDistance(user_pickup, user_drop);
    console.log(`📏 Calculated distance: ${distance} km`);

    if (!distance || distance <= 0) {
      return res.status(500).json({ success: false, message: "Error calculating distance" });
    }

    const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
    let priceDetails = {};
    let selectedCarType = null;
    let usedDefaultRates = false;
    let rates = {};

    const calculateDistanceBasedRates = (distance) => {
      const baseRates = {
        hatchback: 16.66,
        sedan: 17,
        suv: 20.82,
        suvplus: 25.0,
      };
      const increments = {
        hatchback: 1.19,
        sedan: 1.19,
        suv: 1.25,
        suvplus: 1.5,
      };
      const rates = {};

      for (const carType of validCarTypes) {
        let rate = baseRates[carType];
        if (distance < 150) {
          const rangesBelow150 = Math.floor((150 - distance) / 10);
          let totalIncrement = 0;
          for (let i = 1; i <= rangesBelow150; i++) {
            totalIncrement += increments[carType] + ((i - 1) * 0.19);
          }
          rate += totalIncrement;
        }
        rates[carType] = parseFloat(rate.toFixed(2));
      }
      return rates;
    };

    const rateQuery = `
      SELECT hatchback, sedan, suv, suvplus 
      FROM ${user_trip_type === "One Way" ? "oneway_trip" : "round_trip"} 
      WHERE source_city = ? AND destination_city = ? AND source_state = ? AND destination_state = ?
    `;

    const applyDBRatesWithValidation = async () => {
      const rateRows = await sequelize.query(rateQuery, {
        replacements: [source_city, destination_city, source_state, destination_state],
        type: QueryTypes.SELECT,
      });

      if (rateRows.length > 0) {
        const dbRates = rateRows[0];
        const hasValidRates = validCarTypes.some(type => dbRates[type] && dbRates[type] > 0);

        if (hasValidRates) {
          rates = dbRates;
          console.log("✅ Valid rates fetched from DB:", rates);
          for (const type of validCarTypes) {
            const rate = rates[type];
            if (rate && rate > 0) {
              priceDetails[type] = parseFloat((distance * rate).toFixed(2));
            }
          }
          console.log("💰 Price Details from DB:", priceDetails);
          return true;
        }
      }

      // fallback
      rates = calculateDistanceBasedRates(distance);
      usedDefaultRates = true;
      for (const type of validCarTypes) {
        priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
      }
      console.log("⚠️ Used fallback rates:", rates);
      console.log("💰 Fallback Price Details:", priceDetails);
      return false;
    };

    if (distance > 150 || (distance > 100 && distance <= 150)) {
      await applyDBRatesWithValidation();
    } else if (distance <= 40) {
      rates = {
        hatchback: 25.00,
        sedan: 27.50,
        suv: 30.00,
        suvplus: 35.00
      };
      usedDefaultRates = true;
      for (const type of validCarTypes) {
        priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
      }
      console.log("ℹ️ Static rates used for <=40km:", rates);
      console.log("💰 Price Details for <=40km:", priceDetails);
    } else if (distance > 40 && distance <= 60) {
      const basePrice = {
        hatchback: 1000,
        sedan: 1100,
        suv: 1200,
        suvplus: 1400,
      };
      const extraKmRate = {
        hatchback: 25,
        sedan: 27.5,
        suv: 30,
        suvplus: 30,
      };
      const extraKm = distance - 40;
      for (const type of validCarTypes) {
        const price = basePrice[type] + extraKm * extraKmRate[type];
        rates[type] = parseFloat((price / distance).toFixed(2));
        priceDetails[type] = parseFloat(price.toFixed(2));
      }
      usedDefaultRates = true;
      console.log("ℹ️ Distance between 40–60km rates:", rates);
      console.log("💰 Price Details for 40–60km:", priceDetails);
    } else if (distance > 60 && distance <= 80) {
      const chunkRates = [
        { min: 61, max: 65, rate: 36.66 },
        { min: 66, max: 70, rate: 32 },
        { min: 71, max: 75, rate: 31 },
        { min: 76, max: 80, rate: 28 },
      ];
      const basePrices = {
        hatchback: 2200,
        sedan: 2300,
        suv: 2800,
        suvplus: 2800,
      };
      for (const type of validCarTypes) {
        let ratePerKm = 0;
        let basePrice = basePrices[type];
        for (const chunk of chunkRates) {
          if (distance >= chunk.min && distance <= chunk.max) {
            ratePerKm = chunk.rate;
            break;
          }
        }
        if (!ratePerKm) ratePerKm = chunkRates[chunkRates.length - 1].rate;
        const calculatedPrice = distance * ratePerKm;
        const finalPrice = Math.max(basePrice, calculatedPrice);
        rates[type] = parseFloat((finalPrice / distance).toFixed(2));
        priceDetails[type] = parseFloat(finalPrice.toFixed(2));
        console.log(`🚗 ${type.toUpperCase()} - Rate: ₹${ratePerKm}/km, Distance: ${distance}km`);
      }
      usedDefaultRates = true;
      console.log("💰 Price Details for 60–80km:", priceDetails);
    } 
    // else {
    //   rates = calculateDistanceBasedRates(distance);
    //   usedDefaultRates = true;
    //   for (const type of validCarTypes) {
    //     priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
    //   }
    //  console.log(`🚗 ${type.toUpperCase()} - Matched Chunk: ${matchedChunk.min}–${matchedChunk.max} km`);
    // console.log(`💸 Rate Used: ₹${ratePerKm}/km`);
    // console.log(`📏 Distance: ${distance} km`);
    // console.log(`🔢 Calculated Price: ₹${calculatedPrice.toFixed(2)}, Base Price: ₹${basePrice}`);
    // console.log(`✅ Final Price Selected: ₹${finalPrice.toFixed(2)}\n`);
    // }

    else {
  rates = calculateDistanceBasedRates(distance);
  usedDefaultRates = true;
  for (const type of validCarTypes) {
    priceDetails[type] = parseFloat((distance * rates[type]).toFixed(2));
    console.log(`🚗 ${type.toUpperCase()} - Rate Used: ₹${rates[type]}/km`);
    console.log(`📏 Distance: ${distance} km`);
    console.log(`✅ Final Price: ₹${priceDetails[type]}\n`);
  }
}

    if (user_trip_type === "Round Trip") {
      const pickupDate = new Date(date);
      const dropDate = new Date(return_date);
      const totalDays = Math.ceil(Math.abs(pickupDate - dropDate) / (1000 * 60 * 60 * 24)) + 1;
      const minKmPerDay = 300;
      const driverAllowancePerDay = 300;
      const totalMinKm = minKmPerDay * totalDays;
      const driverAllowance = driverAllowancePerDay * totalDays;
      const totalDistance = distance * totalDays;

      for (const type of validCarTypes) {
        const rate = rates[type];
        let totalCost = 0;
        if (totalDistance < totalMinKm) {
          totalCost = totalMinKm * rate + driverAllowance;
        } else {
          totalCost = totalDistance * rate;
        }
        priceDetails[type] = parseFloat(totalCost.toFixed(2));
      }

      console.log("🔁 Round trip total cost breakdown:", priceDetails);
    }

    if (Object.keys(priceDetails).length === 0) {
      return res.status(400).json({ success: false, message: "No pricing found for selected car types" });
    }

    selectedCarType = carType && validCarTypes.includes(carType)
      ? carType
      : Object.entries(priceDetails).reduce(
        (min, [type, price]) => price < priceDetails[min] ? type : min,
        validCarTypes.find(type => priceDetails[type])
      );

    console.log("✅ Final selected car type:", selectedCarType);

    const booking = await cabBookingSchema.create({
      user_trip_type,
      user_pickup,
      user_drop,
      source_state,
      destination_state,
      date: new Date(date),
      time,
      return_date: return_date ? new Date(return_date) : null,
      time_end,
      name,
      phone,
      email,
      distance,
      baseAmount: priceDetails,
      car: selectedCarType,
      bookingId,
    });

    console.log("✅ Booking Saved:", bookingId);
    console.log("📦 Final PriceDetails Sent to Client:", priceDetails);

    res.status(201).json({
      success: true,
      message: "Booking Created Successfully",
      bookingId,
      usedDefaultRates,
      data: {
        ...booking.toJSON(),
        baseAmount: priceDetails,
      },
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};







const updateBookingCarSelection = async (req, res) => {
  try {
    const { carType } = req.body;
    const { bookingId } = req.query;

    if (!bookingId || !carType) {
      return res.status(400).json({
        success: false,
        message: "bookingId and carType are required",
      });
    }

    const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
    if (!validCarTypes.includes(carType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid car type" });
    }

    const rows = await sequelize.query(
      `SELECT baseAmount FROM user_booking WHERE bookingId = ?`,
      {
        replacements: [bookingId],
        type: QueryTypes.SELECT,
      }
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const baseAmountObj = rows[0].baseAmount;
    const carPrice = Math.round(baseAmountObj[carType]);

    if (!carPrice) {
      return res
        .status(400)
        .json({ success: false, message: "Price not found for selected car" });
    }

    await sequelize.query(
      `UPDATE user_booking SET car = ?, price = ? WHERE bookingId = ?`,
      {
        replacements: [carType, carPrice, bookingId],
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      success: true,
      message: "Car type and price updated successfully",
      data: { carType, price: carPrice },
    });
  } catch (error) {
    console.error("❌ Error updating booking car info:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getBaseAmount = async (req, res) => {
  const { user_trip_type, user_pickup, user_drop, date, return_date, car } =
    req.query;

  // Validation
  if (!user_trip_type || !user_pickup || !user_drop || !date) {
    return res.status(400).json({
      message:
        "Missing one or more required query parameters: user_trip_type, user_pickup, user_drop, or date.",
    });
  }

  if (user_trip_type === "Round Trip" && !return_date) {
    return res.status(400).json({
      message: "Missing return_date for Round Trip.",
    });
  }

  try {
    const whereCondition = {
      user_trip_type,
      user_pickup,
      user_drop,
      date,
    };

    if (user_trip_type === "Round Trip") {
      whereCondition.return_date = return_date;
    }

    const result = await cabBookingSchema.findOne({
      attributes: ["baseAmount"],
      where: whereCondition,
    });

    if (!result || !result.baseAmount) {
      const allCombos = await cabBookingSchema.findAll({
        attributes: [
          "user_trip_type",
          "user_pickup",
          "user_drop",
          "date",
          "return_date",
        ],
        group: [
          "user_trip_type",
          "user_pickup",
          "user_drop",
          "date",
          "return_date",
        ],
      });

      return res.status(404).json({
        message:
          "No pricing found for this combination or baseAmount is missing.",
        available: allCombos,
      });
    }

    const baseAmountData = result.baseAmount;

    if (car) {
      const carLower = car.toLowerCase();
      const amount = baseAmountData[carLower];

      if (!amount) {
        return res.status(404).json({
          message: `No base amount found for car type: ${carLower}`,
        });
      }

      return res.json({ baseAmount: Math.round(amount) });
    }

    return res.json({ baseAmount: baseAmountData });
  } catch (err) {
    console.error("Database error:", err);
    return res
      .status(500)
      .json({ error: "Database error", details: err.message });
  }
};

const getDetailsForInvoice = async (req, res) => {
  const { bookingId, car } = req.query;
  console.log("Received query params:", req.query);

  // Validate the request parameters
  if (!bookingId || !car) {
    return res.status(400).json({ message: "Missing bookingId or car" });
  }

  try {
    // IMPORTANT: Make sure your bookingId field in the document exactly matches the query
    const booking = await cabBookingSchema.findOne({ where: { bookingId } });
    console.log("Query filter used: { bookingId: ", bookingId, "}");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Create the invoiceDetails using the correct field names from your schema and document.
    const invoiceDetails = {
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      trip_type: booking.user_trip_type,
      pickup_location: booking.user_pickup,
      drop_location: booking.user_drop,
      date: booking.date,
      time: booking.time,
      distance: booking.distance,
      return_date: booking.return_date,
      bookingId: booking.bookingId,
      car,
      price: booking.price,
    };

    console.log("Invoice details:", invoiceDetails);
    res.json(invoiceDetails);
  } catch (err) {
    console.error("Error in getDetailsForInvoice:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateInvoiceDetails = async (req, res) => {
  try {
    const { bookingId, totalAmount } = req.body;

    if (!bookingId || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "bookingId and totalAmount are required",
      });
    }

    // Update totalAmount in DB
    const [result] = await sequelize.query(
      `UPDATE user_booking SET totalAmount = ? WHERE bookingId = ?`,
      { replacements: [totalAmount, bookingId], type: QueryTypes.UPDATE }
    );

    if (result?.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Total amount updated successfully",
      data: { totalAmount },
    });
  } catch (error) {
    console.error("❌ Error updating invoice:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllCarPrices = async (req, res) => {
  try {
    const { user_trip_type, user_pickup, user_drop } = req.query;

    if (!user_trip_type || !user_pickup || !user_drop) {
      return res.status(400).json({
        success: false,
        message: "Trip type, pickup, and drop are required",
      });
    }

    // Get Distance
    const distance = await getDistance(user_pickup, user_drop);
    console.log("distance",distance)
    if (!distance) {
      return res
        .status(500)
        .json({ success: false, message: "Error calculating distance" });
    }

    const validCarTypes = ["hatchback", "sedan", "suv", "suvplus"];
    let priceDetails = {};

    for (const carType of validCarTypes) {
      let ratePerKmQuery = "";
      let queryParams = [];

      if (user_trip_type === "One Way") {
        ratePerKmQuery = `SELECT ${carType} AS rate_per_km FROM oneway_trip WHERE source_city = ? AND destination_city = ?`;
        queryParams = [user_pickup, user_drop];
      } else if (user_trip_type === "Round Trip") {
        ratePerKmQuery = `SELECT ${carType} AS rate_per_km FROM round_trip WHERE source_city = ? AND destination_city = ?`;
        queryParams = [user_pickup, user_drop];
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid trip type" });
      }

      const [rateRows] = await sequelize.query(
        ratePerKmQuery,
        { replacements: queryParams },
        { type: QueryTypes.SELECT }
      );

      if (rateRows.length > 0 && rateRows[0].rate_per_km) {
        const ratePerKm = rateRows[0].rate_per_km;
        const totalPrice = distance * ratePerKm;
        priceDetails[carType] = Math.round(totalPrice);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        distance,
        priceDetails,
      },
    });
  } catch (error) {
    console.error("❌ Error getting car prices:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllBookingDetails = async (req, res) => {
  try {
    const bookings = await cabBookingSchema.findAll({
      where: { totalAmount: { [Op.not]: null } },
    });
    res.status(200).json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ message: "Server error while fetching bookings." });
  }
};

const getBookingDetailsByBookingId = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await cabBookingSchema.findOne({
      where: { bookingId, totalAmount: { [Op.not]: null } },
    }); // only fetch if totalAmount is NOT NULL
    console.log(booking);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    res.status(500).json({ message: "Server error while fetching booking." });
  }
};

const deleteBookingByBookingId = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const deleted = await cabBookingSchema.destroy({
      where: { bookingId },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or already deleted." });
    }

    res.status(200).json({ message: "Booking successfully deleted." });
  } catch (err) {
    console.error("❌ Error deleting booking:", err);
    res.status(500).json({ message: "Server error while deleting booking." });
  }
};

const updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;

  if (!bookingId) {
    return res.status(400).json({ message: "Booking ID is required." });
  }

  try {
    const booking = await cabBookingSchema.findOne({ where: { bookingId } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Update status
    booking.status = "Confirmed";
    await booking.save();

    res.status(200).json({ message: "Booking status updated to Confirmed." });
  } catch (err) {
    console.error("❌ Error updating booking status:", err);
    res.status(500).json({ message: "Server error while updating status." });
  }
};

//upload Excel 
const uploadExcel= async(req,res)=>{
  // console.log("communication gap")
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No Excel file uploaded' });

    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', public_id: `locations_${Date.now()}` },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer);
    });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    await Location.destroy({ where: {}, transaction });

    const locations = new Set();
    for (const row of data) {
      for (const cell of Object.values(row)) {
        if (typeof cell === 'string' && cell.trim().length > 0) {
          const location = cell.trim().toLowerCase().replace(/\s+/g, ' ');
          locations.add(location);
        }
      }
    }

    if (locations.size === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'No valid locations found' });
    }

    const locationPromises = Array.from(locations).map(location =>
      Location.findOrCreate({ where: { locationName: location }, defaults: {}, transaction })
    );

    await Promise.all(locationPromises);
    await transaction.commit();

    res.json({
      success: true,
      message: 'Excel uploaded successfully',
      data: {
        totalLocations: locations.size,
        fileName: req.file.originalname,
        cloudinaryUrl: cloudinaryResult.secure_url
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Excel upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading file', error: error.message });
  }
}



const checkLocation= async(req,res)=>{
   try {
    const { pickupLocation, dropLocation } = req.body;

    console.log("pickupLocation and Droplocation",pickupLocation,dropLocation)

    if (!pickupLocation && !dropLocation) {
      return res.status(400).json({ success: false, message: 'At least one location is required' });
    }

    const pickupExists = pickupLocation ? await checkLocationExists(pickupLocation) : false;
    const dropExists = dropLocation ? await checkLocationExists(dropLocation) : false;

    if (pickupExists || dropExists) {
      return res.json({
        success: true,
        message: "ok",
        data: { pickupLocation, dropLocation, pickupValid: pickupExists, dropValid: dropExists }
      });
    }

    res.json({
      success: false,
      message: "please contact our team",
      data: { pickupLocation, dropLocation, pickupValid: false, dropValid: false }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}



module.exports = {
  createBooking,
  getBaseAmount,
  getDetailsForInvoice,
  getAllCarPrices,
  updateBookingCarSelection,
  updateInvoiceDetails,
  getAllBookingDetails,
  getBookingDetailsByBookingId,
  deleteBookingByBookingId,
  updateBookingStatus,
   uploadExcel,
  checkLocation
};
