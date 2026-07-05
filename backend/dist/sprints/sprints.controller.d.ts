import { SprintsService } from './sprints.service';
import { SprintStatus } from './entities/sprint.entity';
import { EventsGateway } from '../events/events.gateway';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
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
    private readonly eventsGateway;
    private readonly workspaceScope;
    constructor(sprintsService: SprintsService, eventsGateway: EventsGateway, workspaceScope: WorkspaceScopeService);
    private assertSprint;
    create(createSprintDto: CreateSprintDto, req: any): Promise<import("./entities/sprint.entity").Sprint>;
    findByProject(projectId: string, req: any): Promise<import("./entities/sprint.entity").Sprint[]>;
    getBacklog(projectId: string, req: any): Promise<import("../issues/entities/issue.entity").Issue[]>;
    findOne(id: string, req: any): Promise<import("./entities/sprint.entity").Sprint>;
    update(id: string, updateSprintDto: UpdateSprintDto, req: any): Promise<import("./entities/sprint.entity").Sprint>;
    startSprint(id: string, startSprintDto: StartSprintDto, req: any): Promise<import("./entities/sprint.entity").Sprint>;
    completeSprint(id: string, req: any): Promise<import("./entities/sprint.entity").Sprint>;
    addIssueToSprint(id: string, issueId: string, req: any): Promise<void>;
    removeIssueFromSprint(issueId: string, req: any): Promise<void>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
export {};
