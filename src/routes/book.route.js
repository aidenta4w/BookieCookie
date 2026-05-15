const express = require("express");

const bookController = require("../controller/book.controller");

const router = express.Router();

router.get("/search", bookController.searchBooksOnline);

module.exports = router;
