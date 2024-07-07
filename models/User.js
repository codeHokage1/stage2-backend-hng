const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

// {
//     "userId": "string" // must be unique
//     "firstName": "string", // must not be null
//     "lastName": "string" // must not be null
//     "email": "string" // must be unique and must not be null
//     "password": "string" // must not be null
//     "phone": "string"
// }

const User = sequelize.define("User", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: {
        msg: "User ID is required",
      },
    },
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "First Name is required",
      },
    },
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Last Name is required",
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: {
        msg: "Email is required",
      },
      isEmail: {
        msg: "Email is invalid",
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Password is required",
      },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = User;
