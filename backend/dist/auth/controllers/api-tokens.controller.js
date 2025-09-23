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
exports.ApiTokensController = void 0;
const common_1 = require("@nestjs/common");
const api_token_service_1 = require("../services/api-token.service");
let ApiTokensController = class ApiTokensController {
    constructor(apiTokenService) {
        this.apiTokenService = apiTokenService;
    }
    async createToken(createTokenDto, userId) {
        const targetUserId = userId || 1;
        const result = await this.apiTokenService.createToken({
            ...createTokenDto,
            userId: targetUserId,
            expiresAt: createTokenDto.expiresAt ? new Date(createTokenDto.expiresAt) : undefined
        });
        const { rawToken, token } = result;
        return {
            message: 'API token created successfully',
            token: rawToken,
            tokenInfo: {
                id: token.id,
                name: token.name,
                description: token.description,
                scopes: token.scopes,
                expiresAt: token.expiresAt,
                createdAt: token.createdAt
            }
        };
    }
    async getTokensByUser(userId) {
        const tokens = await this.apiTokenService.findAllByUser(userId);
        return tokens.map(token => ({
            id: token.id,
            name: token.name,
            description: token.description,
            scopes: token.scopes,
            isActive: token.isActive,
            expiresAt: token.expiresAt,
            lastUsedAt: token.lastUsedAt,
            createdAt: token.createdAt,
            updatedAt: token.updatedAt
        }));
    }
    async getToken(id) {
        const token = await this.apiTokenService.findOne(id);
        return {
            id: token.id,
            name: token.name,
            description: token.description,
            scopes: token.scopes,
            isActive: token.isActive,
            expiresAt: token.expiresAt,
            lastUsedAt: token.lastUsedAt,
            createdAt: token.createdAt,
            updatedAt: token.updatedAt,
            user: {
                id: token.user.id,
                name: token.user.name,
                email: token.user.email
            }
        };
    }
    async updateToken(id, updateTokenDto) {
        const updatedToken = await this.apiTokenService.updateToken(id, {
            ...updateTokenDto,
            expiresAt: updateTokenDto.expiresAt ? new Date(updateTokenDto.expiresAt) : undefined
        });
        return {
            id: updatedToken.id,
            name: updatedToken.name,
            description: updatedToken.description,
            scopes: updatedToken.scopes,
            isActive: updatedToken.isActive,
            expiresAt: updatedToken.expiresAt,
            updatedAt: updatedToken.updatedAt
        };
    }
    async revokeToken(id) {
        await this.apiTokenService.revokeToken(id);
    }
    async deleteToken(id) {
        await this.apiTokenService.deleteToken(id);
    }
    async validateToken(token) {
        const apiToken = await this.apiTokenService.validateToken(token);
        if (!apiToken) {
            return { valid: false };
        }
        return {
            valid: true,
            tokenInfo: {
                id: apiToken.id,
                name: apiToken.name,
                scopes: apiToken.scopes,
                user: {
                    id: apiToken.user.id,
                    name: apiToken.user.name,
                    email: apiToken.user.email
                }
            }
        };
    }
};
exports.ApiTokensController = ApiTokensController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "createToken", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "getTokensByUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "getToken", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "updateToken", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "revokeToken", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "deleteToken", null);
__decorate([
    (0, common_1.Get)('validate/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "validateToken", null);
exports.ApiTokensController = ApiTokensController = __decorate([
    (0, common_1.Controller)('api/tokens'),
    __metadata("design:paramtypes", [api_token_service_1.ApiTokenService])
], ApiTokensController);
//# sourceMappingURL=api-tokens.controller.js.map