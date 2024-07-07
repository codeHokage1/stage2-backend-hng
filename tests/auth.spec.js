// const request = require("supertest");
// const app = require("../index"); // Adjust the path to your Express app
// const sequelize = require("../config/dbConfig");

// beforeAll(async () => {
//   await sequelize.authenticate();
//   console.log("Connected to the database successfully");
//   await sequelize.sync(); // Sync all models
//   console.log("Database synced successfully");
// });

// afterAll(async () => {
//   await sequelize.close();
//   console.log("Database connection closed");
// });

// describe("POST /auth/register", () => {
//   it("should register user successfully with default organisation", async () => {
//     const response = await request(app).post("/auth/register").send({
//       userId: "userid123",
//       firstName: "John",
//       lastName: "Doe",
//       email: "john.doe@example.com",
//       password: "Password123!",
//       phone: "9876543210",
//     });

//     expect(response.status).toBe(201);
//     expect(response.body.status).toBe("success");
//     expect(response.body.message).toBe("Registration successful");
//     expect(response.body.data).toHaveProperty("accessToken");
//     expect(response.body.data.user.userId).toBe("userid123");
//     expect(response.body.data.user.firstName).toBe("John");
//     expect(response.body.data.user.lastName).toBe("Doe");
//     expect(response.body.data.user.email).toBe("john.doe@example.com");
//     expect(response.body.data.user.phone).toBe("9876543210");
//   });

//   it("should create an associated organisation for the new user", async () => {
//     const req = {
//       body: {
//         userId: "user456",
//         firstName: "Alice",
//         lastName: "Smith",
//         email: "alice.smith@example.com",
//         password: "securePassword123",
//         phone: "9876543210",
//       },
//     };
//     const res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };
//     const hashedPassword = "hashedSecurePassword123";
//     const user = {
//       userId: "user456",
//       firstName: "Alice",
//       lastName: "Smith",
//       email: "alice.smith@example.com",
//       phone: "9876543210",
//     };
//     const org = {
//       orgId: "org456",
//       name: "Alice's Organisation",
//       createdBy: "user456",
//     };
//     const token = "jwtToken456";

//     bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
//     User.create = jest.fn().mockResolvedValue(user);
//     Organisation.create = jest.fn().mockResolvedValue(org);
//     jwt.sign = jest.fn().mockReturnValue(token);

//     await createUser(req, res);

//     expect(bcrypt.hash).toHaveBeenCalledWith("securePassword123", 10);
//     expect(User.create).toHaveBeenCalledWith({
//       ...req.body,
//       password: hashedPassword,
//     });
//     expect(Organisation.create).toHaveBeenCalledWith({
//       orgId: expect.any(String),
//       name: "Alice's Organisation",
//       createdBy: "user456",
//     });
//     expect(jwt.sign).toHaveBeenCalledWith(
//       { userId: "user456" },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.json).toHaveBeenCalledWith({
//       status: "success",
//       message: "Registration successful",
//       data: {
//         accessToken: token,
//         user: {
//           userId: "user456",
//           firstName: "Alice",
//           lastName: "Smith",
//           email: "alice.smith@example.com",
//           phone: "9876543210",
//         },
//       },
//     });
//   });

//   it("should log the user in successfully", async () => {
//     await request(app).post("/auth/register").send({
//       userId: "userid123",
//       firstName: "Jane",
//       lastName: "Doe",
//       email: "jane.doe@example.com",
//       password: "Password123!",
//       phone: "9876543210",
//     });

//     const loginResponse = await request(app).post("/auth/login").send({
//       email: "jane.doe@example.com",
//       password: "Password123!",
//     });

//     expect(loginResponse.status).toBe(200);
//     expect(loginResponse.body.status).toBe("success");
//     expect(loginResponse.body.data).toHaveProperty("accessToken");
//     expect(loginResponse.body.data.user.userId).toBe("userid123");
//     expect(loginResponse.body.data.user.firstName).toBe("Jane");
//     expect(loginResponse.body.data.user.lastName).toBe("Doe");
//     expect(loginResponse.body.data.user.email).toBe("jane.doe@example.com");
//     expect(loginResponse.body.data.user.phone).toBe("9876543210");
//   });

//   it("should fail if required fields are missing", async () => {
//     const response = await request(app).post("/auth/register").send({
//       userId: "userid123",
//       firstName: "John",
//       // Missing lastName, email, password
//     });

