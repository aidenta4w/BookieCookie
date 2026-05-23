const noteViewModel = require("../viewmodels/note.viewmodel");

const createNote = async (req, res) => {
  try {
    const data = await noteViewModel.createNote(req.body);

    return res.status(201).json({
      success: true,
      message: "Note saved successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getNotesByUserId = async (req, res) => {
  try {
    const data = await noteViewModel.getNotesByUserId(req.params.userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getNotesByUserBookId = async (req, res) => {
  try {
    const data = await noteViewModel.getNotesByUserBookId({
      userBookId: req.params.userBookId,
      userId: req.query.userId,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const data = await noteViewModel.updateNote(req.params.noteId, req.body);

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const data = await noteViewModel.deleteNote(
      req.params.noteId,
      req.query.userId
    );

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNote,
  getNotesByUserId,
  getNotesByUserBookId,
  updateNote,
  deleteNote,
};
