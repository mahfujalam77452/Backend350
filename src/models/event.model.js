const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins'); // Assuming you have these plugins

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // e.g., "10:00 AM - 12:00 PM"
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    clubId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'clubs', // Updated ref
      required: true,
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users', // Updated ref
      required: true,
    },
    image: { // Optional: URL or path to an image/banner
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// add plugin that converts mongoose to json
eventSchema.plugin(toJSON);
eventSchema.plugin(paginate); // Assuming you use a pagination plugin

/**
 * @typedef Event
 */
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
