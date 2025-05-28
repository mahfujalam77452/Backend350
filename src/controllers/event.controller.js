const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { eventService } = require('../services'); // We will create this service next
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick'); // Assuming this utility exists

const createEvent = catchAsync(async (req, res) => {
  // Get the event data from the request body
  const eventBody = { ...req.body }; // Copy all fields from body

  // Ensure we have a clubId
  if (!eventBody.clubId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Club ID is required');
  }

  // Add createdBy from authenticated user
  eventBody.createdBy = req.user.id;

  // Pass the data to the service
  const event = await eventService.createEvent(eventBody);
  res.status(httpStatus.CREATED).send(event);
});
const getEvents = catchAsync(async (req, res) => {
  // Define filters based on query parameters (e.g., title, date range)
  const filter = pick(req.query, ['title', 'clubId']); // Add more filterable fields as needed

  // If clubId is part of the route (e.g., /api/clubs/:clubId/events)
  if (req.params.clubId) {
      filter.clubId = req.params.clubId;
  }

  // Fetch events from the service
  const events = await eventService.getEvents(filter); // Assuming this service method exists

  // Send the events back in the response
  res.status(httpStatus.OK).send(events);
});

const getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  res.send(event);
});
const getAllEvents = catchAsync(async (req, res) => {
  const events = await eventService.getAllEvents(); // Call a new service method
  res.status(httpStatus.OK).send(events);
});
const updateEvent = catchAsync(async (req, res) => {
  // TODO: Add authorization check: ensure user can update this specific event
  const event = await eventService.updateEventById(req.params.eventId, req.body);
  res.send(event);
});

const deleteEvent = catchAsync(async (req, res) => {
  // TODO: Add authorization check: ensure user can delete this specific event
  await eventService.deleteEventById(req.params.eventId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getAllEvents,
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
};
