import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: any): Promise<User>;
    findAll(req: any): Promise<User[]>;
    findOne(id: string): Promise<User>;
    update(id: string, updateData: Partial<User>, req: any): Promise<User>;
    remove(id: string): Promise<void>;
}
