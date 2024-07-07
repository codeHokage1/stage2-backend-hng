const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/auth");
const httpMocks = require("node-mocks-http");

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