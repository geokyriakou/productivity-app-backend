const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    occupation: {
      type: String,
      default: "Other",
    },
    experienceLevel: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    daysStreak: {
      type: Number,
      default: 1,
    },
    focusTime: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0],
    },
    lastSession: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
