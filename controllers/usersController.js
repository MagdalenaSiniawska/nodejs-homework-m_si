const Joi = require('joi');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const Jimp = require('jimp');

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

exports.updateAvatar = async (req, res) => {
  const { path: tempPath, originalname } = req.file;
  const { id } = req.user;

  try {
    const avatarName = `${id}-${originalname}`;
    const avatarPath = path.join(avatarsDir, avatarName);

    const image = await Jimp.read(tempPath);
    await image.resize(250, 250).writeAsync(avatarPath);

    await fs.unlink(tempPath);

    const avatarURL = `/avatars/${avatarName}`;
    await User.findByIdAndUpdate(id, { avatarURL });

    res.json({ avatarURL });
  } catch (error) {
    await fs.unlink(tempPath);
    res.status(500).json({ message: 'Failed to process the avatar' });
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

    const avatarURL = gravatar.url(email, { s: '250', d: 'retro' }, true);
    const user = new User({ email, password, avatarURL });
    const token = user.generateAuthToken();
    user.token = token;
    await user.save();

    res.status(201).json({
      user: { email: user.email, subscription: user.subscription, avatarURL: user.avatarURL },
      token,
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

exports.uploadMiddleware = upload.single('avatar');