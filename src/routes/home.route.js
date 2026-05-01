const express = require("express");

const homeController = require("../controller/home.controller");

const router = express.Router();

router.get("/:userId/dashboard", homeController.getDashboard);

module.exports = router;
