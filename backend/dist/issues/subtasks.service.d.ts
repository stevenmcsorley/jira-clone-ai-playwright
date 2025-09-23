import { Repository } from 'typeorm';
import { Subtask } from './entities/subtask.entity';
import { Issue } from './entities/issue.entity';
import { User } from '../users/entities/user.entity';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';
export declare class SubtasksService {
    private subtasksRepository;
    private issuesRepository;
    private usersRepository;
    constructor(subtasksRepository: Repository<Subtask>, issuesRepository: Repository<Issue>, usersRepository: Repository<User>);
    create(createSubtaskDto: CreateSubtaskDto): Promise<Subtask>;
    findByIssue(issueId: number): Promise<Subtask[]>;
    findOne(id: number): Promise<Subtask>;
    update(id: number, updateSubtaskDto: UpdateSubtaskDto): Promise<Subtask>;
    remove(id: number): Promise<void>;
    reorderSubtasks(issueId: number, subtaskIds: number[]): Promise<void>;
    getSubtaskProgress(issueId: number): Promise<{
        completed: number;
        total: number;
        percentage: number;
    }>;
}
