const Joi = require('joi');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const tmpDir = path.join(__dirname, '../tmp');
const avatarsDir = path.join(__dirname, '../public/avatars');

const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

async function deleteFileWithDelay(filePath) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fs.unlink(filePath);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

exports.uploadMiddleware = upload.single('avatar');

// Konfiguracja SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Funkcja wysyłania e-maila weryfikacyjnego
async function sendVerificationEmail(email, verificationToken) {
  const verificationUrl = `${process.env.BASE_URL}/api/users/verify/${verificationToken}`;

  const msg = {
    to: email,
    from: 'magdalena.paszke94@op.pl',
    subject: 'Please verify your email',
    html: `<p>Click the link below to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`
  };

  try {
    await sgMail.send(msg);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}

exports.updateAvatar = async (req, res) => {
  console.log("User in request:", req.user);

  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  console.log("File received:", req.file);
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { path: tempPath, originalname } = req.file;
  const { id } = req.user;
  console.log("User ID:", id);

  try {
    const avatarName = `${id}-${originalname}`;
    const avatarPath = path.join(avatarsDir, avatarName);

    console.log("Processing image...");

    await sharp(tempPath)
      .resize(250, 250)
      .toFile(avatarPath);

    await deleteFileWithDelay(tempPath);

    const avatarURL = `/avatars/${avatarName}`;
    console.log("Avatar updated:", avatarURL);

    const updatedUser = await User.findByIdAndUpdate(id, { avatarURL }, { new: true });

    res.json({
      avatarURL,
      user: {
        email: updatedUser.email,
        subscription: updatedUser.subscription,
        avatarURL: updatedUser.avatarURL,
      }
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    await deleteFileWithDelay(tempPath).catch(() => {});
    res.status(500).json({ message: `Failed to process the avatar: ${error.message}` });
  }
};

exports.signup = async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email in use' });
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');
    const avatarURL = gravatar.url(email, { s: '250', d: 'retro' }, true);

    const user = new User({ email, password, avatarURL, verificationToken });

    const token = user.generateAuthToken();
    user.token = token;

    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      user: { email: user.email, subscription: user.subscription, avatarURL: user.avatarURL },
      token,
      verificationToken,  
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    const token = user.generateAuthToken();
    user.token = token;

    await user.save();

    res.status(200).json({
      token,
      user: { email: user.email, subscription: user.subscription, avatarURL: user.avatarURL },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrent = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
      avatarURL: user.avatarURL,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const { verificationToken } = req.params;
    console.log('Otrzymany token z URL:', verificationToken);
    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verify = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  };
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "missing required field email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({ message: "Verification has already been passed" });
    }

    await sendVerificationEmail(email, user.verificationToken);
    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

