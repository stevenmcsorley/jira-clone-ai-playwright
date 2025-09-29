"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const velocity_service_1 = require("./velocity.service");
const issue_entity_1 = require("../issues/entities/issue.entity");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const user_entity_1 = require("../users/entities/user.entity");
const time_log_entity_1 = require("../issues/entities/time-log.entity");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                issue_entity_1.Issue,
                sprint_entity_1.Sprint,
                project_entity_1.Project,
                user_entity_1.User,
                time_log_entity_1.TimeLog,
            ]),
        ],
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [analytics_service_1.AnalyticsService, velocity_service_1.VelocityService],
        exports: [analytics_service_1.AnalyticsService, velocity_service_1.VelocityService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map