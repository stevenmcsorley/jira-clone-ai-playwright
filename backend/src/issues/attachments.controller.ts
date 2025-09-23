import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Response,
  NotFoundException
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { AttachmentsService } from './attachments.service'
import { CreateAttachmentDto } from './dto/attachment.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Response as ExpressResponse } from 'express'
import { createReadStream, existsSync } from 'fs'

@Controller('api/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload/:issueId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
          const extension = extname(file.originalname)
          callback(null, `${uniqueSuffix}${extension}`)
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(
    @Param('issueId', ParseIntPipe) issueId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded')
    }

    const createAttachmentDto: CreateAttachmentDto = {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      issueId,
    }

    return this.attachmentsService.create(createAttachmentDto, req.user.id)
  }

  @Get('issue/:issueId')
  findByIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.attachmentsService.findByIssue(issueId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.findOne(id)
  }

  @Get('download/:id')
  async downloadFile(@Param('id', ParseIntPipe) id: number, @Response() res: ExpressResponse) {
    const attachment = await this.attachmentsService.findOne(id)

    if (!existsSync(attachment.path)) {
      throw new NotFoundException('File not found on disk')
    }

    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`)

    const file = createReadStream(attachment.path)
    file.pipe(res)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.attachmentsService.remove(id, req.user.id)
  }
}