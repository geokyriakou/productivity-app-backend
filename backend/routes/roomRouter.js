const { Router } = require("express");
const { protect } = require("../middleware/authMiddleware");
const router = Router();
const {
  getRoom,
  joinRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");

router.route("/").get(protect, getRoom).post(protect, joinRoom);

router.route("/:id").put(protect, updateRoom).delete(protect, deleteRoom);

module.exports = router;
