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
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const api_token_entity_1 = require("./entities/api-token.entity");
const api_token_service_1 = require("./services/api-token.service");
const auth_service_1 = require("./services/auth.service");
const api_tokens_controller_1 = require("./controllers/api-tokens.controller");
const auth_controller_1 = require("./controllers/auth.controller");
const api_token_guard_1 = require("./guards/api-token.guard");
const optional_api_token_guard_1 = require("./guards/optional-api-token.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const global_auth_guard_1 = require("./guards/global-auth.guard");
const workspace_context_guard_1 = require("./guards/workspace-context.guard");
const admin_guard_1 = require("./guards/admin.guard");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const user_entity_1 = require("../users/entities/user.entity");
const workspace_entity_1 = require("../workspaces/entities/workspace.entity");
const workspace_member_entity_1 = require("../workspaces/entities/workspace-member.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([api_token_entity_1.ApiToken, user_entity_1.User, workspace_entity_1.Workspace, workspace_member_entity_1.WorkspaceMember]),
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
                signOptions: { expiresIn: '7d' },
            }),
        ],
        controllers: [api_tokens_controller_1.ApiTokensController, auth_controller_1.AuthController],
        providers: [
            api_token_service_1.ApiTokenService,
            auth_service_1.AuthService,
            api_token_guard_1.ApiTokenGuard,
            optional_api_token_guard_1.OptionalApiTokenGuard,
            jwt_auth_guard_1.JwtAuthGuard,
            admin_guard_1.AdminGuard,
            jwt_strategy_1.JwtStrategy,
            {
                provide: core_1.APP_GUARD,
                useClass: global_auth_guard_1.GlobalAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: workspace_context_guard_1.WorkspaceContextGuard,
            },
        ],
        exports: [api_token_service_1.ApiTokenService, api_token_guard_1.ApiTokenGuard, optional_api_token_guard_1.OptionalApiTokenGuard, jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard, auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map