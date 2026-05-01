const authService = require("../services/auth.service");

const signup = async (req, res) => {
  try {
    const user = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Sign up successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successfully",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
};