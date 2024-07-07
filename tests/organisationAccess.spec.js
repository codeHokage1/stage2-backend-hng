const httpMocks = require("node-mocks-http");

const Organisation = require("../models/Organisation");
const { getOrganisations } = require("../controllers/organisationsController");
const sequelize = require("../config/dbConfig");

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

//
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
