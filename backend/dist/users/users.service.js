"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const workspace_member_entity_1 = require("../workspaces/entities/workspace-member.entity");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(usersRepository, membersRepository) {
        this.usersRepository = usersRepository;
        this.membersRepository = membersRepository;
    }
    async create(createUserDto, workspaceId) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        const saved = await this.usersRepository.save(user);
        if (workspaceId) {
            await this.membersRepository.save(this.membersRepository.create({ workspaceId, userId: saved.id, role: 'member' }));
        }
        delete saved.password;
        return saved;
    }
    async findAll() {
        return this.usersRepository.find();
    }
    async findByWorkspace(workspaceId) {
        const memberships = await this.membersRepository.find({
            where: { workspaceId },
            relations: ['user'],
            order: { id: 'ASC' },
        });
        return memberships.map(m => m.user);
    }
    async findOne(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async update(id, updateData) {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        await this.usersRepository.update(id, updateData);
        return this.findOne(id);
    }
    async remove(id) {
        await this.usersRepository.delete(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(workspace_member_entity_1.WorkspaceMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map