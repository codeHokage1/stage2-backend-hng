const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/auth");
const httpMocks = require("node-mocks-http");

const Organisation = require("../models/Organisation");
const { getOrganisations } = require("../controllers/organisationsController");
const { Op } = require("sequelize");
const sequelize = require('../config/dbConfig');

beforeAll(async () => {
  await sequelize.authenticate();
  console.log("Connected to the database successfully");
  await sequelize.sync(); // Sync all models
  console.log("Database synced successfully");
});

afterAll(async () => {
  await sequelize.close();
  console.log("Database connection closed");
});

describe("Token Generation", () => {
  // Successfully verifies a valid token and calls next middleware
  it("should call next middleware when token is valid", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer validToken",
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    jwt.verify = jest.fn().mockReturnValue({ userId: "123" });

    verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "validToken",
      process.env.JWT_SECRET
    );
    expect(req.userId).toBe("123");
    expect(next).toHaveBeenCalled();
  });

  // Handles malformed authorization header without crashing
  it("should return 403 when authorization header is malformed", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "MalformedHeader",
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res._getJSONData()).toEqual({
      status: "fail",
      message: "No token provided",
      data: null,
    });
  });

  // Extracts userId from a valid token and attaches it to req object
  it("should extract userId from a valid token and attach it to req object", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer validToken",
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    jwt.verify = jest.fn().mockReturnValue({ userId: "123" });

    verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "validToken",
      process.env.JWT_SECRET
    );
    expect(req.userId).toBe("123");
    expect(next).toHaveBeenCalled();
  });

  // Returns appropriate error message and status code for expired token
  it("should return appropriate error message and status code for expired token", () => {
    const req = httpMocks.createRequest({
      headers: {
        authorization: "Bearer expiredToken",
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    jwt.verify = jest.fn().mockImplementation(() => {
      throw { name: "TokenExpiredError" };
    });

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      status: "error",
      message: "Token expired",
      data: null,
    });
  });
});

describe("Organisation", () => {
  // retrieves organisations created by the user
  it("should retrieve organisations created by the user when user has created or joined organisations", async () => {
    const req = {
      userId: 123,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockOrganisations = [
      {
        orgId: "1",
        name: "Org1",
        description: "Description1",
        createdBy: 123,
        members: [123],
      },
      {
        orgId: "2",
        name: "Org2",
        description: "Description2",
        createdBy: 456,
        members: [123],
      },
    ];

    Organisation.findAll = jest.fn().mockResolvedValue(mockOrganisations);

    await getOrganisations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Organisations created by user & user is a member, retrieved",
      data: {
        organisations: mockOrganisations.map((org) => ({
          orgId: org.orgId,
          name: org.name,
          description: org.description,
        })),
      },
    });
  });

  // user has not created or joined any organisations
  it("should return an empty array when user has not created or joined any organisations", async () => {
    const req = {
      userId: 123,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Organisation.findAll = jest.fn().mockResolvedValue([]);

    await getOrganisations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Organisations created by user & user is a member, retrieved",
      data: {
        organisations: [],
      },
    });
  });

  // Ensure users can’t see data from organisations they don’t have access to.
  it("should not retrieve organisations user does not have access to", async () => {
    const req = httpMocks.createRequest({
      userId: 123,
    });

    const res = httpMocks.createResponse();
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();

    const mockOrganisations = [
      {
        orgId: "1",
        name: "Org1",
        description: "Description1",
        createdBy: 123,
        members: [123],
      },
      {
        orgId: "2",
        name: "Org2",
        description: "Description2",
        createdBy: 456,
        members: [456],
      },
    ];

    Organisation.findAll = jest
      .fn()
      .mockResolvedValue(
        mockOrganisations.filter(
          (org) =>
            org.createdBy === req.userId || org.members.includes(req.userId)
        )
      );

    await getOrganisations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Organisations created by user & user is a member, retrieved",
      data: {
        organisations: [
          {
            orgId: "1",
            name: "Org1",
            description: "Description1",
          },
        ],
      },
    });
  });
});
