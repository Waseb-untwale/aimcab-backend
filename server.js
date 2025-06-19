// index.js
require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./config/db');
const cabRoutes = require('./routes/cabRoutes');
const driverRoutes= require('./routes/driverRoutes')
const cabBookingRoute = require('./routes/cabBookingRoute');
const tripTypePriceRoute = require('./routes/tripTypePriceRoute')
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const db = require('./config/db');
const path = require("path")
// Middlewares
const bodyParser = require('body-parser');
app.use(cors())
app.use("/uploads", express.static("uploads")) 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/api/cabs', cabRoutes);
app.use('/api/drivers',driverRoutes)
app.use('/api/booking', cabBookingRoute);
app.use('/api/tripTypePrice', tripTypePriceRoute);
app.use('/api', authRoutes);
app.get('/',(req,res)=>{
    res.send("Api working")
})

db;


// Sync database and start server
const PORT = process.env.PORT || 5000;
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB sync error:', err);
  });
