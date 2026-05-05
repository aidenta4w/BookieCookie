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

module.exports = {
  createManualBook,
  getUserLibrary,
};
