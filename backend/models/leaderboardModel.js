const mongoose = require("mongoose");

const leaderboardSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    score: Number,
    daysStreak: { type: Number, default: 0 },
    avgFocus: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
