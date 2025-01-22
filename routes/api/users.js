const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/usersController');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/signup', usersController.signup);
router.post('/login', usersController.login);
router.get('/current', authMiddleware, (req, res) => {
  res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

module.exports = router;