//     expect(response.status).toBe(422);
//     expect(response.body.errors).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           field: "lastName",
//           message: expect.any(String),
//         }),
//         expect.objectContaining({
//           field: "email",
//           message: expect.any(String),
//         }),
//         expect.objectContaining({
//           field: "password",
//           message: expect.any(String),
//         }),
//       ])
//     );
//   });

//   it("should fail if there’s a duplicate email", async () => {
//     await request(app).post("/auth/register").send({
//       userId: "userid123",
//       firstName: "John",
//       lastName: "Doe",
//       email: "duplicate@example.com",
//       password: "Password123!",
//     });

//     const response = await request(app).post("/auth/register").send({
//       userId: "userid456",
//       firstName: "Jane",
//       lastName: "Smith",
//       email: "duplicate@example.com",
//       password: "Password123!",
//     });

//     expect(response.status).toBe(422);
//     expect(response.body.errors).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           field: "email",
//           message: "email must be unique",
//         }),
//       ])
//     );
//   });

//   it("should fail if there is a duplicate userId", async () => {
//     await request(app).post("/auth/register").send({
//       userId: "userid123",
//       firstName: "John",
//       lastName: "Doe",
//       email: "duplicate@example.com",
//       password: "Password123!",
//     });

//     const response = await request(app).post("/auth/register").send({
//       userId: "userid123",
//       firstName: "Jane",
//       lastName: "Smith",
//       email: "duplicate@example.com",
//       password: "Password123!",
//     });

//     expect(response.status).toBe(422);
//     expect(response.body.errors).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           field: "userId",
//           message: "userId must be unique",
//         }),
//       ])
//     );
//   });
// });

const request = require("supertest");
const app = require("../index");
const sequelize = require("../config/dbConfig");
const User = require("../models/User");
const Organisation = require("../models/Organisation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser } = require("../controllers/usersController");
const { login } = require("../controllers/authController");

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

beforeEach(async () => {
  // Clear the database before each test
  await User.destroy({ where: {} });
  await Organisation.destroy({ where: {} });
});

describe("POST /auth/register", () => {
  it("should register user successfully with default organisation", async () => {
    const response = await request(app).post("/auth/register").send({
      userId: "userid123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "Password123!",
      phone: "9876543210",
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Registration successful");
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data.user.userId).toBe("userid123");
    expect(response.body.data.user.firstName).toBe("John");
    expect(response.body.data.user.lastName).toBe("Doe");
    expect(response.body.data.user.email).toBe("john.doe@example.com");
    expect(response.body.data.user.phone).toBe("9876543210");
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

    User.create = jest.fn().mockRejectedValue(error);

    await createUser(req, res);

    expect(User.create).toHaveBeenCalledWith(req.body);
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

  it("should return validation error if there’s a duplicate email", async () => {
    const req = {
      body: {
        userId: "userid123",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        password: "password456",
        phone: "9876543210",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mocking the Sequelize unique constraint error
    const error = new Error("Validation error");
    error.name = "SequelizeUniqueConstraintError";
    error.errors = [{ path: "email", message: "Email already exists" }];

    // Mocking the User.create function to throw the error
    User.create = jest.fn().mockRejectedValue(error);

    // Mocking the handleUniqueConstraintError function
    handleUniqueConstraintError = jest
      .fn()
      .mockReturnValue([{ field: "email", message: "email must be unique" }]);

    await createUser(req, res);

    expect(User.create).toHaveBeenCalledWith(req.body); // Verify User.create is called with the correct body
    expect(res.status).toHaveBeenCalledWith(422); // Verify the response status is 422
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ field: "email", message: "email must be unique" }],
    }); 
  });

  it("should fail if there is a duplicate userId", async () => {
    const req = {
        body: {
          userId: "userid123",
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          password: "password456",
          phone: "9876543210",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      // Mocking the Sequelize unique constraint error
      const error = new Error("Validation error");
      error.name = "SequelizeUniqueConstraintError";
      error.errors = [{ path: "userId", message: "UserId already exists" }];
  
      // Mocking the User.create function to throw the error
      User.create = jest.fn().mockRejectedValue(error);
  
      // Mocking the handleUniqueConstraintError function
      handleUniqueConstraintError = jest
        .fn()
        .mockReturnValue([{ field: "userId", message: "userId must be unique" }]);
  
      await createUser(req, res);
  
      expect(User.create).toHaveBeenCalledWith(req.body); // Verify User.create is called with the correct body
      expect(res.status).toHaveBeenCalledWith(422); // Verify the response status is 422
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ field: "userId", message: "userId must be unique" }],
      }); 
    });
});
