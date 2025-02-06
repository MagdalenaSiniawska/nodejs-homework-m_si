const express = require('express');
const User = require('../../models/user');

const router = express.Router();

router.get('/users/verify/:verificationToken', async (req, res) => {
  try {
    const { verificationToken } = req.params;

    console.log("Verification Token from request:", verificationToken); // Logowanie tokena, który przychodzi w URL

    const user = await User.findOneAndUpdate(
      { verificationToken },
      { verify: true, $unset: { verificationToken: "" } }, // Usuwamy token po weryfikacji
      { new: true } // new: true - zwróć zaktualizowany dokument
    );

    if (!user) {
      console.log("User not found for token:", verificationToken); // Logowanie, jeśli użytkownik nie został znaleziony
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("User verified:", user.email); // Logowanie, jeśli użytkownik został pomyślnie zweryfikowany

    return res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    console.error("Error during verification:", error); // Logowanie błędów
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;