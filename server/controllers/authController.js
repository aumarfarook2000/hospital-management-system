import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "node:crypto";
import sendEmail from "../utils/sendEmail.js";
import { passwordResetTemplate } from "../utils/emailTemplates.js";
import Setting from "../models/Setting.js";

const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,

      // Public registration can only create patient accounts.
      role: "patient",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileId: user.profileId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileId: user.profileId,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

const RESET_TOKEN_MINUTES = 15;

const forgotPassword = async (req, res) => {
  const genericMessage =
    "If an active account exists for this email, a password reset link will be sent.";

  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email,
      status: "active",
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.json({
        success: true,
        message: genericMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires = new Date(
      Date.now() + RESET_TOKEN_MINUTES * 60 * 1000,
    );

    await user.save();

    const clientUrl = (
      process.env.CLIENT_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Get email settings from MongoDB
    const emailSettings = await Setting.findOne().lean();

    // Hospital name from Admin Settings
    const hospitalName =
      emailSettings?.hospitalName || "Hospital Management System";

    // Email subject from Admin Settings
    const emailSubject =
      emailSettings?.emailResetSubject ||
      "Reset Your Password - Hospital Management System";

    try {
      await sendEmail({
        to: user.email,

        // Subject from Admin Settings
        subject: emailSubject,

        // Plain text email
        text: `Hello ${user.name},

${
  emailSettings?.emailResetMessage ||
  "We received a request to reset your password."
}

Reset your password using this link:
${resetUrl}

This link expires in 15 minutes.

If you did not request this, ignore this email.

${hospitalName}`,

        // Professional HTML email
        html: passwordResetTemplate({
          name: user.name,
          resetUrl,
          hospitalName,

          emailResetHeading: emailSettings?.emailResetHeading,

          emailResetMessage: emailSettings?.emailResetMessage,

          emailResetButtonText: emailSettings?.emailResetButtonText,

          emailResetButtonColor: emailSettings?.emailResetButtonColor,

          emailResetFooter: emailSettings?.emailResetFooter,
        }),
      });
    } catch (mailError) {
      console.error("Password reset email error:", mailError);

      // Clear a token that was never delivered.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }

    return res.json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process the request.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset link.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      status: "active",
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or expired. Request a new link.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
    });
  }
};

export { register, login, getMe, forgotPassword, resetPassword };
