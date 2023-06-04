const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Room = require("../models/roomModel");
const Leaderboard = require("../models/leaderboardModel");

const getRoom = asyncHandler(async (req, res) => {
  let rooms = await Room.findOne({ member1: req.user.id });
  if (!rooms) {
    rooms = await Room.find({ member2: req.user.id });
  }
  res.status(200).json(rooms);
});

const joinRoom = asyncHandler(async (req, res) => {
  const isMember1 = await Room.findOne({ member1: req.user.id });
  const isMember2 = await Room.findOne({ member2: req.user.id });
  if (isMember1 || isMember2) {
    res.status(401);
    throw new Error("User is already in a room");
  }

  const room = await Room.findOne({ member2: null });
  if (!room) {
    const userId = req.user._id;
    const room = await Room.create({
      // create a new room
      member1: userId,
    });

    const yesterday = new Date();
    const today = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      !req.user.lastSession ||
      req.user.lastSession.toDateString() === yesterday.toDateString()
    ) {
      const leaderboardEntry = await Leaderboard.findOneAndUpdate(
        { user: userId },
        { $inc: { daysStreak: 1 } },
        { new: true }
      );

      const user = await User.findByIdAndUpdate(
        userId,
        { lastSession: today, $inc: { daysStreak: 1 } },
        { new: true }
      );
    } else if (req.user.lastSession.toDateString() !== today.toDateString()) {
      const leaderboardEntry = await Leaderboard.findOneAndUpdate(
        { user: userId },
        { daysStreak: 1 },
        { new: true }
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const user = await User.findByIdAndUpdate(
        userId,
        { lastSession: today, daysStreak: 1 },
        { new: true }
      );
    }

    res.status(200).json(room);
  } else {
    const rooms = await Room.find({});
    const member1Ids = rooms.map((room) => room.member1);

    const getmember1 = await User.find({
      _id: { $in: member1Ids },
      occupation: req.user.occupation,
    }).then((users) => {
      if (users.length === 1) return users[0];
      const userMSEs = users.map((user) => ({
        ...user.toObject(),
        mse: Math.pow(user.score - req.user.score, 2),
      }));

      const closestUser = userMSEs.sort((a, b) => a.mse - b.mse)[1];
      return closestUser;
    });

    if (!getmember1) {
      const room = await Room.create({
        // create a new room
        member1: req.user._id,
      });
      res.status(200).json(room);
    }

    const joinedRoom = await Room.findOneAndUpdate(
      { member1: getmember1._id, member2: undefined },
      { member2: req.user.id, isFull: true },
      {
        new: true,
      }
    );

    res.status(200).json(joinedRoom);
  }
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(400);
    throw new Error("Room not found");
  }

  // Make sure the logged in user matches the goal user
  if (
    room.member1.toString() !== req.user.id &&
    room.member2.toString() !== req.user.id
  ) {
    res.status(401);
    throw new Error("User not authorized");
  }

  const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedRoom);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(400);
    throw new Error("Room not found");
  }

  if (
    room.member1.toString() !== req.user.id &&
    room.member2.toString() !== req.user.id
  ) {
    res.status(401);
    throw new Error("User not authorized");
  }

  await room.deleteOne();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getRoom,
  joinRoom,
  updateRoom,
  deleteRoom,
};
