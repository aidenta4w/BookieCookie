const express = require("express");

const homeController = require("../controller/home.controller");

const router = express.Router();

router.get("/:userId/dashboard", homeController.getDashboard);
router.get("/:userId/statistics", homeController.getStatistics);
router.post("/:userId/goals/yearly", homeController.updateYearlyBookGoal);

module.exports = router;
