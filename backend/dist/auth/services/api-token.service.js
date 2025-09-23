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
exports.ApiTokenService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_token_entity_1 = require("../entities/api-token.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const crypto = require("crypto");
let ApiTokenService = class ApiTokenService {
    constructor(apiTokenRepository, userRepository) {
        this.apiTokenRepository = apiTokenRepository;
        this.userRepository = userRepository;
    }
    async createToken(createTokenDto) {
        const user = await this.userRepository.findOne({ where: { id: createTokenDto.userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingToken = await this.apiTokenRepository.findOne({
            where: { name: createTokenDto.name, userId: createTokenDto.userId }
        });
        if (existingToken) {
            throw new common_1.ConflictException('Token name already exists');
        }
        const rawToken = crypto.randomBytes(32).toString('hex');
        const apiToken = this.apiTokenRepository.create({
            ...createTokenDto,
            token: rawToken,
            user,
            scopes: createTokenDto.scopes || ['read', 'write']
        });
        const savedToken = await this.apiTokenRepository.save(apiToken);
        return {
            token: savedToken,
            rawToken
        };
    }
    async findAllByUser(userId) {
        return this.apiTokenRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id) {
        const token = await this.apiTokenRepository.findOne({ where: { id } });
        if (!token) {
            throw new common_1.NotFoundException('API token not found');
        }
        return token;
    }
    async updateToken(id, updateTokenDto) {
        const token = await this.findOne(id);
        Object.assign(token, updateTokenDto);
        return this.apiTokenRepository.save(token);
    }
    async revokeToken(id) {
        const token = await this.findOne(id);
        await this.apiTokenRepository.update(id, { isActive: false });
    }
    async deleteToken(id) {
        const token = await this.findOne(id);
        await this.apiTokenRepository.remove(token);
    }
    async validateToken(tokenValue) {
        return this.apiTokenRepository.findOne({
            where: {
                token: tokenValue,
                isActive: true
            },
            relations: ['user']
        });
    }
};
exports.ApiTokenService = ApiTokenService;
exports.ApiTokenService = ApiTokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_token_entity_1.ApiToken)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ApiTokenService);
//# sourceMappingURL=api-token.service.js.map