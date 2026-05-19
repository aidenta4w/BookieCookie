/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and profile APIs
 *   - name: Achievements
 *     description: User challenge progress and achievement APIs
 *   - name: Home
 *     description: Dashboard, statistics, and yearly goal APIs
 *   - name: Books
 *     description: External Google Books search API
 *   - name: Quotes
 *     description: Quote and OCR-related APIs
 *   - name: Notes
 *     description: Book note APIs
 *   - name: UserBooks
 *     description: Personal library and reading session APIs
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Invalid user id
 *     AuthUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 5
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@example.com
 *         avatar_url:
 *           type: string
 *           nullable: true
 *           example: https://res.cloudinary.com/demo/avatar.jpg
 *         bio:
 *           type: string
 *           nullable: true
 *           example: Cozy reader and note taker.
 *     SignupRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         avatar_url:
 *           type: string
 *           nullable: true
 *         bio:
 *           type: string
 *           nullable: true
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     LoginResponseData:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/AuthUser'
 *     GenericSuccessEnvelope:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Request completed successfully
 *         data:
 *           type: object
 *           additionalProperties: true
 *     UserBook:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         book_id:
 *           type: integer
 *         title:
 *           type: string
 *         author:
 *           type: string
 *         category:
 *           type: string
 *           nullable: true
 *         isbn:
 *           type: string
 *           nullable: true
 *         published_year:
 *           type: integer
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         cover_image_url:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [plan_to_read, reading, finished, abandoned]
 *         rating:
 *           type: integer
 *           nullable: true
 *         start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         finish_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ReadingSession:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         user_book_id:
 *           type: integer
 *         duration_seconds:
 *           type: integer
 *         pages_read:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *     Note:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         user_book_id:
 *           type: integer
 *         content:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Quote:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         user_book_id:
 *           type: integer
 *         content:
 *           type: string
 *           nullable: true
 *         page_number:
 *           type: integer
 *           nullable: true
 *         note:
 *           type: string
 *           nullable: true
 *         image_url:
 *           type: string
 *           nullable: true
 *         ocr_text:
 *           type: string
 *           nullable: true
 *         ocr_status:
 *           type: string
 *           enum: [manual, pending, processed, failed]
 *         ocr_confidence:
 *           type: number
 *           nullable: true
 *         ocr_processed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *           example:
 *             name: Alice
 *             email: alice@example.com
 *             password: secret123
 *             bio: Cozy reader
 *     responses:
 *       201:
 *         description: Sign up successfully
 *       400:
 *         description: Email already exists or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: alice@example.com
 *             password: secret123
 *     responses:
 *       200:
 *         description: Login successfully
 *       401:
 *         description: Invalid email or password
 *
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fetch profile successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *
 * /api/auth/me/update:
 *   post:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Update profile successfully
 *       400:
 *         description: Invalid input or invalid avatar upload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *
 * /api/achievements/user/{userId}:
 *   get:
 *     tags: [Achievements]
 *     summary: Get challenge overview and achievement progress for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Achievements loaded successfully
 *       400:
 *         description: Invalid user id or invalid year
 *       500:
 *         description: Unexpected server error
 *
 * /api/home/{userId}/dashboard:
 *   get:
 *     tags: [Home]
 *     summary: Get full home dashboard data for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dashboard loaded successfully
 *       400:
 *         description: Invalid user id
 *       500:
 *         description: Unexpected server error
 *
 * /api/home/{userId}/statistics:
 *   get:
 *     tags: [Home]
 *     summary: Get statistics-focused subset of the dashboard payload
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistics loaded successfully
 *       400:
 *         description: Invalid user id
 *       500:
 *         description: Unexpected server error
 *
 * /api/home/{userId}/goals/yearly:
 *   post:
 *     tags: [Home]
 *     summary: Create or update the yearly books goal
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target_value]
 *             properties:
 *               target_value:
 *                 type: integer
 *               year:
 *                 type: integer
 *           example:
 *             target_value: 12
 *             year: 2026
 *     responses:
 *       200:
 *         description: Yearly goal updated successfully
 *       400:
 *         description: Invalid user id or invalid goal value
 *
 * /api/books/search:
 *   get:
 *     tags: [Books]
 *     summary: Search Google Books and normalize the result set
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Books loaded successfully
 *       400:
 *         description: Search query is required
 *       429:
 *         description: Google Books API rate limit exceeded
 *       502:
 *         description: Upstream Google Books API error
 *
 * /api/quotes/user/{userId}:
 *   get:
 *     tags: [Quotes]
 *     summary: Get all quotes for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quotes loaded successfully
 *       400:
 *         description: Invalid user id
 *
 * /api/quotes/book/{userBookId}:
 *   get:
 *     tags: [Quotes]
 *     summary: Get all quotes for a specific user book
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quotes loaded successfully
 *       400:
 *         description: Invalid user id or invalid user book id
 *
 * /api/quotes:
 *   post:
 *     tags: [Quotes]
 *     summary: Create a quote manually or from OCR with optional image upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [user_id, user_book_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               user_book_id:
 *                 type: integer
 *               content:
 *                 type: string
 *               note:
 *                 type: string
 *               page_number:
 *                 type: integer
 *               ocr_text:
 *                 type: string
 *               ocr_status:
 *                 type: string
 *                 enum: [manual, pending, processed, failed]
 *               ocr_confidence:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *           example:
 *             user_id: 5
 *             user_book_id: 9
 *             content: We are made of star-stuff.
 *             ocr_status: manual
 *     responses:
 *       201:
 *         description: Quote saved successfully
 *       400:
 *         description: Validation error, missing content/image, invalid OCR fields, or bad upload
 *
 * /api/notes/user/{userId}:
 *   get:
 *     tags: [Notes]
 *     summary: Get all notes for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notes loaded successfully
 *       400:
 *         description: Invalid user id
 *
 * /api/notes/book/{userBookId}:
 *   get:
 *     tags: [Notes]
 *     summary: Get all notes for a specific user book
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notes loaded successfully
 *       400:
 *         description: Invalid user id or invalid user book id
 *
 * /api/notes:
 *   post:
 *     tags: [Notes]
 *     summary: Create a note for a user book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, user_book_id, content]
 *             properties:
 *               user_id:
 *                 type: integer
 *               user_book_id:
 *                 type: integer
 *               content:
 *                 type: string
 *           example:
 *             user_id: 5
 *             user_book_id: 9
 *             content: Need to revisit chapter 3.
 *     responses:
 *       201:
 *         description: Note saved successfully
 *       400:
 *         description: Invalid user id, invalid user book id, empty note content, or missing book
 *
 * /api/notes/{noteId}:
 *   put:
 *     tags: [Notes]
 *     summary: Update a note by note id
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, content]
 *             properties:
 *               user_id:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Invalid input or note not found
 *   delete:
 *     tags: [Notes]
 *     summary: Delete a note by note id
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       400:
 *         description: Invalid input or note not found
 *
 * /api/user-books/manual:
 *   post:
 *     tags: [UserBooks]
 *     summary: Create a manual book in the user's personal library
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [user_id, title]
 *             properties:
 *               user_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               isbn:
 *                 type: string
 *               published_year:
 *                 type: integer
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [plan_to_read, reading, finished, abandoned]
 *               rating:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               finish_date:
 *                 type: string
 *                 format: date
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Validation error or invalid cover upload
 *
 * /api/user-books/{userId}:
 *   get:
 *     tags: [UserBooks]
 *     summary: Get the user's personal library
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Library loaded successfully
 *       400:
 *         description: Invalid user id
 *
 * /api/user-books/detail/{userBookId}:
 *   get:
 *     tags: [UserBooks]
 *     summary: Get detail of one personal library item
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book detail loaded successfully
 *       400:
 *         description: Invalid user id, invalid user book id, or book not found
 *
 * /api/user-books/manual/{userBookId}/update:
 *   post:
 *     tags: [UserBooks]
 *     summary: Update a manual book in the user's library
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [user_id, title]
 *             properties:
 *               user_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               isbn:
 *                 type: string
 *               published_year:
 *                 type: integer
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [plan_to_read, reading, finished, abandoned]
 *               rating:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               finish_date:
 *                 type: string
 *                 format: date
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       400:
 *         description: Validation error, not found, or invalid cover upload
 *
 * /api/user-books/{userBookId}/start-reading:
 *   post:
 *     tags: [UserBooks]
 *     summary: Change a personal library item to reading status
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reading started
 *       400:
 *         description: Invalid input or book not found
 *
 * /api/user-books/{userBookId}/reading-sessions:
 *   get:
 *     tags: [UserBooks]
 *     summary: Get reading sessions for one user book
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reading sessions loaded successfully
 *       400:
 *         description: Invalid input
 *   post:
 *     tags: [UserBooks]
 *     summary: Save a reading session for one user book
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               duration_seconds:
 *                 type: integer
 *               duration_minutes:
 *                 type: integer
 *               pages_read:
 *                 type: integer
 *           example:
 *             user_id: 5
 *             duration_seconds: 1500
 *             pages_read: 12
 *     responses:
 *       201:
 *         description: Reading session saved
 *       400:
 *         description: Invalid input or book not found
 *
 * /api/user-books/{userBookId}:
 *   delete:
 *     tags: [UserBooks]
 *     summary: Delete a book from the personal library
 *     parameters:
 *       - in: path
 *         name: userBookId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       400:
 *         description: Invalid input or book not found
 */

module.exports = {};
