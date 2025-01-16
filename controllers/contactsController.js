// const contacts = require('../models/contacts');

// exports.listContacts = async (req, res) => {
//   const allContacts = await contacts.listContacts();
//   res.status(200).json(allContacts);
// };

// exports.getById = async (req, res) => {
//   const { id } = req.params;
//   const contact = await contacts.getById(id);
//   if (contact) {
//     res.status(200).json(contact);
//   } else {
//     res.status(404).json({ message: "Not found" });
//   }
// };

// exports.addContact = async (req, res) => {
//   const { name, email, phone } = req.body;
//   if (!name || !email || !phone) {
//     return res.status(400).json({ message: "missing required name - field" });
//   }
//   const newContact = await contacts.addContact({ name, email, phone });
//   res.status(201).json(newContact);
// };

// exports.removeContact = async (req, res) => {
//   const { id } = req.params;
//   const removed = await contacts.removeContact(id);
//   if (removed) {
//     res.status(200).json({ message: "contact deleted" });
//   } else {
//     res.status(404).json({ message: "Not found" });
//   }
// };

// exports.updateContact = async (req, res) => {
//   const { id } = req.params;
//   const { name, email, phone } = req.body;
//   if (!name && !email && !phone) {
//     return res.status(400).json({ message: "missing fields" });
//   }
//   const updatedContact = await contacts.updateContact(id, { name, email, phone });
//   if (updatedContact) {
//     res.status(200).json(updatedContact);
//   } else {
//     res.status(404).json({ message: "Not found" });
//   }
// };

const Joi = require('joi');
const contacts = require('../models/contacts');

const contactSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.base': `"name" should be a string`,
    'string.min': `"name" should have at least 3 characters`,
    'any.required': `"name" is required`,
  }),
  email: Joi.string().email().required().messages({
    'string.base': `"email" should be a string`,
    'string.email': `"email" must be a valid email`,
    'any.required': `"email" is required`,
  }),
  phone: Joi.string().pattern(/^\d{3}-\d{3}-\d{4}$/).required().messages({
    'string.pattern.base': `"phone" must match the format XXX-XXX-XXXX`,
    'any.required': `"phone" is required`,
  }),
});

exports.listContacts = async (req, res) => {
  try {
    const allContacts = await contacts.listContacts();
    res.status(200).json(allContacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await contacts.getById(id);
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addContact = async (req, res) => {
  try {
    const { error } = contactSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map(e => e.message).join(', ') });
    }
    const { name, email, phone } = req.body;
    const newContact = await contacts.addContact({ name, email, phone });
    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeContact = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await contacts.removeContact(id);
    if (removed) {
      res.status(200).json({ message: "contact deleted" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "missing fields" });
    }
    const { error } = contactSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map(e => e.message).join(', ') });
    }
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const updatedContact = await contacts.updateContact(id, { name, email, phone });
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
