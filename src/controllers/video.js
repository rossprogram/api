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
const { S3_VIDEO_BUCKET } = process.env;
let s3Client;

// this seems necessary and I don't know why!
import { defaultProvider } from "@aws-sdk/credential-provider-node";

function getRegion() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error('Missing AWS region (set AWS_REGION or AWS_DEFAULT_REGION)');
  }
  return region;
}

function getS3Client() {
  if (!s3Client) {
    const credentials = defaultProvider();
    s3Client = new S3Client({ region: getRegion() });
  }

  return s3Client;
}

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

function requireApplicant(req, res, user) {
  if (!req.application) {
    res.status(404).send('Application not found');
    return false;
  }

  if (!req.application.user.equals(user._id)) {
    res.status(403).send('Only the applicant may manage the video upload');
    return false;
  }

  return true;
}

function createObjectKey(userId, applicationId) {
  const suffix = crypto.randomBytes(16).toString('hex');
  return `users/${userId}/applications/${applicationId}/recordings/${suffix}.webm`;
}

export async function createMultipartUpload(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (!requireApplicant(req, res, user)) return;

    if (req.application.submitted) {
      res.status(403).send('Not permitted to update an already submitted application. Withdraw your application first.');
      return;
    }

    const key = createObjectKey(user._id, req.application._id);
    const bucket = getBucket();
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: req.body.contentType || 'video/webm',
    });

    const response = await getS3Client().send(command);

    req.application.video = {
      key,
      bucket,
      uploadId: response.UploadId,
      status: 'uploading',
      createdAt: new Date(),
    };

    await req.application.save();

    res.json({ uploadId: response.UploadId, key });
  } catch (err) {
    next(err);
  }
}

export async function getMultipartPartUrl(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (!requireApplicant(req, res, user)) return;

    const { uploadId, key, partNumber } = req.body || {};
    const part = Number(partNumber);
    if (!uploadId || !key || !Number.isInteger(part) || part <= 0) {
      res.status(400).send('Missing or invalid uploadId, key, or partNumber');
      return;
    }

    if (!req.application || !req.application.video) {
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

    const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

export async function completeMultipartUpload(req, res, next) {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (!requireApplicant(req, res, user)) return;

    const { uploadId, key, parts } = req.body || {};
    if (!uploadId || !key || !Array.isArray(parts) || parts.length === 0) {
      res.status(400).send('Missing or invalid uploadId, key, or parts');
      return;
    }

    if (!req.application || !req.application.video) {
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

    const response = await getS3Client().send(command);

    req.application.video = {
      ...req.application.video,
      status: 'completed',
      completedAt: new Date(),
      etag: response.ETag,
    };

    await req.application.save();

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

    if (!requireApplicant(req, res, user)) return;

    const { uploadId, key } = req.body || {};
    if (!uploadId || !key) {
      res.status(400).send('Missing uploadId or key');
      return;
    }

    if (!req.application || !req.application.video) {
      res.status(404).send('Upload not found');
      return;
    }

    const bucket = getBucket();
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });

    await getS3Client().send(command);

    req.application.video = {
      ...req.application.video,
      status: 'aborted',
      abortedAt: new Date(),
    };

    await req.application.save();

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

    const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
    res.json({ url, bucket, key, expiresIn: 3600 });
  } catch (err) {
    next(err);
  }
}
