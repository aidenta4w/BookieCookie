const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { uploadBufferToCloudinary } = require("../config/cloudinary");

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

const getMe = async (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new Error("Unauthorized");
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Unauthorized");
  }

  const user = await userModel.findById(payload.id);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    bio: user.bio,
  };
};

const updateProfile = async (authorizationHeader, payload, avatarFile) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new Error("Unauthorized");
  }

  let jwtPayload;

  try {
    jwtPayload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Unauthorized");
  }

  const existingUser = await userModel.findById(jwtPayload.id);

  if (!existingUser) {
    throw new Error("User not found");
  }

  const normalizedName = `${payload.name ?? ""}`.trim();
  const normalizedBio = `${payload.bio ?? ""}`.trim();

  if (!normalizedName) {
    throw new Error("Name is required");
  }

  let avatarUrl = existingUser.avatar_url ?? null;

  if (avatarFile?.buffer) {
    const uploadResult = await uploadBufferToCloudinary(avatarFile.buffer, {
      originalFilename: avatarFile.originalname,
      folder: "bookiecookie/avatars",
    });
    avatarUrl = uploadResult.secure_url;
  }

  const updatedUser = await userModel.updateUserProfile({
    id: existingUser.id,
    name: normalizedName,
    bio: normalizedBio || null,
    avatarUrl,
  });

  if (!updatedUser) {
    throw new Error("Could not update profile");
  }

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar_url: updatedUser.avatar_url,
    bio: updatedUser.bio,
  };
};

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
};
