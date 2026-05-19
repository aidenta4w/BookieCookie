# Bookie Cookie API Test Cases

Base URL:
`http://localhost:5000/api`

Swagger UI:
`http://localhost:5000/api-docs`

## Test Data Setup

- Create 1 fresh user for auth and profile APIs.
- Keep 1 existing `user_id` and 1 existing `user_book_id` for note, quote, reading, and library APIs.
- Keep 1 valid JWT from `/api/auth/login` for `/api/auth/me` and `/api/auth/me/update`.
- Keep 1 small image file under 5MB for avatar upload.
- Keep 1 small image file under 5MB for quote OCR upload.
- Keep 1 small image file under 5MB for manual book cover upload.

## Auth

### `POST /api/auth/signup`

Success case:
- Send valid `name`, `email`, `password`.
- Expect `201`, `success: true`, and returned user profile in `data`.

Edge cases:
- Reuse an existing email.
- Expect `400` with `message: "Email already exists"`.
- Omit `email` or `password`.
- Expect `400`.

### `POST /api/auth/login`

Success case:
- Send correct `email` and `password`.
- Expect `200`, `success: true`, and `data.token`.

Edge cases:
- Wrong password.
- Expect `401` with `message: "Invalid email or password"`.
- Unknown email.
- Expect `401`.

### `GET /api/auth/me`

Success case:
- Send `Authorization: Bearer <token>`.
- Expect `200` and current profile in `data`.

Edge cases:
- Missing token.
- Expect `401` with `message: "Unauthorized"`.
- Invalid or expired token.
- Expect `401`.

### `POST /api/auth/me/update`

Success case:
- Send multipart form with `name`, optional `bio`, optional `avatar`.
- Expect `200` and updated profile in `data`.

Edge cases:
- Omit `name`.
- Expect `400` with `message: "Name is required"`.
- Upload non-image avatar.
- Expect `400` with avatar upload error.
- Upload image larger than 5MB.
- Expect `400`.

## Achievements

### `GET /api/achievements/user/:userId`

Success case:
- Use a valid `userId`.
- Expect `200`, `data.overview`, `data.userAchievements`, and `data.achievements`.

Edge cases:
- Use `userId=0` or text.
- Expect `400`.
- Pass invalid `year` query such as `year=-1`.
- Expect `400`.

## Home

### `GET /api/home/:userId/dashboard`

Success case:
- Use valid `userId`.
- Expect `200` with `currentReading`, `streak`, `statistics`, `goals`, `finishedInYear`.

Edge cases:
- Use invalid `userId`.
- Expect `400` with `message: "Invalid user id"`.
- Pass valid `year` query and verify returned `data.year` matches.

### `GET /api/home/:userId/statistics`

Success case:
- Use valid `userId`.
- Expect `200` with statistics-focused payload.

Edge cases:
- Use invalid `userId`.
- Expect `400`.

### `POST /api/home/:userId/goals/yearly`

Success case:
- Send `{ "target_value": 12, "year": 2026 }`.
- Expect `200` and updated goal row in `data`.

Edge cases:
- Send `target_value: 0`.
- Expect `400`.
- Use invalid `userId`.
- Expect `400`.

## Books

### `GET /api/books/search`

Success case:
- Use `?query=harry potter`.
- Expect `200`, `data.totalItems`, and up to 10 normalized `items`.

Edge cases:
- Omit `query`.
- Expect `400` with `message: "Search query is required"`.
- If Google Books throttles the request.
- Expect `429`.

## User Books

### `POST /api/user-books/manual`

Success case:
- Send multipart form with `user_id`, `title`, optional `author`, `status`, `rating`, `start_date`, `finish_date`, optional `cover`.
- Expect `201`, `data.book`, and `data.user_book`.

Edge cases:
- Omit `title`.
- Expect `400` with `message: "Title is required"`.
- Use invalid `status`.
- Expect `400` with `message: "Invalid status"`.
- Use `rating=6`.
- Expect `400`.
- Set `finish_date` earlier than `start_date`.
- Expect `400`.
- Upload non-image cover.
- Expect `400`.

### `GET /api/user-books/:userId`

Success case:
- Use valid `userId`.
- Expect `200` with array of library items.

Edge cases:
- Use invalid `userId`.
- Expect `400`.

### `GET /api/user-books/detail/:userBookId?userId=...`

Success case:
- Use valid `userBookId` and matching `userId`.
- Expect `200` with full book detail.

Edge cases:
- Use invalid `userBookId`.
- Expect `400`.
- Use valid `userBookId` but wrong `userId`.
- Expect `400` with `message: "Book detail not found"`.

### `POST /api/user-books/manual/:userBookId/update`

Success case:
- Send multipart form with valid payload and optional new `cover`.
- Expect `200` and updated detail in `data`.

