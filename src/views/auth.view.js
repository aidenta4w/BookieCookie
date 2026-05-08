const signupSuccess = (res, user) => {
  return res.status(201).json({
    success: true,
    message: "Sign up successfully",
    data: user,
  });
};

const loginSuccess = (res, result) => {
  return res.status(200).json({
    success: true,
    message: "Login successfully",
    data: result,
  });
};

const profileSuccess = (res, user) => {
  return res.status(200).json({
    success: true,
    message: "Fetch profile successfully",
    data: user,
  });
};

const profileUpdatedSuccess = (res, user) => {
  return res.status(200).json({
    success: true,
    message: "Update profile successfully",
    data: user,
  });
};

const errorResponse = (res, statusCode, error) => {
  return res.status(statusCode).json({
    success: false,
    message: error.message,
  });
};

module.exports = {
  signupSuccess,
  loginSuccess,
  profileSuccess,
  profileUpdatedSuccess,
  errorResponse,
};
