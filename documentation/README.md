# Backend API Documentation

This file is the source of truth for `API.md`. Update this file when endpoints change.

## Overview

- Base path: `/`
- Request/response format: JSON for most endpoints; file uploads use `multipart/form-data`.
- Authentication: JWT via `Authorization: Bearer <token>`, `?token=...`, or `token` cookie.
- Login: `GET /users/:user/authorize` accepts `Authorization: Basic <base64 user:password>`.
- Rate limits: global 250 requests per 5 minutes; account creation is 10 requests per 15 minutes.
- CORS: restricted to `http://localhost:8080`, `http://localhost:4000`, and `https://*.rossprogram.org` listed in `src/app.js`.

## Users and Auth

- `POST /users/:user` create or upsert a user and email a generated password.
- `GET /users/:user/authorize` authenticate with Basic auth and set a JWT cookie.
- `GET /users/:user` fetch a user (requires JWT and permissions).
- `PUT /users/:user` update a user (requires JWT and permissions).
- `PATCH /users/:user` same behavior as PUT.

Notes:
- `:user` can be `me`, a user id, or an email address.

## Applications

- `GET /users/:user/application/:year` get or create the applicant's application.
- `PUT /users/:user/application/:year` update an application; can mark submitted.
- `GET /applications/:year/` list applications for a year (evaluators only).
- `GET /applications/:year/:id` get a specific application by id (permissions apply).
- `GET /applications/:year/:id/attachments` list attachments for the application.
- `GET /applications/:year/:id/evaluations` list evaluations for the application.
- `GET /applications/:year/:id/recommendations` list recommendations for the application.
- `GET /applications/:year/:id/offer` get the offer for the application.

## Recommendations

- `POST /users/:user/application/:year/recommendations/:recommender` create a recommendation and email the recommender.
- `GET /users/:user/application/:year/recommendations` list recommendations for an application.
- `GET /recommendations/:id` download recommendation letter (binary; permissions apply).
- `GET /recommendations/:id/:password` fetch recommendation metadata for a recommender.
- `PUT /recommendations/:id/:password` upload a PDF letter (`file` field).

## Attachments

- `POST /users/:user/application/:year/attachments` upload an attachment (`file` field).
- `POST /users/:user/application/:year/attachments/:label` upload an attachment with a label.
- `GET /users/:user/application/:year/attachments` list attachments for an application.
- `GET /attachments/:id` download attachment data (binary; permissions apply).
- `DELETE /users/:user/application/:year/attachments/:id` delete an attachment (if application not submitted).

## Evaluations

- `GET /users/:user/application/:year/evaluations` list evaluations for an application.
- `PUT /users/:user/application/:year/evaluations` create/update the current evaluator's evaluation.
- `GET /evaluators` list evaluators (superusers only).
- `GET /evaluators/:user/evaluations` list evaluations by evaluator.
- `GET /evaluations/:id` fetch a specific evaluation.
- `DELETE /evaluations/:id` delete a specific evaluation.

## Offers

- `GET /users/:user/application/:year/offer` fetch the offer for an application.
- `PUT /users/:user/application/:year/offer` create/update an offer (superusers) or accept/submit details (applicant).
- `DELETE /offers/:id` delete an offer (superusers only).

## Payments and Stripe

- `POST /users/:user/payments/:amount` create a Stripe payment intent; returns `clientSecret`.
- `GET /users/:user/payments` list payments for a user.
- `GET /users/:user/payments/:id` fetch a specific payment.
- `POST /stripe` Stripe webhook endpoint; expects a valid Stripe signature header.

## Comparisons

- `POST /comparisons/problems/:problem/applications/:better/:worse` record a comparison between two applications (evaluators only).

## Video Uploads (S3 Multipart)

These endpoints create and manage an S3 multipart upload for applicant videos. The server stores upload metadata on the applicant's application.

- `POST /users/:user/application/:year/video/multipart/create` create a multipart upload. Body: `{ contentType? }`. Returns `{ uploadId, key }`.
- `POST /users/:user/application/:year/video/multipart/part-url` create a pre-signed UploadPart URL. Body: `{ uploadId, key, partNumber }`. Returns `{ url }`.
- `POST /users/:user/application/:year/video/multipart/complete` complete the multipart upload. Body: `{ uploadId, key, parts: [{ PartNumber, ETag }] }`.
- `POST /users/:user/application/:year/video/multipart/abort` abort the multipart upload. Body: `{ uploadId, key }`.
- `GET /users/:user/application/:year/video` return a pre-signed download URL for evaluators, superusers, or the applicant.

Required environment:
- `S3_VIDEO_BUCKET` (bucket name)
- `AWS_REGION` (AWS region for the bucket)

## Notes on Unwired Controllers

The repository contains additional controllers (e.g., `courses`, `learners`, `xapi`) that are not currently mounted in `src/routes.js`. These endpoints are not part of the running API unless they are added to the router.
