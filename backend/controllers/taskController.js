const asyncHandler = require("express-async-handler");

const Task = require("../models/taskModel");

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });

  res.status(200).json(tasks);
});

const createTask = asyncHandler(async (req, res) => {
  if (!req.body.text || !req.body.label || !req.body.dueDate) {
    res.status(400);
    throw new Error("Please add a text field");
  }

  const task = await Task.create({
    text: req.body.text,
    label: req.body.label,
    dueDate: req.body.dueDate,
    user: req.user.id,
  });

  res.status(200).json(task);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(400);
    throw new Error("Task not found");
  }

  const label = req.body.label;
  if (
    label !== "Do Now" &&
    label !== "Decide Later" &&
    label !== "Delegate" &&
    label !== "Delete" &&
    label !== undefined
  ) {
    res.status(400);
    throw new Error("Task is not of correct label");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the logged in user matches the goal user
  if (task.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(updatedTask);
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(400);
    throw new Error("Goal not found");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the logged in user matches the goal user
  if (task.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  await task.deleteOne();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
