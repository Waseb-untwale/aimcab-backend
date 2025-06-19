const sequelize = require('../config/db');
const pool = require('../config/db');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { scheduleReversion } = require('../utils/cronManager');


const revertTripDataNow = async (req, res) => {
  try {
    const { tripType } = req.body;

    if (!tripType || !['One Way', 'Round'].includes(tripType.trim())) {
      return res.status(400).json({ message: 'Invalid or missing tripType.' });
    }

    const tableName = tripType === 'Round' ? 'round_trip' : 'oneway_trip';
    const backupTable = `${tableName}_backup`;

    // Step 1: Check if backup data exists
    const [backupRows] = await pool.query(`SELECT COUNT(*) AS count FROM ${backupTable}`);
    if (backupRows[0].count === 0) {
      return res.status(404).json({ message: 'No backup data found to revert.' });
    }

    // Step 2: Restore backup to original table
    await pool.query(`DELETE FROM ${tableName}`);
    await pool.query(`INSERT INTO ${tableName} SELECT * FROM ${backupTable}`);

    // Step 3: Drop the backup table
    await pool.query(`DROP TABLE IF EXISTS ${backupTable}`);

    // Step 4: Delete the most recent trip-upload Excel file
    const folderPath = path.resolve(__dirname, '../uploads');
    const files = fs.readdirSync(folderPath)
      .filter(file => file.startsWith('trip-upload-') && file.endsWith('.xlsx'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(folderPath, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Latest first

    if (files.length > 0) {
      const latestFile = files[0].name;
      const filePath = path.join(folderPath, latestFile);
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted Excel file: ${filePath}`);
    } else {
      console.warn('⚠️ No Excel file found to delete.');
    }



    return res.status(200).json({
      message: `✅ ${tripType} trip data reverted and backup table removed.`,
    });

  } catch (error) {
    console.error('❌ Error in revertTripDataNow:', error);
    return res.status(500).json({ message: 'Failed to revert and clean up backup table.' });
  }
};

const applyExcelDataTemporarily = async (req, res) => {
  try {
    const tripType = req.body.tripType?.trim();
    const startDate = req.body.startDate?.trim();
    const endDate = req.body.endDate?.trim();

    if (!startDate || !endDate || !tripType || !req.file?.path) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const filePath = req.file.path;
    const tableName = tripType === 'Round' ? 'round_trip' : 'oneway_trip';
    const backupTable = `${tableName}_backup`;

    // Backup old data
    await pool.query(`DROP TABLE IF EXISTS ${backupTable}`);
    await pool.query(`CREATE TABLE ${backupTable} LIKE ${tableName}`);
    await pool.query(`INSERT INTO ${backupTable} SELECT * FROM ${tableName}`);


    // Read Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; 
      const [
        id, source_state, source_city, destination_state, destination_city,
        hatchback, sedan, SedanPremium, suv, suvplus, status
      ] = row.values.slice(1);

      rows.push([
        id, source_state, source_city, destination_state, destination_city,
        hatchback, sedan, SedanPremium, suv, suvplus, status
      ]);
    });

    // Replace data in main table
    await pool.query(`DELETE FROM ${tableName}`);
    for (const row of rows) {
      if (row.length !== 11 || row.includes(undefined)) {
        console.warn('Skipping incomplete row:', row);
        continue;
      }

      await sequelize.query(
        `INSERT INTO ${tableName} 
     (id, source_state, source_city, destination_state, destination_city, hatchback, sedan, SedanPremium, suv, suvplus, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     source_state = VALUES(source_state),
     source_city = VALUES(source_city),
     destination_state = VALUES(destination_state),
     destination_city = VALUES(destination_city),
     hatchback = VALUES(hatchback),
     sedan = VALUES(sedan),
     SedanPremium = VALUES(SedanPremium),
     suv = VALUES(suv),
     suvplus = VALUES(suvplus),
     status = VALUES(status)`,
        { replacements: row }
      );
    }


    // Schedule data reversion
    scheduleReversion({
      tableName,
      backupTable,
      endDate,
    });

    res.status(200).json({
      message: `Trip data updated temporarily. Will revert on ${endDate}`,
    });
  } catch (err) {
    console.error('Error processing Excel upload:', err);
    res.status(500).json({ message: 'Failed to process Excel upload.' });
  }
};

//http://localhost:8000/api/tripTypePrice/download-trip-data?tripType=One%20Way
const downloadTripData = async (req, res) => {
  try {
    const { tripType } = req.query;

    if (!tripType || !['One Way', 'Round'].includes(tripType)) {
      return res.status(400).json({ message: 'Invalid or missing tripType.' });
    }

    const tableName = tripType === 'Round' ? 'round_trip' : 'oneway_trip';
    const [rows] = await pool.query(`SELECT * FROM ${tableName}`);

    if (!rows.length) {
      return res.status(404).json({ message: 'No trip data found.' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${tripType} Trips`);

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Source State', key: 'source_state', width: 20 },
      { header: 'Source City', key: 'source_city', width: 20 },
      { header: 'Destination State', key: 'destination_state', width: 20 },
      { header: 'Destination City', key: 'destination_city', width: 20 },
      { header: 'Hatchback', key: 'hatchback', width: 15 },
      { header: 'Sedan', key: 'sedan', width: 15 },
      { header: 'Sedan Premium', key: 'SedanPremium', width: 20 },
      { header: 'SUV', key: 'suv', width: 15 },
      { header: 'SUV Plus', key: 'suvplus', width: 15 },
      { header: 'Status', key: 'status', width: 10 }
    ];

    // Add rows
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${tripType.replace(' ', '_')}_Trip_Data.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Error generating Excel file:', error);
    return res.status(500).json({ message: 'Failed to generate Excel file.' });
  }
};


//  update-price-one way & round trip for perticular vehicle per km-wise
const updatePriceTripType = async (req, res) => {
  const {
    id,
    tripType, // 'oneway' or 'round'
    source_state,
    source_city,
    destination_state,
    destination_city,
    hatchback,
    sedan,
    suv,
    suvplus
  } = req.body;

  console.log("update api", req.body)

  if (!id || !tripType) {
    return res.status(400).json({ message: 'ID and tripType are required.' });
  }

  const tableName = tripType === 'Round' ? 'round_trip' : 'oneway_trip';

  try {
    const [result] = await sequelize.query(
      `UPDATE ${tableName} SET
    source_state = ?,
    source_city = ?,
    destination_state = ?,
    destination_city = ?,
    hatchback = ?,
    sedan = ?,
    suv = ?,
    suvplus = ?
   WHERE id = ?`,
      {
        replacements: [
          source_state,
          source_city,
          destination_state,
          destination_city,
          hatchback,
          sedan,
          suv,
          suvplus,
          id
        ]
      }
    );


    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    console.log(`✅ ${tripType} trip updated successfully.`);
    res.status(200).json({ message: `${tripType} trip updated successfully.` });

  } catch (err) {
    console.error(`❌ MySQL Update Error [${tripType}]:`, err);
    res.status(500).json({ message: `Server error while updating ${tripType} trip.` });
  }
};

const addNewTripPrice = async (req, res) => {
  const {
    tripType,
    source_state,
    source_city,
    destination_state,
    destination_city,
    hatchback,
    sedan,
    suv,
    suvplus
  } = req.body;

  if (!source_state || !source_city || !destination_state || !destination_city) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  const tableName = tripType === 'Round' ? 'round_trip' : 'oneway_trip';


  try {
    const sql = `
      INSERT INTO ${tableName} 
        (source_state, source_city, destination_state, destination_city, hatchback, sedan, suv, suvplus)
      VALUES (:source_state, :source_city, :destination_state, :destination_city, :hatchback, :sedan, :suv, :suvplus)
      ON DUPLICATE KEY UPDATE 
        hatchback = VALUES(hatchback),
        sedan = VALUES(sedan),
        suv = VALUES(suv),
        suvplus = VALUES(suvplus)
    `;

    await sequelize.query(sql, {
      replacements: {
        source_state,
        source_city,
        destination_state,
        destination_city,
        hatchback,
        sedan,
        suv,
        suvplus
      },
      type: sequelize.QueryTypes.INSERT
    });


    console.log('✅ Price inserted successfully.');
    res.status(200).json({ message: 'New Price successfully.' });

  } catch (err) {
    console.error('❌ MySQL Insert Error:', err);
    res.status(500).json({ message: 'Server error while updating price.' });
  }
};


const tripPriceExist = async (req, res) => {
  const {
    tripType,
    source_state,
    source_city,
    destination_state,
    destination_city,
    id // optional, for update
  } = req.body;

  console.log("➡️ req.body:", req.body);

  if (!tripType || !source_state || !source_city || !destination_state || !destination_city) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const allowedTables = {
    "Round": "round_trip",
    "One Way": "oneway_trip",
  };
  const tableName = allowedTables[tripType];
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid trip type.' });
  }

  try {
    let query = `SELECT id FROM ${tableName} WHERE source_city = ? AND destination_city = ?`;
    let values = [source_city, destination_city];

    if (id) {
      query += ` AND id != ?`;
      values.push(id);
    }

    const [existingTrips] = await sequelize.query(query, { replacements: values });

    if (existingTrips.length > 0) {
      return res.status(200).json({
        exists: true,
        id: existingTrips[0].id,
        message: 'Trip already exists for given locations.'
      });
    }

    return res.status(200).json({
      exists: false,
      message: 'Trip does not exist. You can add it.'
    });

  } catch (err) {
    console.error("❌ Error in tripPriceExist:", err);
    res.status(500).json({ message: 'Server error in tripPriceExist' });
  }
};


module.exports = { updatePriceTripType, addNewTripPrice, tripPriceExist, downloadTripData, applyExcelDataTemporarily, revertTripDataNow };



