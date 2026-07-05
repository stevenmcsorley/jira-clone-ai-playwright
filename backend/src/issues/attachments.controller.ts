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
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/attachments')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly workspaceScope: WorkspaceScopeService,
  ) {}

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
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)

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

    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.attachmentsService.create(createAttachmentDto, userId)
  }

  @Get('issue/:issueId')
  async findByIssue(@Param('issueId', ParseIntPipe) issueId: number, @Request() req) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.attachmentsService.findByIssue(issueId)
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const attachment = await this.attachmentsService.findOne(id)
    await this.workspaceScope.assertIssue(attachment.issueId, req.workspaceId)
    return attachment
  }

  @Get('download/:id')
  async downloadFile(@Param('id', ParseIntPipe) id: number, @Response() res: ExpressResponse, @Request() req) {
    const attachment = await this.attachmentsService.findOne(id)
    await this.workspaceScope.assertIssue(attachment.issueId, req.workspaceId)

    if (!existsSync(attachment.path)) {
      throw new NotFoundException('File not found on disk')
    }

    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`)

    const file = createReadStream(attachment.path)
    file.pipe(res)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const attachment = await this.attachmentsService.findOne(id)
    await this.workspaceScope.assertIssue(attachment.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.attachmentsService.remove(id, userId)
  }
}
