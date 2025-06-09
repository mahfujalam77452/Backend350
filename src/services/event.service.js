const httpStatus = require('http-status');
const { Event } = require('../models'); // Assuming Event model is exported from models/index.js
const ApiError = require('../utils/ApiError');

/**
 * Create an event
 * @param {Object} eventBody
 * @returns {Promise<Event>}
 */
const createEvent = async (eventBody) => {
  // Add any specific validation or logic before creating
  // Example: Check if clubId exists, etc.
  return Event.create(eventBody);
};

/**
 * Query for events
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: field:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryEvents = async (filter, options) => {
  // Add population if needed, e.g., to get club details or creator details
  // options.populate = 'clubId,createdBy';
  const events = await Event.paginate(filter, options);
  return events;
};

/**
 * Get event by id
 * @param {ObjectId} id
 * @returns {Promise<Event>}
 */
const getEventById = async (id) => {
  // Add population if needed
  return Event.findById(id); //.populate('clubId').populate('createdBy');
};

/**
 * Update event by id
 * @param {ObjectId} eventId
 * @param {Object} updateBody
 * @returns {Promise<Event>}
 */
const updateEventById = async (eventId, updateBody) => {
  const event = await getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  // Add any specific update logic or validation
  Object.assign(event, updateBody);
  await event.save();
  return event;
};

/**
 * Delete event by id
 * @param {ObjectId} eventId
 * @returns {Promise<Event>}
 */
const deleteEventById = async (eventId) => {
  const event = await getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  await event.deleteOne(); // or event.remove() depending on Mongoose version
  return event;
};
const getEvents = async (filter) => {
  // Fetch events based on the filter criteria
  return Event.find(filter)
};

const getAllEvents = async () => {
  return Event.find()
};

module.exports = {
  getAllEvents,
  createEvent,
  getEvents,
  queryEvents,
  getEventById,
  updateEventById,
  deleteEventById,
};
