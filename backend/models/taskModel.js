const mongoose = require("mongoose");

const taskSchema = mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Please add a text value"],
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    dueDate: Date,
    label: {
      type: String,
      default: "Do Now",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