Edge cases:
- Use wrong `user_id`.
- Expect `400` with `message: "Book detail not found"`.
- Use invalid `rating`, `status`, or dates.
- Expect `400`.

### `POST /api/user-books/:userBookId/start-reading`

Success case:
- Send `{ "user_id": 5 }`.
- Expect `200` and returned book detail with `status: "reading"`.

Edge cases:
- Use invalid `user_id`.
- Expect `400`.
- Use mismatched `user_id`.
- Expect `400` with `message: "Book detail not found"`.

### `POST /api/user-books/:userBookId/reading-sessions`

Success case:
- Send `{ "user_id": 5, "duration_seconds": 1500, "pages_read": 10 }`.
- Expect `201` and saved reading session in `data`.

Compatibility case:
- Send `{ "user_id": 5, "duration_minutes": 25, "pages_read": 10 }`.
- Expect `201`.

Edge cases:
- Send `duration_seconds: 0`.
- Expect `400`.
- Send negative `pages_read`.
- Expect `400`.
- Use wrong `user_id`.
- Expect `400` with `message: "Book detail not found"`.

### `GET /api/user-books/:userBookId/reading-sessions?userId=...`

Success case:
- Use valid `userBookId` and `userId`.
- Expect `200` with reading sessions array.

Edge cases:
- Use invalid `userBookId`.
- Expect `400`.
- Use invalid `userId`.
- Expect `400`.

### `DELETE /api/user-books/:userBookId?userId=...`

Success case:
- Use valid `userBookId` and owner `userId`.
- Expect `200` with `message: "Book deleted successfully"`.

Edge cases:
- Delete same record twice.
- First call `200`, second call `400` with `message: "Book detail not found"`.
- Use wrong `userId`.
- Expect `400`.

## Quotes

### `POST /api/quotes`

Success case:
- Send multipart form with `user_id`, `user_book_id`, `content`.
- Expect `201` and saved quote in `data`.

OCR image case:
- Send multipart form with `user_id`, `user_book_id`, `ocr_text`, `ocr_status=processed`, `ocr_confidence`, optional `page_number`, optional `note`, and image file.
- Expect `201`.

Edge cases:
- Omit both `content` and image.
- Expect `400` with `message: "Quote content or image is required"`.
- Use invalid `ocr_status`.
- Expect `400`.
- Use `ocr_confidence > 100`.
- Expect `400`.
- Upload non-image file.
- Expect `400`.

### `GET /api/quotes/user/:userId`

Success case:
- Use valid `userId`.
- Expect `200` with quote array.

Edge cases:
- Use invalid `userId`.
- Expect `400`.

### `GET /api/quotes/book/:userBookId?userId=...`

Success case:
- Use valid `userBookId` and `userId`.
- Expect `200` with quote array for that book.

Edge cases:
- Use invalid `userBookId` or `userId`.
- Expect `400`.

## Notes

### `POST /api/notes`

Success case:
- Send `{ "user_id": 5, "user_book_id": 9, "content": "Great chapter." }`.
- Expect `201`.

Edge cases:
- Send blank `content`.
- Expect `400` with `message: "Note content is required"`.
- Use wrong `user_book_id` for that user.
- Expect `400` with `message: "Book detail not found"`.

### `GET /api/notes/user/:userId`

Success case:
- Use valid `userId`.
- Expect `200` with note array.

Edge cases:
- Use invalid `userId`.
- Expect `400`.

### `GET /api/notes/book/:userBookId?userId=...`

Success case:
- Use valid `userBookId` and `userId`.
- Expect `200` with note array.

Edge cases:
- Use invalid `userBookId` or invalid `userId`.
- Expect `400`.

### `PUT /api/notes/:noteId`

Success case:
- Send `{ "user_id": 5, "content": "Updated note" }`.
- Expect `200`.

Edge cases:
- Use invalid `noteId`.
- Expect `400`.
- Use blank `content`.
- Expect `400`.
- Use note not owned by user.
- Expect `400` with `message: "Note not found"`.

### `DELETE /api/notes/:noteId?userId=...`

Success case:
- Use valid `noteId` and owner `userId`.
- Expect `200`.

Edge cases:
- Use invalid `userId`.
- Expect `400`.
- Delete note not owned by user.
- Expect `400` with `message: "Note not found"`.

## Suggested Smoke Test Order

1. `POST /api/auth/signup`
2. `POST /api/auth/login`
3. `GET /api/auth/me`
4. `POST /api/user-books/manual`
5. `GET /api/user-books/:userId`
6. `GET /api/user-books/detail/:userBookId`
7. `POST /api/user-books/:userBookId/start-reading`
8. `POST /api/user-books/:userBookId/reading-sessions`
9. `POST /api/notes`
10. `POST /api/quotes`
11. `GET /api/home/:userId/dashboard`
12. `GET /api/achievements/user/:userId`
13. `DELETE /api/user-books/:userBookId`
