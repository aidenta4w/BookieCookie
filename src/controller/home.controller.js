const homeViewModel = require("../viewmodels/home.viewmodel");

const getDashboard = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const data = await homeViewModel.getDashboard(userId);

    return res.status(200).json({
      success: true,
      message: "Dashboard loaded successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStatistics = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const data = await homeViewModel.getDashboard(userId);

    return res.status(200).json({
      success: true,
      message: "Statistics loaded successfully",
      data: {
        year: data.year,
        statistics: data.statistics,
        goals: data.goals,
        streak: data.streak,
        currentReading: data.currentReading,
        finishedInYear: data.finishedInYear,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateYearlyBookGoal = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const year = Number(req.body.year) || new Date().getUTCFullYear();
    const targetValue = Number(req.body.target_value);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const data = await homeViewModel.updateYearlyBookGoal(
      userId,
      targetValue,
      year
    );

    return res.status(200).json({
      success: true,
      message: "Yearly goal updated successfully",
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
  getDashboard,
  getStatistics,
  updateYearlyBookGoal,
};
