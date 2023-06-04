const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  deleteUser,
  tokenGen,
  updateScore,
  getActiveUsers,
  sendPasswordResetEmail,
  resetPassword,
  confirmEmail,
  // newPassword,
} = require("../controllers/userController");

router.post("/", registerUser);
router.get("/", getActiveUsers);
router.post("/token", tokenGen); //use this backup token in case jwt is expired
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/:id", protect, updateUser);
router.put("/:id/score", protect, updateScore);
router.delete("/logout", deleteUser);
router.post("/:email", sendPasswordResetEmail);
router.post("/new_password/:id/:token", resetPassword);
router.post("/:id/confirm", confirmEmail);

module.exports = router;
