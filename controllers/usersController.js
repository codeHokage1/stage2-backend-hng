const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ShortUniqueId = require("short-unique-id");
require("dotenv").config();

const User = require("../models/User");
const Organisation = require("../models/Organisation");
const { randomUUID } = new ShortUniqueId({ length: 10 });

const {
  handleValidationError,
  handleUniqueConstraintError,
} = require("../utils/helperFunctions");

exports.createUser = async (req, res) => {
  try {
    const newUser = {
      userId: randomUUID(),
      ...req.body,
    };

    if (newUser.password) {
      const hashedPassword = await bcrypt.hash(newUser.password, 10);
      newUser.password = hashedPassword;
    }

    console.log("New User: ", newUser)

    const user = await User.create(newUser);

    const org = await Organisation.create({
      orgId: randomUUID(),
      name: `${user.firstName}'s Organisation`,
      createdBy: user.userId,
    });
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.log(error);
    if (error.name === "SequelizeValidationError") {
      const errors = await handleValidationError(error);
      return res.status(422).json({ errors });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      const errors = await handleUniqueConstraintError(error);
      return res.status(422).json({ errors });
    }

    res.status(500).json({
      status: "error",
      message: error,
      data: null,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    return res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errors = await handleValidationError(error, res);
      return res.status(422).json({ errors });
    } // actually necessary only for POST requests

    res.status(500).json({
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const loggedInUserId = req.userId;
    const requestUserId = req.params.userId;

    if (loggedInUserId === requestUserId) {
      const myDetails = await User.findOne({
        where: { userId: loggedInUserId },
      });
      return res.status(200).json({
        status: "success",
        message: "Successfully fetched your details",
        data: {
          userId: myDetails.userId,
          firstName: myDetails.firstName,
          lastName: myDetails.lastName,
          email: myDetails.email,
          phone: myDetails.phone,
        },
      });
    }

    const foundUserFromRequest = await User.findOne({
      where: { userId: requestUserId },
    });

    console.log("Found user from request: ", foundUserFromRequest);
    if (!foundUserFromRequest) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        data: null,
      });
    }

    // check if user is in the organisation created by the logged in user
    const myOrg = await Organisation.findOne({
      where: { createdBy: loggedInUserId },
    });
    console.log("My org Members: ", myOrg.members);

    if (
      myOrg &&
      myOrg.members &&
      myOrg.members.includes(foundUserFromRequest.userId)
    ) {
      console.log("User is in my org");
      return res.status(200).json({
        status: "success",
        message: "Successfully fetched details of user in your organisation",
        data: {
          userId: foundUserFromRequest.userId,
          firstName: foundUserFromRequest.firstName,
          lastName: foundUserFromRequest.lastName,
          email: foundUserFromRequest.email,
          phone: foundUserFromRequest.phone,
        },
      });
    }

    // check if user is in the same organisation as the logged in user
    const allOrgs = await Organisation.findAll();
    console.log("All orgs: ", allOrgs);
    const allOrgsThatIncludeBothUsers = allOrgs.filter((org) => {
      if (org.members) {
        return (
          org.members.includes(loggedInUserId) &&
          org.members.includes(requestUserId)
        );
      }
    });

    if (allOrgsThatIncludeBothUsers.length > 0) {
      console.log("User is in the same org as me");
      return res.status(200).json({
        status: "success",
        message:
          "Successfully fetched details of user in the same organisation as you",
        data: {
          userId: foundUserFromRequest.userId,
          firstName: foundUserFromRequest.firstName,
          lastName: foundUserFromRequest.lastName,
          email: foundUserFromRequest.email,
          phone: foundUserFromRequest.phone,
        },
      });
    }

    return res.status(403).json({
      status: "fail",
      message: "You are not authorized to view this user's details",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      data: null,
    });
  }
};
