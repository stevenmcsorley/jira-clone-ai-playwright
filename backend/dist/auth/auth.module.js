"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const api_token_entity_1 = require("./entities/api-token.entity");
const api_token_service_1 = require("./services/api-token.service");
const api_tokens_controller_1 = require("./controllers/api-tokens.controller");
const api_token_guard_1 = require("./guards/api-token.guard");
const optional_api_token_guard_1 = require("./guards/optional-api-token.guard");
const user_entity_1 = require("../users/entities/user.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([api_token_entity_1.ApiToken, user_entity_1.User])],
        controllers: [api_tokens_controller_1.ApiTokensController],
        providers: [api_token_service_1.ApiTokenService, api_token_guard_1.ApiTokenGuard, optional_api_token_guard_1.OptionalApiTokenGuard],
        exports: [api_token_service_1.ApiTokenService, api_token_guard_1.ApiTokenGuard, optional_api_token_guard_1.OptionalApiTokenGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map