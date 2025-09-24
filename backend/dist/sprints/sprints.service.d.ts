import { Repository } from 'typeorm';
import { Sprint, SprintStatus } from './entities/sprint.entity';
import { Issue } from '../issues/entities/issue.entity';
interface CreateSprintDto {
    name: string;
    goal?: string;
    projectId: number;
    createdById: number;
}
interface UpdateSprintDto {
    name?: string;
    goal?: string;
    status?: SprintStatus;
    startDate?: Date;
    endDate?: Date;
}
export declare class SprintsService {
    private sprintsRepository;
    private issuesRepository;
    constructor(sprintsRepository: Repository<Sprint>, issuesRepository: Repository<Issue>);
    create(createSprintDto: CreateSprintDto): Promise<Sprint>;
    findByProject(projectId: number): Promise<Sprint[]>;
    findOne(id: number): Promise<Sprint>;
    update(id: number, updateSprintDto: UpdateSprintDto): Promise<Sprint>;
    remove(id: number): Promise<void>;
    startSprint(id: number, startDate: Date, endDate: Date): Promise<Sprint>;
    completeSprint(id: number): Promise<Sprint>;
    addIssueToSprint(sprintId: number, issueId: number): Promise<void>;
    removeIssueFromSprint(issueId: number): Promise<void>;
    getBacklogIssues(projectId: number): Promise<Issue[]>;
}
export {};
