const sequelize = require('./config/db');
const Cab = require('./modls/cabRoutes');

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Database synced ');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch(err => console.error('DB sync error :', err));
