const bookViewModel = require("../viewmodels/book.viewmodel");

const searchBooksOnline = async (req, res) => {
  try {
    const data = await bookViewModel.searchBooksOnline(req.query.query);

    return res.status(200).json({
      success: true,
      message: "Books loaded successfully",
      data,
    });
  } catch (error) {
    const message = error.message || "Could not search books online";
    const statusCode = message === "Search query is required"
      ? 400
      : message === "Google Books API rate limit exceeded"
        ? 429
        : 502;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  searchBooksOnline,
};
