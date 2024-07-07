const request = require("supertest");
const app = require("../index");
const sequelize = require("../config/dbConfig");
const User = require("../models/User");
const Organisation = require("../models/Organisation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser } = require("../controllers/usersController");
const { login } = require("../controllers/authController");
const httpMocks = require("node-mocks-http");
const { getOrganisations } = require("../controllers/organisationsController");
const { verifyToken } = require("../middlewares/auth");
const {
  handleValidationError,
  handleUniqueConstraintError,
} = require("../utils/helperFunctions");

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../models/User.js");
jest.mock("../models/Organisation.js");
jest.mock("../utils/helperFunctions.js");

let server;

beforeAll(async () => {
  await sequelize.authenticate();
  // console.log("Connected to the database successfully");
  await sequelize.sync(); // Sync all models
  // console.log("Database synced successfully");

  const PORT = process.env.PORT || 3000; // Define the port

  server = app.listen(PORT, () => {
    // Start the server and assign to `server`
    // console.log(`Server is running on port ${PORT} 🚀`);
  });
}, 30000);

afterAll(async () => {
  await sequelize.close(); // Close the database connection
  // console.log("Database connection closed");

  if (server) {
    server.close(); // Close the server instance
    // console.log("Server closed");
  }
}, 30000);

beforeEach(async () => {
  // Clear the database before each test
  await User.destroy({ where: {} });
  await Organisation.destroy({ where: {} });
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

describe("End-to-End Test: /auth/register", () => {
  it("should register user successfully with default organisation", async () => {
    const reqBody = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "Password123!",
      phone: "9876543210",
    };

    const newUser = {
      userId: "generated-uuid",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "9876543210",
      password: "hashed-password", // This would be the hashed password
    };

    const newOrganisation = {
      orgId: "generated-org-uuid",
      name: "John's Organisation",
      createdBy: newUser.userId,
    };

    const token = "generated-jwt-token";

    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockResolvedValue(newUser);
    Organisation.create.mockResolvedValue(newOrganisation);
    jwt.sign.mockReturnValue(token);

    const response = await request(app).post("/auth/register").send(reqBody);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Registration successful");
    expect(response.body.data).toHaveProperty("accessToken", token);
    expect(response.body.data.user.firstName).toBe("John");
    expect(response.body.data.user.lastName).toBe("Doe");
    expect(response.body.data.user.email).toBe("john.doe@example.com");
    expect(response.body.data.user.phone).toBe("9876543210");

    expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
    expect(User.create).toHaveBeenCalledWith({
      ...reqBody,
      userId: expect.any(String),
      password: "hashed-password",
    });
    expect(Organisation.create).toHaveBeenCalledWith({
      orgId: expect.any(String),
      name: "John's Organisation",
      createdBy: newUser.userId,
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: newUser.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  it("should create an associated organisation for the new user", async () => {
    const req = {
      body: {
        userId: "user456",
        firstName: "Alice",
        lastName: "Smith",
        email: "alice.smith@example.com",
        password: "securePassword123",
        phone: "9876543210",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const hashedPassword = "hashedSecurePassword123";
    const user = {
      userId: "user456",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice.smith@example.com",
      phone: "9876543210",
    };
    const org = {
      orgId: "org456",
      name: "Alice's Organisation",
      createdBy: "user456",
    };
    const token = "jwtToken456";

    bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
    User.create = jest.fn().mockResolvedValue(user);
    Organisation.create = jest.fn().mockResolvedValue(org);
    jwt.sign = jest.fn().mockReturnValue(token);

    await createUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("securePassword123", 10);
    expect(User.create).toHaveBeenCalledWith({
      ...req.body,
      password: hashedPassword,
    });
    expect(Organisation.create).toHaveBeenCalledWith({
      orgId: expect.any(String),
      name: "Alice's Organisation",
      createdBy: "user456",
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: "user456" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Registration successful",
      data: {
        accessToken: token,
        user: {
          userId: "user456",
          firstName: "Alice",
          lastName: "Smith",
          email: "alice.smith@example.com",
          phone: "9876543210",
        },
      },
    });
  });

  it("should return 200 and a token when login is successful with valid email and password", async () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const foundUser = {
      userId: 1,
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      phone: "1234567890",
      password: await bcrypt.hash("password123", 10),
    };
    User.findOne = jest.fn().mockResolvedValue(foundUser);
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    jwt.sign = jest.fn().mockReturnValue("fake-jwt-token");

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Login successful",
        data: expect.objectContaining({
          accessToken: "fake-jwt-token",
          user: expect.objectContaining({
            userId: foundUser.userId,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            phone: foundUser.phone,
          }),
        }),
      })
    );
  });

  it("should return validation error when required fields are missing", async () => {
    const req = {
      body: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mocking the Sequelize validation error
    const error = new Error();
    error.name = "SequelizeValidationError";
    error.errors = [
      { path: "firstName", message: "First name is required" },
      { path: "lastName", message: "Last name is required" },
      { path: "email", message: "Email is required" },
      { path: "password", message: "Password is required" },
      { path: "phone", message: "Phone number is required" },
    ];

    User.create.mockRejectedValue(error);
    handleValidationError.mockReturnValue([
      { field: "firstName", message: "First name is required" },
      { field: "lastName", message: "Last name is required" },
      { field: "email", message: "Email is required" },
      { field: "password", message: "Password is required" },
      { field: "phone", message: "Phone number is required" },
    ]);

    await createUser(req, res);

    expect(User.create).toHaveBeenCalledWith({
      userId: expect.any(String),
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
    });
    expect(handleValidationError).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      errors: [
        { field: "firstName", message: "First name is required" },
        { field: "lastName", message: "Last name is required" },
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
        { field: "phone", message: "Phone number is required" },
      ],
    });
  });

  // it("should return validation error if there’s a duplicate email", async () => {
  //   const req = {
  //     body: {
  //       firstName: "Jane",
  //       lastName: "Doe",
  //       email: "jane.doe@example.com",
  //       password: "password123",
  //       phone: "9876543210",
  //     },
  //   };
  //   const res = {
  //     status: jest.fn().mockReturnThis(),
  //     json: jest.fn(),
  //   };

  //   // Mocking the Sequelize unique constraint error
  //   const mockError = new Error("Validation error");
  //   mockError.name = "SequelizeUniqueConstraintError";
  //   mockError.errors = [{ path: "email", message: "Email already exists" }];

  //   // Mocking the User.create function to throw the error
  //   User.create.mockRejectedValue(mockError);

  //   // Mocking the handleUniqueConstraintError function
  //   handleUniqueConstraintError.mockReturnValue([
  //     { field: "email", message: "email must be unique" },
  //   ]);

  //   // Mocking bcrypt hash function
  //   bcrypt.hash.mockResolvedValue("hashedPassword123");

  //   // Mocking ShortUniqueId
  //   const { randomUUID } = require("short-unique-id");
  //   randomUUID.mockReturnValue("userId123");
  //   // jest.spyOn(uid, "randomUUID").mockReturnValue("userId123");

  //   await createUser(req, res);

  //   expect(User.create).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       firstName: "Jane",
  //       lastName: "Doe",
  //       email: "jane.doe@example.com",
  //       password: "hashedPassword123",
  //       phone: "9876543210",
  //       userId: "userId123",
  //     })
  //   ); // Verify User.create is called with the correct body
  //   expect(res.status).toHaveBeenCalledWith(422); // Verify the response status is 422
  //   expect(res.json).toHaveBeenCalledWith({
  //     errors: [{ field: "email", message: "email must be unique" }],
  //   });
  //   expect(handleUniqueConstraintError).toHaveBeenCalledWith(mockError); // Verify handleUniqueConstraintError is called with the error
  // }, 10000);
  // it("should fail if there is a duplicate userId", async () => {
  //   const req = {
  //     body: {
  //       firstName: "Jane",
  //       lastName: "Doe",
  //       email: "jane.doe@example.com",
  //       password: "password456",
  //       phone: "9876543210",
  //     },
  //   };
  //   const res = {
  //     status: jest.fn().mockReturnThis(),
  //     json: jest.fn(),
  //   };

  //   // Mocking the Sequelize unique constraint error
  //   const error = new Error("Validation error");
  //   error.name = "SequelizeUniqueConstraintError";
  //   error.errors = [{ path: "userId", message: "UserId already exists" }];

  //   // Mocking the User.create function to throw the error
  //   User.create = jest.fn().mockRejectedValue(error);

  //   // Mocking the handleUniqueConstraintError function
  //   handleUniqueConstraintError = jest
  //     .fn()
  //     .mockReturnValue([{ field: "userId", message: "userId must be unique" }]);

  //   await createUser(req, res);

  //   expect(User.create).toHaveBeenCalledWith(req.body); // Verify User.create is called with the correct body
  //   expect(res.status).toHaveBeenCalledWith(422); // Verify the response status is 422
  //   expect(res.json).toHaveBeenCalledWith({
  //     errors: [{ field: "userId", message: "userId must be unique" }],
  //   });
  // });
});
