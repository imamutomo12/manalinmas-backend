import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { GetMultipleFilesDto } from './dto/get-multiple-files.dto';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload Image to Backblaze B2 CDN' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          enum: ['attendance', 'incidents', 'patrols'],
        },
        reference_id: {
          type: 'string',
          nullable: true,
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG, and PNG files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is missing');
    }
    const data = await this.storageService.uploadFile(
      user.id,
      file,
      dto.folder,
    );
    return { success: true, message: 'Image uploaded', data };
  }

  @Get('files/:file_id')
  @ApiOperation({ summary: 'Get File Metadata' })
  async getFileMetadata(@Param('file_id') fileId: string) {
    const data = await this.storageService.getFileMetadata(fileId);
    return { success: true, message: 'File metadata loaded', data };
  }

  // ... existing code ...

  @Get('files/:file_id/view')
  @ApiOperation({ summary: 'Get Temporary Secure URL for Private Image' })
  async getPrivateFileView(@Param('file_id') fileId: string) {
    const data = await this.storageService.getPrivateFileUrl(fileId);
    return { success: true, message: 'Secure URL generated', data };
  }

  @Post('files/batch-view')
  @ApiOperation({
    summary: 'Get Temporary Secure URLs for Multiple Private Images',
  })
  async getMultiplePrivateFileViews(@Body() dto: GetMultipleFilesDto) {
    const data = await this.storageService.getMultiplePrivateFileUrls(
      dto.file_ids,
    );
    return { success: true, message: 'Secure batch URLs generated', data };
  }
}
