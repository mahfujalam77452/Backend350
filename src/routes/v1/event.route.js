const express = require('express');
const path = require('path');
const fs = require('fs'); // Import fs module
const multer = require('multer'); 
const auth = require('../../middlewares/auth'); 
// const validate = require('../../middlewares/validate'); 
const { eventController } = require('../../controllers');

const router = express.Router();

// --- Multer Configuration ---
// Ensure the uploads directory exists at the root of node-express-server
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dirPath = path.join(__dirname, '../../..', 'uploads/events/'); // Use path.join for reliability
    fs.mkdirSync(dirPath, { recursive: true }); // Create directory if it doesn't exist
    cb(null, dirPath); // Pass the full path to multer
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'), false);
        }
        cb(null, true);
    }
});
// -------------------------

router
  .route('/')
  .post(auth('manageEvents'), upload.single('eventImage'), /* validate(eventValidation.createEvent), */ eventController.createEvent)
  .get(auth('getEvents'), /* validate(eventValidation.getEvents), */ eventController.getEvents);
router.get('/all',eventController.getAllEvents);

router
  .route('/:eventId')
  .get(auth('getEvents'), /* validate(eventValidation.getEvent), */ eventController.getEvent)
  .patch(auth('manageEvents'), /* validate(eventValidation.updateEvent), */ eventController.updateEvent)
  .delete(auth('manageEvents'), /* validate(eventValidation.deleteEvent), */ eventController.deleteEvent);

// Optional: Route nested under clubs like /clubs/:clubId/events
// This would require adjusting the controller to pick up clubId from params
// const clubRouter = express.Router({ mergeParams: true });
// clubRouter.route('/')
//   .post(auth('manageEvents'), eventController.createEvent)
//   .get(auth('getEvents'), eventController.getEvents);
// router.use('/clubs/:clubId/events', clubRouter); // Register nested route

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management and retrieval
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create an event
 *     description: Only admins or users with specific roles can create events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - clubId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               clubId:
 *                 type: string
 *                 description: The ID of the club hosting the event
 *               image:
 *                 type: string
 *             example:
 *               title: Annual Tech Fest
 *               description: Join us for the biggest tech event of the year.
 *               date: 2025-10-15T09:00:00.000Z
 *               time: 10:00 AM - 4:00 PM
 *               location: Main Auditorium
 *               clubId: 60d5f60c8e3e0e1b8c3f8e3a
 *               image: https://example.com/event_banner.jpg
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Event'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of events. Supports filtering and pagination.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Event title filter
 *       - in: query
 *         name: clubId
 *         schema:
 *           type: string
 *         description: Filter events by club ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of events
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     description: Retrieve details of a specific event.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Event'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update an event
 *     description: Update details of a specific event. Requires appropriate permissions.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               image:
 *                 type: string
 *             example:
 *               title: Updated Annual Tech Fest
 *               description: Updated details for the tech event.
 *               location: Virtual Event Platform
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Event'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete an event
 *     description: Delete a specific event. Requires appropriate permissions.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event id
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
* @swagger
* components:
*   schemas:
*     Event:
*       type: object
*       properties:
*         id:
*           type: string
*           description: The auto-generated id of the event
*         title:
*           type: string
*         description:
*           type: string
*         date:
*           type: string
*           format: date-time
*         time:
*           type: string
*         location:
*           type: string
*         clubId:
*           type: string
*           description: ID of the associated club
*         createdBy:
*           type: string
*           description: ID of the user who created the event
*         image:
*           type: string
*         createdAt:
*           type: string
*           format: date-time
*           description: Timestamp of creation
*         updatedAt:
*           type: string
*           format: date-time
*           description: Timestamp of last update
*       example:
*         id: 60d5f60c8e3e0e1b8c3f8e3b
*         title: Annual Tech Fest
*         description: Join us for the biggest tech event of the year.
*         date: 2025-10-15T09:00:00.000Z
*         time: 10:00 AM - 4:00 PM
*         location: Main Auditorium
*         clubId: 60d5f60c8e3e0e1b8c3f8e3a
*         createdBy: 5fecb9f5a6b3b83d8c8f8e3a
*         image: https://example.com/event_banner.jpg
*         createdAt: 2023-01-01T12:00:00.000Z
*         updatedAt: 2023-01-01T12:00:00.000Z
*/

