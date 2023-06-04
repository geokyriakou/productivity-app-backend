const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Leaderboard = require("../models/leaderboardModel");
const jwt = require("jsonwebtoken");

const nodemailer = require("nodemailer");
let refreshTokens = [];

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, occupation, experienceLevel } = req.body;

  if (!username || !email || !password || !occupation || !experienceLevel) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  let userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email is already registered");
  }
  userExists = await User.findOne({ username });
  if (userExists) {
    res.status(400);
    throw new Error("Username is already in use");
  }

  // Hash password for security
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    occupation,
    experienceLevel,
  });

  if (user) {
    // status 201 its ok and sth was created
    const leaderboardEntry = await Leaderboard.create({
      user: user._id,
      score: 0,
      daysStreak: 0,
      avgFocus: 0,
    });

    const url = `http://127.0.0.1:5173/${user._id}/confirm`;

    const transporter = nodemailer.createTransport({
      // service: "outlook",
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      tls: {
        ciphers: "SSLv3",
      },
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    transporter.sendMail({
      from: '"Pomo Share App" <pomoshare@outlook.com>',
      to: user.email,
      subject: "Confirm Account",
      html: `Please click this email to confirm your email address: <a href="${url}">Confirm Email</a>`,
    });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const tokenGen = asyncHandler(async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "10 days",
      }
    );
    res.json({ accessToken: accessToken });
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // look for email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }
  if (!user.confirmed) {
    res.status(400);
    throw new Error("Please confirm your email to login");
  }

  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.ACCESS_TOKEN_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "10 days",
    }
  );

  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.REFRESH_TOKEN_SECRET
  );

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user.id,
      username: user.username,
      email: user.email,

      accessToken: accessToken,
      refreshToken: refreshToken,
    });

    refreshTokens.push(refreshToken);

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { isActive: true },
      {
        new: true,
      }
    ).select("-password");
  } else {
    res.status(400);
    throw new Error("Invalid credentials");
  }
});

const sendPasswordResetEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User doesn't exist");
  }

  const resetToken = jwt.sign(
    { id: user.id, username: user.username },
    user.password + "-" + user.createdAt,
    {
      expiresIn: "1h",
    }
  );

  const url = `http://127.0.0.1:5173/password/reset/${user._id}/${resetToken}`;

  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  transporter.sendMail({
    from: '"Pomo Share App" <pomoshare@outlook.com>',
    to: email,
    subject: "Reset password",
    html: `Please click this email to change password and gain access to your account: <a href="${url}">Change your password</a>`,
  });
  res.status(200).json("Reset password email sent");
});

const resetPassword = asyncHandler(async (req, res) => {
  const { id, password } = req.body;

  const user = await User.findOne({ _id: id });

  if (!user) {
    res.status(400);
    throw new Error("User doesn't exist");
  }

  const secret = user.password + "-" + user.createdAt;
  const payload = jwt.decode(req.params.token, secret);
  if (!(payload.id.toString() === user._id.toString())) {
    res.status(400);
    throw new Error("Link is expired!");
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { password: hashedPassword },
    {
      new: true,
    }
  ).select("-password");
  res.status(200).json(updatedUser);
});

const confirmEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });

  if (!user) {
    res.status(400);
    throw new Error("User doesn't exist");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { confirmed: true },
    {
      new: true,
    }
  ).select("-password");
  res.status(200).json(updatedUser);
});

const getActiveUsers = asyncHandler(async (req, res) => {
  const activeList = await User.find({ isActive: true }).select("username");
  res.status(200).json(activeList);
});

const getMe = asyncHandler(async (req, res) => {
  res.status(201).json(req.user); // needs authMiddleware
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const today = new Date();

  if (!user) {
    res.status(400);
    throw new Error("user not found");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  let focus = user?.focusTime;

  if (typeof req.body.focusTime === "number") {
    focus[today.getDay()] = req.body.focusTime;
    req.body.focusTime = focus;

    const avgFocus = focus.reduce((a, b) => a + b, 0) / focus.length;

    const leaderboardEntry = await Leaderboard.findOneAndUpdate(
      { user: user._id },
      { avgFocus: avgFocus },
      { new: true }
    );
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).select("-password");
  res.status(200).json(updatedUser);
});

const updateScore = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  const leaderboardEntry = await Leaderboard.findOneAndUpdate(
    { user: user._id },
    { $inc: { score: req.body.score } },
    { new: true }
  );

  // const updatedUser = await User.findByIdAndUpdate(
  //   req.params.id,
  //   { $inc: { score: req.body.score } },
  //   {
  //     new: true,
  //   }
  // ).select("-password");

  res.status(200).json(updatedUser);
});

module.exports = {
  registerUser,
  tokenGen,
  deleteUser,
  loginUser,
  getMe,
  updateUser,
  updateScore,
  getActiveUsers,
  sendPasswordResetEmail,
  resetPassword,
  confirmEmail,
};
