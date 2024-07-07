const { Op } = require("sequelize");
const Organisation = require("../models/Organisation");
const ShortUniqueId = require("short-unique-id");
const {
  handleUniqueConstraintError,
  handleValidationError,
} = require("../utils/helperFunctions");

const { randomUUID } = new ShortUniqueId({ length: 10 });

exports.getOrganisations = async (req, res) => {
  try {
    // Get all organisations a user creates or belongs to
    const userId = req.userId;
    const organisations = await Organisation.findAll({
      where: {
        [Op.or]: [
          { createdBy: userId },
          { members: { [Op.contains]: [userId] } },
        ],
      },
    });

    const mappedOrg = organisations.map((org) => {
      return {
        orgId: org.orgId,
        name: org.name,
        description: org.description,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Organisations created by user & user is a member, retrieved",
      data: {
        organisations: mappedOrg,
      },
    });
  } catch (error) {
    res.status(500).json(
      res.status(500).json({
        status: "error",
        message: error,
        data: null,
      })
    );
  }
};

exports.getOneOrganisation = async (req, res) => {
  try {
    const foundOrganisation = await Organisation.findOne({
      where: { orgId: req.params.orgId },
    });

    if (!foundOrganisation) {
      return res.status(404).json({
        status: "fail",
        message: "Organisation not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Organisation successfully retrieved",
      data: {
        orgId: foundOrganisation.orgId,
        name: foundOrganisation.name,
        description: foundOrganisation.description,
      },
    });
  } catch (error) {
    res.status(500).json(
      res.status(500).json({
        status: "error",
        message: error,
        data: null,
      })
    );
  }
};

exports.createOrganisation = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId;

    const newOrg = {
      orgId: randomUUID(),
      name,
      description,
      createdBy: userId,
    };

    const newOrganisation = await Organisation.create(newOrg);

    return res.status(201).json({
      status: "success",
      message: "Organisation created successfully",
      data: {
        orgId: newOrganisation.orgId,
        name: newOrganisation.name,
        description: newOrganisation.description,
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

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User ID is required",
        data: null,
      });
    }
    const orgId = req.params.orgId;

    const foundOrganisation = await Organisation.findOne({
      where: { orgId },
    });

    if (!foundOrganisation) {
      return res.status(404).json({
        status: "fail",
        message: "Organisation not found",
        data: null,
      });
    }

    console.log("foundOrganisation", foundOrganisation)

    // foundOrganisation.members.push(userId);
    // await foundOrganisation.save();

    // update members array
    const updatedOrg = await Organisation.update(
      { members: foundOrganisation.members.concat(userId) },
      { where: { orgId } }
    );

    console.log("updatedOrg", updatedOrg) 

    return res.status(200).json({
      status: "success",
      message: "User added to organisation successfully",
    });
  } catch (error) {
    res.status(500).json(
      res.status(500).json({
        status: "error",
        message: error,
        data: null,
      })
    );
  }
};
