const express = require('express')
const router = express.Router();
const contactsController = require('../../controllers/contactsController');

// router.get('/', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

// router.get('/:contactId', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

// router.post('/', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

// router.delete('/:contactId', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

// router.put('/:contactId', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

router.get('/', contactsController.listContacts);

router.get('/:id', contactsController.getById);

router.post('/', contactsController.addContact);

router.delete('/:id', contactsController.removeContact);

router.put('/:id', contactsController.updateContact);

module.exports = router
