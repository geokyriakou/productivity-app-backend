const asyncHandler = require("express-async-handler");
const Leaderboard = require("../models/leaderboardModel");

const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await Leaderboard.find()
    .populate("user", "username")
    .sort({ score: -1 });
  res.status(200).json(leaderboard);
});

module.exports = {
  getLeaderboard,
};
