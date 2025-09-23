import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';
export declare class SubtasksController {
    private readonly subtasksService;
    constructor(subtasksService: SubtasksService);
    create(createSubtaskDto: CreateSubtaskDto): Promise<import("./entities/subtask.entity").Subtask>;
    findByIssue(issueId: number): Promise<import("./entities/subtask.entity").Subtask[]>;
    getProgress(issueId: number): Promise<{
        completed: number;
        total: number;
        percentage: number;
    }>;
    findOne(id: number): Promise<import("./entities/subtask.entity").Subtask>;
    update(id: number, updateSubtaskDto: UpdateSubtaskDto): Promise<import("./entities/subtask.entity").Subtask>;
    reorderSubtasks(issueId: number, body: {
        subtaskIds: number[];
    }): Promise<void>;
    remove(id: number): Promise<void>;
}
