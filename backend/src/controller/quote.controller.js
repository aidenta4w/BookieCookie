const quoteViewModel = require("../viewmodels/quote.viewmodel");

const createQuote = async (req, res) => {
  try {
    const data = await quoteViewModel.createQuote(req.body, req.file);

    return res.status(201).json({
      success: true,
      message: "Quote saved successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getQuotesByUserId = async (req, res) => {
  try {
    const data = await quoteViewModel.getQuotesByUserId(req.params.userId);

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

const getQuotesByUserBookId = async (req, res) => {
  try {
    const data = await quoteViewModel.getQuotesByUserBookId({
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

module.exports = {
  createQuote,
  getQuotesByUserId,
  getQuotesByUserBookId,
};
