const express = require("express");

const achievementController = require("../controller/achievement.controller");

const router = express.Router();

router.get("/user/:userId", achievementController.getUserAchievements);

module.exports = router;
