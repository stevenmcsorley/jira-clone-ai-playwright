import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
export declare class SubtasksController {
    private readonly subtasksService;
    private readonly workspaceScope;
    constructor(subtasksService: SubtasksService, workspaceScope: WorkspaceScopeService);
    create(createSubtaskDto: CreateSubtaskDto, req: any): Promise<import("./entities/subtask.entity").Subtask>;
    findByIssue(issueId: number, req: any): Promise<import("./entities/subtask.entity").Subtask[]>;
    getProgress(issueId: number, req: any): Promise<{
        completed: number;
        total: number;
        percentage: number;
    }>;
    findOne(id: number, req: any): Promise<import("./entities/subtask.entity").Subtask>;
    update(id: number, updateSubtaskDto: UpdateSubtaskDto, req: any): Promise<import("./entities/subtask.entity").Subtask>;
    reorderSubtasks(issueId: number, body: {
        subtaskIds: number[];
    }, req: any): Promise<void>;
    remove(id: number, req: any): Promise<void>;
}
