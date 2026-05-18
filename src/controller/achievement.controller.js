const achievementViewModel = require("../viewmodels/achievement.viewmodel");

const getUserAchievements = async (req, res) => {
  try {
    const data = await achievementViewModel.getUserChallengeProgress(
      req.params.userId,
      req.query.year
    );

    return res.status(200).json({
      success: true,
      message: "Achievements loaded successfully",
      data,
    });
  } catch (error) {
    const statusCode = error.message.startsWith("Invalid ") ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserAchievements,
};
