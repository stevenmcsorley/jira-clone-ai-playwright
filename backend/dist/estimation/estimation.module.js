"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const estimation_controller_1 = require("./estimation.controller");
const estimation_service_1 = require("./estimation.service");
const estimation_scales_service_1 = require("./estimation-scales.service");
const estimation_session_entity_1 = require("./entities/estimation-session.entity");
const estimation_participant_entity_1 = require("./entities/estimation-participant.entity");
const session_issue_entity_1 = require("./entities/session-issue.entity");
const estimation_vote_entity_1 = require("./entities/estimation-vote.entity");
const issue_entity_1 = require("../issues/entities/issue.entity");
const user_entity_1 = require("../users/entities/user.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const sprint_entity_1 = require("../sprints/entities/sprint.entity");
let EstimationModule = class EstimationModule {
};
exports.EstimationModule = EstimationModule;
exports.EstimationModule = EstimationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                estimation_session_entity_1.EstimationSession,
                estimation_participant_entity_1.EstimationParticipant,
                session_issue_entity_1.SessionIssue,
                estimation_vote_entity_1.EstimationVote,
                issue_entity_1.Issue,
                user_entity_1.User,
                project_entity_1.Project,
                sprint_entity_1.Sprint,
            ]),
        ],
        controllers: [estimation_controller_1.EstimationController],
        providers: [estimation_service_1.EstimationService, estimation_scales_service_1.EstimationScalesService],
        exports: [estimation_service_1.EstimationService, estimation_scales_service_1.EstimationScalesService],
    })
], EstimationModule);
//# sourceMappingURL=estimation.module.js.map