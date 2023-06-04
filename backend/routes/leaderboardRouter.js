const { Router } = require("express");
const router = Router();
const { getLeaderboard } = require("../controllers/leaderboardController");

router.get("/", getLeaderboard);

module.exports = router;
