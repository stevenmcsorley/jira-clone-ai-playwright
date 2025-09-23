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
exports.OptionalApiTokenGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_token_entity_1 = require("../entities/api-token.entity");
let OptionalApiTokenGuard = class OptionalApiTokenGuard {
    constructor(apiTokenRepository) {
        this.apiTokenRepository = apiTokenRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return true;
        }
        if (!authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Invalid authorization header format');
        }
        const token = authHeader.substring(7);
        const apiToken = await this.apiTokenRepository.findOne({
            where: {
                token,
                isActive: true
            },
            relations: ['user']
        });
        if (!apiToken) {
            throw new common_1.UnauthorizedException('Invalid API token');
        }
        if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('API token expired');
        }
        await this.apiTokenRepository.update(apiToken.id, {
            lastUsedAt: new Date()
        });
        request.user = apiToken.user;
        request.apiToken = apiToken;
        return true;
    }
};
exports.OptionalApiTokenGuard = OptionalApiTokenGuard;
exports.OptionalApiTokenGuard = OptionalApiTokenGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_token_entity_1.ApiToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OptionalApiTokenGuard);
//# sourceMappingURL=optional-api-token.guard.js.map