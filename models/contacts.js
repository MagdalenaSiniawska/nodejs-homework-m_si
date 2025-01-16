// const fs = require('fs/promises')

// const listContacts = async () => {}

// const getContactById = async (contactId) => {}

// const removeContact = async (contactId) => {}

// const addContact = async (body) => {}

// const updateContact = async (contactId, body) => {}

// module.exports = {
//   listContacts,
//   getContactById,
//   removeContact,
//   addContact,
//   updateContact,
// }

const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const contactsPath = path.join(__dirname, '../models/contacts.json');

const listContacts = async () => {
  const data = await fs.readFile(contactsPath, 'utf8');
  return JSON.parse(data);
};

const getById = async (id) => {
  const contacts = await listContacts();
  return contacts.find(contact => contact.id === id);
};

const addContact = async ({ name, email, phone }) => {
  const contacts = await listContacts();
  const newContact = { id: uuidv4(), name, email, phone };
  contacts.push(newContact);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return newContact;
};

const removeContact = async (id) => {
  const contacts = await listContacts();
  const index = contacts.findIndex(contact => contact.id === id);
  if (index === -1) return null;
  const [removedContact] = contacts.splice(index, 1);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return removedContact;
};

const updateContact = async (id, updatedFields) => {
  const contacts = await listContacts();
  const index = contacts.findIndex(contact => contact.id === id);
  if (index === -1) return null;
  contacts[index] = { ...contacts[index], ...updatedFields };
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return contacts[index];
};

module.exports = { listContacts, getById, addContact, removeContact, updateContact };