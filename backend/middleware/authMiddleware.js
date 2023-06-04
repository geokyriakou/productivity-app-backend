const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  try {
    // Get token from headers
    token = authorization.split(" ")[1];

    // verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // get user from model
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    res.status(401);
    throw new Error(error);
  }
});

module.exports = { protect };
