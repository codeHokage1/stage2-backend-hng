const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

// {
// 	"orgId": "string", // Unique
// 	"name": "string", // Required and cannot be null
// 	"description": "string",
// }

const Organisation = sequelize.define("Organisation", {
  orgId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: {
        msg: "Organisation ID is required",
      },
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Organisation name is required",
      },
    },
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  createdBy: {
    type: DataTypes.STRING,
  },
  members: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
});

module.exports = Organisation;
