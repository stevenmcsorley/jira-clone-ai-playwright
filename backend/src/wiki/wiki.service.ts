import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WikiPage } from './entities/wiki-page.entity'
import { CreateWikiPageDto, UpdateWikiPageDto } from './dto/create-wiki-page.dto'

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200) || 'page'
  )
}

@Injectable()
export class WikiService {
  constructor(
    @InjectRepository(WikiPage) private readonly repo: Repository<WikiPage>,
  ) {}

  /** Page list for a project (newest edits first), without the full body. */
  findByProject(projectId: number): Promise<Partial<WikiPage>[]> {
    return this.repo.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'projectId', 'title', 'slug', 'authorId', 'createdAt', 'updatedAt'],
    })
  }

  async findOne(projectId: number, pageId: number): Promise<WikiPage> {
    const page = await this.repo.findOne({ where: { id: pageId, projectId } })
    if (!page) throw new NotFoundException('Wiki page not found')
    return page
  }

  async findBySlug(projectId: number, slug: string): Promise<WikiPage> {
    const page = await this.repo.findOne({ where: { slug, projectId } })
    if (!page) throw new NotFoundException('Wiki page not found')
    return page
  }

  async create(
    projectId: number,
    dto: CreateWikiPageDto,
    authorId: number | null,
  ): Promise<WikiPage> {
    const base = slugify(dto.slug || dto.title)
    const slug = await this.uniqueSlug(projectId, base)
    const page = this.repo.create({
      projectId,
      title: dto.title,
      slug,
      content: dto.content ?? '',
      authorId,
    })
    return this.repo.save(page)
  }

  async update(
    projectId: number,
    pageId: number,
    dto: UpdateWikiPageDto,
  ): Promise<WikiPage> {
    const page = await this.findOne(projectId, pageId)
    if (dto.title !== undefined) page.title = dto.title
    if (dto.content !== undefined) page.content = dto.content
    if (dto.slug !== undefined) {
      const base = slugify(dto.slug)
      page.slug = base === page.slug ? page.slug : await this.uniqueSlug(projectId, base)
    }
    return this.repo.save(page)
  }

  async remove(projectId: number, pageId: number): Promise<void> {
    const page = await this.findOne(projectId, pageId)
    await this.repo.remove(page)
  }

  private async uniqueSlug(projectId: number, base: string): Promise<string> {
    let slug = base
    let n = 1
    while (await this.repo.findOne({ where: { projectId, slug } })) {
      slug = `${base}-${n++}`
    }
    return slug
  }
}
