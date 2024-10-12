import { User } from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { createToken, verifyToken } from "../utils/jwt.js";

export const Register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(401).json({
        message: "Invalid data",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        message: "This email is already used",
        success: false,
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 16);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.error(error);
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: "Invalid data",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    console.log(password);

    const isMatch = await bcryptjs.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    const token = await createToken({ id: user._id });
    // console.log(token);

  const oneDay = 1000 * 60 * 60 * 24;
  return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // secure flag for production
        expires: new Date(Date.now() + oneDay), // 1 day expiration
      })
      .json({
        message: `Welcome back ${user.fullName}`,
        user,
        success: true,
        token
      });
  } catch (error) {
    console.error(error);
  }
};

export const Logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now() - 1), 
        httpOnly: true,
      })
      .json({
        message: "User logged out successfully.",
        success: true,
      });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "An error occurred during logout.",
      success: false,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;

    console.log("token");

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const decoded = jwt.verify(token, "ChauhanRutvik");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {

    // console.error(error);
    console.log("Unauthorized")
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }
};

  export const updateUser = async (req, res) => {
    try {
      const { fullName, gender, location, birthday, github, skills, education, linkedIn } = req.body;
      console.log("req.body", req.body);

      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized", success: false });
      }

      const decoded = jwt.verify(token, "ChauhanRutvik");
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
      }

      // Update the fields even if they are empty strings
      console.log("fullName", fullName);
      if (fullName !== undefined) user.fullName = fullName;
      if (gender !== undefined) user.gender = gender;
      if (location !== undefined) user.location = location;
      if (birthday !== undefined) user.birthday = birthday;
      if (github !== undefined) user.github = github;
      if (skills !== undefined) user.skills = skills;
      if (education !== undefined) user.education = education;
      if (linkedIn !== undefined) user.linkedIn = linkedIn;

      await user.save();

      return res.status(200).json({
        message: "Profile updated successfully",
        user,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        success: false,
      });
    }
  };

