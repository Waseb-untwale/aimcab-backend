const cron = require('node-cron');
const pool = require('../config/db');

const scheduleReversion = ({ tableName, backupTable, endDate }) => {
  const [year, month, day] = endDate.split('-');

  // Schedule at 00:00 of the next day after endDate
  const cronTime = `0 0 ${parseInt(day)} ${parseInt(month)} *`;

  cron.schedule(cronTime, async () => {
    try {
      console.log(`🔁 Reverting data for ${tableName} from backup table.`);
      await pool.query(`DELETE FROM ${tableName}`);
      await pool.query(`INSERT INTO ${tableName} SELECT * FROM ${backupTable}`);
      console.log(`✅ ${tableName} reverted from backup.`);

       // Step 2: Delete the most recent trip-upload Excel file
      const folderPath = path.resolve(__dirname, '../uploads');
      const files = fs.readdirSync(folderPath)
        .filter(file => file.startsWith('trip-upload-') && file.endsWith('.xlsx'))
        .map(file => ({
          name: file,
          time: fs.statSync(path.join(folderPath, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sort by latest

      if (files.length > 0) {
        const latestFile = files[0].name;
        const filePath = path.join(folderPath, latestFile);
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted Excel file: ${filePath}`);
      } else {
        console.warn('⚠️ No Excel file found to delete.');
      }


    } catch (error) {
      console.error(`❌ Failed to revert ${tableName}:`, error);
    }
  });
};

module.exports = { scheduleReversion };
