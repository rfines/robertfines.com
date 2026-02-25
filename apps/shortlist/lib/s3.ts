import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export async function createPresignedPutUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error(`S3 object not found: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function generateS3Key(userId: string, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  return `resumes/${userId}/${randomUUID()}.${ext}`;
}
