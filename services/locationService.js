const { Op } = require('sequelize');
const { Location } = require('../models/locationModel');

function normalizeLocation(location) {
  return location.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

async function checkLocationExists(location) {
  if (!location || typeof location !== 'string') return false;

  const parts = location.split(',')
    .map(part => normalizeLocation(part))
    .filter(part => part.length > 0);

  if (parts.length === 0) return false;

  const exists = await Location.findOne({
    where: {
      [Op.or]: parts.map(part => ({
        locationName: {
          [Op.like]: `%${part}%`
        }
      }))
    }
  });

  return !!exists;
}

module.exports = { normalizeLocation, checkLocationExists };
