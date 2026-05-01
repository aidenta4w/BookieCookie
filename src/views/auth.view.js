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

const errorResponse = (res, statusCode, error) => {
  return res.status(statusCode).json({
    success: false,
    message: error.message,
  });
};

module.exports = {
  signupSuccess,
  loginSuccess,
  errorResponse,
};
