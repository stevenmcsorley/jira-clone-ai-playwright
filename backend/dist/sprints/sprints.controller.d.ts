import { SprintsService } from './sprints.service';
import { SprintStatus } from './entities/sprint.entity';
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
interface StartSprintDto {
    startDate: Date;
    endDate: Date;
}
export declare class SprintsController {
    private readonly sprintsService;
    constructor(sprintsService: SprintsService);
    create(createSprintDto: CreateSprintDto): Promise<import("./entities/sprint.entity").Sprint>;
    findByProject(projectId: string): Promise<import("./entities/sprint.entity").Sprint[]>;
    getBacklog(projectId: string): Promise<import("../issues/entities/issue.entity").Issue[]>;
    findOne(id: string): Promise<import("./entities/sprint.entity").Sprint>;
    update(id: string, updateSprintDto: UpdateSprintDto): Promise<import("./entities/sprint.entity").Sprint>;
    startSprint(id: string, startSprintDto: StartSprintDto): Promise<import("./entities/sprint.entity").Sprint>;
    completeSprint(id: string): Promise<import("./entities/sprint.entity").Sprint>;
    addIssueToSprint(id: string, issueId: string): Promise<void>;
    removeIssueFromSprint(issueId: string): Promise<void>;
    remove(id: string): Promise<void>;
}
export {};
