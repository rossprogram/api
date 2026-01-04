import crypto from 'crypto';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import applicationModel from '../models/application';

const { AWS_REGION, S3_VIDEO_BUCKET } = process.env;

const s3 = new S3Client({ region: AWS_REGION });

function getBucket() {
  if (!S3_VIDEO_BUCKET) {
    throw new Error('Missing S3_VIDEO_BUCKET');
  }
  return S3_VIDEO_BUCKET;
}

function requireAuth(req, res) {
  if (!req.jwt || !req.jwt.user) {
    res.status(401).send('Unauthenticated');
    return null;
  }
  return req.jwt.user;
}

function parseYear(req, res) {
  const year = Number(req.body.year);
  if (!Number.isInteger(year)) {
    res.status(400).send('Missing or invalid year');
    return null;
  }
  return year;
}

async function findApplicationForUser(userId, year) {
  const query = { user: userId, year };
  const setter = { $setOnInsert: query };
  return applicationModel.findOneAndUpdate(query, setter, { upsert: true, new: true });
}

function createObjectKey(userId) {
  const suffix = crypto.randomBytes(16).toString('hex');
  return `users/${userId}/recordings/${suffix}.webm`;
}

export async function createMultipartUpload(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const year = parseYear(req, res);
    if (!year) return;

    const application = await findApplicationForUser(user._id, year);
    if (application.submitted) {
      res.status(403).send('Not permitted to update an already submitted application. Withdraw your application first.');
      return;
    }

    const key = createObjectKey(user._id);
    const bucket = getBucket();
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: req.body.contentType || 'video/webm',
    });

    const response = await s3.send(command);

    application.video = {
      key,
      bucket,
      uploadId: response.UploadId,
      status: 'uploading',
      createdAt: new Date(),
    };

    await application.save();

    res.json({ uploadId: response.UploadId, key });
  } catch (err) {
    next(err);
  }
}

export async function getMultipartPartUrl(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const { uploadId, key, partNumber } = req.body || {};
    const part = Number(partNumber);
    if (!uploadId || !key || !Number.isInteger(part) || part <= 0) {
      res.status(400).send('Missing or invalid uploadId, key, or partNumber');
      return;
    }

    const application = await applicationModel.findOne({
      user: user._id,
      'video.key': key,
      'video.uploadId': uploadId,
    });

    if (!application) {
      res.status(404).send('Upload not found');
      return;
    }

    const bucket = getBucket();
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: part,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

export async function completeMultipartUpload(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const { uploadId, key, parts } = req.body || {};
    if (!uploadId || !key || !Array.isArray(parts) || parts.length === 0) {
      res.status(400).send('Missing or invalid uploadId, key, or parts');
      return;
    }

    const application = await applicationModel.findOne({
      user: user._id,
      'video.key': key,
      'video.uploadId': uploadId,
    });

    if (!application) {
      res.status(404).send('Upload not found');
      return;
    }

    const bucket = getBucket();
    const orderedParts = parts
      .filter((part) => part && Number.isInteger(part.PartNumber) && part.ETag)
      .sort((a, b) => a.PartNumber - b.PartNumber);
    if (orderedParts.length !== parts.length) {
      res.status(400).send('Each part must include PartNumber and ETag');
      return;
    }
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: orderedParts },
    });

    const response = await s3.send(command);

    application.video = {
      ...application.video,
      status: 'completed',
      completedAt: new Date(),
      etag: response.ETag,
    };

    await application.save();

    res.json({
      bucket,
      key,
      location: response.Location,
      etag: response.ETag,
    });
  } catch (err) {
    next(err);
  }
}

export async function abortMultipartUpload(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const { uploadId, key } = req.body || {};
    if (!uploadId || !key) {
      res.status(400).send('Missing uploadId or key');
      return;
    }

    const application = await applicationModel.findOne({
      user: user._id,
      'video.key': key,
      'video.uploadId': uploadId,
    });

    if (!application) {
      res.status(404).send('Upload not found');
      return;
    }

    const bucket = getBucket();
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });

    await s3.send(command);

    application.video = {
      ...application.video,
      status: 'aborted',
      abortedAt: new Date(),
    };

    await application.save();

    res.json({ aborted: true });
  } catch (err) {
    next(err);
  }
}

export async function getVideo(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (!req.application) {
      res.status(404).send('Application not found');
      return;
    }

    if (!req.application.video || !req.application.video.key) {
      res.status(404).send('Video not found');
      return;
    }

    if (req.application.video.status !== 'completed') {
      res.status(409).send('Video upload not complete');
      return;
    }

    const bucket = req.application.video.bucket || getBucket();
    const key = req.application.video.key;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ url, bucket, key, expiresIn: 3600 });
  } catch (err) {
    next(err);
  }
}
