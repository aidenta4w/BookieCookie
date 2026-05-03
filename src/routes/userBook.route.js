const express = require("express");
const userBookController = require("../controller/userBook.controller");

const router = express.Router();

router.post("/manual", userBookController.createManualBook);

module.exports = router;
