import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(createProjectDto: CreateProjectDto, req: any): Promise<import("./entities/project.entity").Project>;
    findAll(req: any): Promise<import("./entities/project.entity").Project[]>;
    findOne(id: string, req: any): Promise<import("./entities/project.entity").Project>;
    update(id: string, updateData: Partial<CreateProjectDto>, req: any): Promise<import("./entities/project.entity").Project>;
    remove(id: string, req: any): Promise<void>;
}
