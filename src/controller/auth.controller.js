const authViewModel = require("../viewmodels/auth.viewmodel");
const authView = require("../views/auth.view");

const signup = async (req, res) => {
  try {
    const user = await authViewModel.signup(req.body);
    return authView.signupSuccess(res, user);
  } catch (error) {
    return authView.errorResponse(res, 400, error);
  }
};

const login = async (req, res) => {
  try {
    const result = await authViewModel.login(req.body);
    return authView.loginSuccess(res, result);
  } catch (error) {
    return authView.errorResponse(res, 401, error);
  }
};

module.exports = {
  signup,
  login,
};
