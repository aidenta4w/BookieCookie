const userBookViewModel = require("../viewmodels/userBook.viewmodel");

const createManualBook = async (req, res) => {
  try {
    const data = await userBookViewModel.createManualBook(req.body, req.file);

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserLibrary = async (req, res) => {
  try {
    const data = await userBookViewModel.getUserLibrary(req.params.userId);

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

const getUserBookDetail = async (req, res) => {
  try {
    const data = await userBookViewModel.getUserBookDetail({
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

const updateManualBook = async (req, res) => {
  try {
    const data = await userBookViewModel.updateManualBook(
      req.params.userBookId,
      req.body,
      req.file
    );

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const startReadingBook = async (req, res) => {
  try {
    const data = await userBookViewModel.startReadingBook(
      req.params.userBookId,
      req.body.user_id
    );

    return res.status(200).json({
      success: true,
      message: "Reading started",
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
  createManualBook,
  getUserLibrary,
  getUserBookDetail,
  updateManualBook,
  startReadingBook,
};
