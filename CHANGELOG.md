# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-08-10

### Added
- **Unified Library Endpoint (`/api/library/all`)**: Added a new endpoint to serve a user's liked songs, artists, albums, and playlists in a single optimized payload.
- **Dynamic Like Controller (`/api/library/like-entity`)**: Implemented an entity-agnostic endpoint that accepts an ID and Type, automatically queries `ytmusic-api` for the required metadata, and stores it in the correct Firestore array.
- **User Rooms Endpoint (`/api/library/my-rooms`)**: Added a query endpoint to fetch all rooms where the requesting user is the assigned admin.

### Changed
- **Language-Aware Home API (`/api/music/home`)**: Completely overhauled the `getHome` controller. It now runs parallel tailored searches (Songs, Albums, Playlists) based on a `lang` query param and maps the raw data strictly to a frontend-compatible Zod schema.

### Fixed
- **Firestore Undefined Crash**: Fixed a critical bug in `likeEntity` where missing fields from the YouTube Music API (like `.title` vs `.name`) resulted in `undefined` values, crashing Firestore `updateDoc` calls. Added strict fallbacks (`|| "Unknown"`).
- **Redis Middleware Error**: Resolved `TypeError: redisClient.get is not a function` by properly exposing the actual Redis client instance from within the custom wrapper class.
- **ESM Routing Fix**: Fixed Node.js initialization crash by switching CommonJS exports to ES Module `export default router;` inside the router configuration.