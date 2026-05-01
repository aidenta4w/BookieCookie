const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const signup = async ({ name, email, password, avatar_url, bio }) => {
  const existedUser = await userModel.findByEmail(email);

  if (existedUser) {
    throw new Error("Email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.createUser({
    name,
    email,
    passwordHash,
    avatarUrl: avatar_url,
    bio,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    bio: user.bio,
  };
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
    },
  };
};

module.exports = {
  signup,
  login,
};
