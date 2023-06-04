const mongoose = require("mongoose");

const roomSchema = mongoose.Schema(
  {
    isPlaying: {
      type: Boolean,
      default: false,
    },
    focusMins: {
      type: Number,
      default: 0.2,
    },
    breakMins: {
      type: Number,
      default: 0.05,
    },
    longBreakMins: {
      type: Number,
      default: 0.1,
    },
    longBreakInterval: {
      type: Number,
      default: 4,
    },
    autoChange: {
      type: Boolean,
      default: false,
    },
    member1: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    member2: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    isFull: { type: Boolean, default: false },
    minutesSpent: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
