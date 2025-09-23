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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokenStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_custom_1 = require("passport-custom");
const api_token_service_1 = require("../services/api-token.service");
let ApiTokenStrategy = class ApiTokenStrategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'api-token') {
    constructor(apiTokenService) {
        super(async (req, done) => {
            try {
                const authHeader = req.headers['authorization'];
                console.log('ApiTokenStrategy (verify): authHeader:', authHeader);
                if (!authHeader) {
                    console.log('ApiTokenStrategy (verify): Authorization header not found');
                    return done(new common_1.UnauthorizedException('Authorization header not found'), false);
                }
                const [type, token] = authHeader.split(' ');
                console.log('ApiTokenStrategy (verify): type:', type, 'token:', token);
                if (type !== 'Bearer' || !token) {
                    console.log('ApiTokenStrategy (verify): Invalid authorization header format');
                    return done(new common_1.UnauthorizedException('Invalid authorization header format'), false);
                }
                const apiToken = await this.apiTokenService.validateToken(token);
                console.log('ApiTokenStrategy (verify): apiToken:', apiToken);
                if (!apiToken || !apiToken.user) {
                    console.log('ApiTokenStrategy (verify): Invalid or expired API token or user not found');
                    return done(new common_1.UnauthorizedException('Invalid or expired API token'), false);
                }
                console.log('ApiTokenStrategy (verify): Token validated, user:', apiToken.user);
                done(null, apiToken.user);
            }
            catch (error) {
                console.error('ApiTokenStrategy (verify): Error during validation:', error);
                done(error, false);
            }
        });
        this.apiTokenService = apiTokenService;
    }
};
exports.ApiTokenStrategy = ApiTokenStrategy;
exports.ApiTokenStrategy = ApiTokenStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_token_service_1.ApiTokenService])
], ApiTokenStrategy);
//# sourceMappingURL=api-token.strategy.js.map