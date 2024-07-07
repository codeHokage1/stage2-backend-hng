const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  // Get token from bearer token in header
  const token = req.headers["authorization"].split(" ")[1];

  console.log(token);
  if (!token) {
    return res.status(403).json({
      status: "fail",
      message: "No token provided",
      data: null,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log("Decoded: ", decoded);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
        data: null,
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
      data: null,
    });
  }
};
