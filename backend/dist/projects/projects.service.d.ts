import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { Comment } from '../issues/entities/comment.entity';
import { Attachment } from '../issues/entities/attachment.entity';
import { TimeLog } from '../issues/entities/time-log.entity';
import { IssueLink } from '../issues/entities/issue-link.entity';
import { Subtask } from '../issues/entities/subtask.entity';
import { CreateProjectDto } from './dto/create-project.dto';
export declare class ProjectsService {
    private projectsRepository;
    private issuesRepository;
    private sprintsRepository;
    private commentsRepository;
    private attachmentsRepository;
    private timeLogsRepository;
    private issueLinksRepository;
    private subtasksRepository;
    constructor(projectsRepository: Repository<Project>, issuesRepository: Repository<Issue>, sprintsRepository: Repository<Sprint>, commentsRepository: Repository<Comment>, attachmentsRepository: Repository<Attachment>, timeLogsRepository: Repository<TimeLog>, issueLinksRepository: Repository<IssueLink>, subtasksRepository: Repository<Subtask>);
    create(createProjectDto: CreateProjectDto): Promise<Project>;
    findAll(): Promise<Project[]>;
    findOne(id: number): Promise<Project>;
    update(id: number, updateData: Partial<Project>): Promise<Project>;
    remove(id: number): Promise<void>;
}
