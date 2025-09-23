import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Attachment } from './entities/attachment.entity'
import { Issue } from './entities/issue.entity'
import { User } from '../users/entities/user.entity'
import { CreateAttachmentDto } from './dto/attachment.dto'

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto, uploadedById: number): Promise<Attachment> {
    const issue = await this.issuesRepository.findOne({
      where: { id: createAttachmentDto.issueId }
    })
    if (!issue) {
      throw new NotFoundException('Issue not found')
    }

    const user = await this.usersRepository.findOne({
      where: { id: uploadedById }
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const attachment = this.attachmentsRepository.create({
      ...createAttachmentDto,
      uploadedById,
      issue,
      uploadedBy: user,
    })

    return this.attachmentsRepository.save(attachment)
  }

  async findByIssue(issueId: number): Promise<Attachment[]> {
    return this.attachmentsRepository.find({
      where: { issueId },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' }
    })
  }

  async findOne(id: number): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'issue']
    })

    if (!attachment) {
      throw new NotFoundException('Attachment not found')
    }

    return attachment
  }

  async remove(id: number, userId: number): Promise<void> {
    const attachment = await this.findOne(id)

    if (attachment.uploadedById !== userId) {
      throw new NotFoundException('You can only delete your own attachments')
    }

    await this.attachmentsRepository.remove(attachment)
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
    if (mimeType.includes('video')) return '🎬'
    if (mimeType.includes('audio')) return '🎵'
    return '📎'
  }
}