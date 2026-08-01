import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';
import { Multer } from 'multer';

@Injectable()
export class StorageService {
  private b2: any;

  constructor(private prisma: PrismaService) {
    this.b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID as string,
      applicationKey: process.env.B2_APPLICATION_KEY as string,
    });
  }

  async uploadFile(userId: string, file: Express.Multer.File, folder: string) {
    try {
      // 1. Authorize with B2
      await this.b2.authorize();

      // 2. Get upload URL for the specific bucket
      const bucketId = process.env.B2_BUCKET_ID;
      const response = await this.b2.getUploadUrl({ bucketId });

      const uploadUrl = response.data.uploadUrl;
      const authToken = response.data.authorizationToken;

      // 3. Construct file path and upload
      const safeOriginalName = file.originalname.replace(/\s+/g, '_');
      const uniqueFileName = `${folder}/${uuidv4()}-${safeOriginalName}`;

      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrl,
        uploadAuthToken: authToken,
        fileName: uniqueFileName,
        data: file.buffer,
        mime: file.mimetype,
      });

      const b2FileName = uploadResponse.data.fileName;

      // 4. Save reference to PostgreSQL matching Prisma schema
      const savedFile = await this.prisma.file.create({
        data: {
          original_name: file.originalname,
          storageKey: process.env.B2_BUCKET_NAME || 'b2_default',
          fileKey: b2FileName,
          mime_type: file.mimetype,
          uploadedBy: userId,
        },
      });

      // Construct the public CDN URL to return to client apps
      const cdnUrl = `${process.env.B2_CDN_URL}/${b2FileName}`;

      return {
        file_id: savedFile.id,
        cdn_url: cdnUrl,
        mime_type: savedFile.mime_type,
        file_size_bytes: file.size,
      };
    } catch (error) {
      console.error('B2 Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload image to CDN');
    }
  }

  async getFileMetadata(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File metadata not found');
    }

    const cdnUrl = `${process.env.B2_CDN_URL}/${file.fileKey}`;

    return {
      file_id: file.id,
      cdn_url: cdnUrl,
      mime_type: file.mime_type,
    };
  }

  async getPrivateFileUrl(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      await this.b2.authorize();

      // Extract the raw filename by removing the CDN base URL
      const baseUrl = process.env.B2_CDN_URL as string;
      const b2FileName = file.fileKey.replace(`${baseUrl}/`, '');

      // Request a 1-hour authorization token from Backblaze
      const authResponse = await this.b2.getDownloadAuthorization({
        bucketId: process.env.B2_BUCKET_ID as string,
        fileNamePrefix: b2FileName,
        validDurationInSeconds: 3600, // Valid for 60 minutes
      });

      const downloadUrl = this.b2.downloadUrl;
      const token = authResponse.data.authorizationToken;
      const bucketName = process.env.B2_BUCKET_NAME as string;

      // Construct the authorized private URL
      const privateUrl = `${downloadUrl}/file/${bucketName}/${b2FileName}?Authorization=${token}`;

      return {
        file_id: file.id,
        private_url: privateUrl,
        expires_in: 3600,
      };
    } catch (error) {
      console.error('B2 Auth Error:', error);
      throw new InternalServerErrorException(
        'Failed to generate secure file URL',
      );
    }
  }

  async getMultiplePrivateFileUrls(fileIds: string[]) {
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileIds } },
    });

    if (!files || files.length === 0) {
      return [];
    }

    try {
      await this.b2.authorize();

      const baseUrl = process.env.B2_CDN_URL as string;
      const bucketName = process.env.B2_BUCKET_NAME as string;

      // Passing an empty string ("") as the prefix grants a single token
      // valid for EVERY file in the bucket for the next hour.
      const authResponse = await this.b2.getDownloadAuthorization({
        bucketId: process.env.B2_BUCKET_ID as string,
        fileNamePrefix: '',
        validDurationInSeconds: 3600,
      });

      const downloadUrl = this.b2.downloadUrl;
      const token = authResponse.data.authorizationToken;

      // Map the results using the single authorized token
      const results = files.map((file) => {
        const b2FileName = file.fileKey.replace(`${baseUrl}/`, '');
        const privateUrl = `${downloadUrl}/file/${bucketName}/${b2FileName}?Authorization=${token}`;

        return {
          file_id: file.id,
          private_url: privateUrl,
          expires_in: 3600,
        };
      });

      return results;
    } catch (error) {
      console.error('B2 Batch Auth Error:', error);
      throw new InternalServerErrorException(
        'Failed to generate secure batch file URLs',
      );
    }
  }
}
