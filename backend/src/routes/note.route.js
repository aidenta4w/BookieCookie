const express = require("express");
const noteController = require("../controller/note.controller");

const router = express.Router();

router.get("/user/:userId", noteController.getNotesByUserId);
router.get("/book/:userBookId", noteController.getNotesByUserBookId);
router.post("/", noteController.createNote);
router.put("/:noteId", noteController.updateNote);
router.delete("/:noteId", noteController.deleteNote);

module.exports = router;
