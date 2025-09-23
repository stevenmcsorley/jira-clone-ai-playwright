import { SubtasksService } from '../subtasks.service';
import { CreateSubtaskDto } from '../dto/subtask.dto';
export declare class PublicSubtasksController {
    private readonly subtasksService;
    constructor(subtasksService: SubtasksService);
    create(createSubtaskDto: CreateSubtaskDto): Promise<import("../entities/subtask.entity").Subtask>;
}
