import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private usersRepository;
    private membersRepository;
    constructor(usersRepository: Repository<User>, membersRepository: Repository<WorkspaceMember>);
    create(createUserDto: CreateUserDto, workspaceId?: number): Promise<User>;
    findAll(): Promise<User[]>;
    findByWorkspace(workspaceId: number): Promise<User[]>;
    findOne(id: number): Promise<User>;
    findByEmail(email: string): Promise<User>;
    update(id: number, updateData: Partial<User>): Promise<User>;
    remove(id: number): Promise<void>;
}
