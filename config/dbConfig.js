const { Sequelize } = require("sequelize");
require("dotenv").config();

// const sequelize = new Sequelize(
//   process.env.PGDATABASE,
//   process.env.PGUSER,
//   process.env.PGPASSWORD,
//   {
//     host: process.env.PGHOST,
//     dialect: "postgres",
//     logging: false, // Set to true if you want to see SQL queries in the console
//   }
// );

const sequelize = new Sequelize(
  process.env.PGDB_URL,
  {
    host: process.env.PGHOST,
    dialect: "postgres",
    logging: false, // Set to true if you want to see SQL queries in the console
    dialectModule: require('pg'),
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // console.log("Connected to the database successfully");
    await sequelize.sync(); // Sync all models
    // console.log("Database synced successfully");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

connectDB();

module.exports = sequelize;
