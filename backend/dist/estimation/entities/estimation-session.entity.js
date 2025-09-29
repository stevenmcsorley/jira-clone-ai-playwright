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
exports.EstimationSession = exports.SessionStatus = exports.EstimationScale = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const project_entity_1 = require("../../projects/entities/project.entity");
const sprint_entity_1 = require("../../sprints/entities/sprint.entity");
const estimation_participant_entity_1 = require("./estimation-participant.entity");
const session_issue_entity_1 = require("./session-issue.entity");
var EstimationScale;
(function (EstimationScale) {
    EstimationScale["FIBONACCI"] = "fibonacci";
    EstimationScale["TSHIRT"] = "tshirt";
    EstimationScale["HOURS"] = "hours";
    EstimationScale["DAYS"] = "days";
    EstimationScale["POWER_OF_2"] = "power_of_2";
    EstimationScale["LINEAR"] = "linear";
    EstimationScale["MODIFIED_FIBONACCI"] = "modified_fibonacci";
    EstimationScale["STORY_POINTS"] = "story_points";
})(EstimationScale || (exports.EstimationScale = EstimationScale = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["CREATED"] = "created";
    SessionStatus["WAITING"] = "waiting";
    SessionStatus["VOTING"] = "voting";
    SessionStatus["DISCUSSING"] = "discussing";
    SessionStatus["COMPLETED"] = "completed";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
let EstimationSession = class EstimationSession {
};
exports.EstimationSession = EstimationSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EstimationSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EstimationSession.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], EstimationSession.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SessionStatus,
        default: SessionStatus.CREATED,
    }),
    __metadata("design:type", String)
], EstimationSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EstimationScale,
        default: EstimationScale.FIBONACCI,
    }),
    __metadata("design:type", String)
], EstimationSession.prototype, "estimationScale", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EstimationSession.prototype, "anonymousVoting", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 120 }),
    __metadata("design:type", Number)
], EstimationSession.prototype, "discussionTimeLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], EstimationSession.prototype, "autoReveal", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EstimationSession.prototype, "currentIssueId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EstimationSession.prototype, "facilitatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'facilitatorId' }),
    __metadata("design:type", user_entity_1.User)
], EstimationSession.prototype, "facilitator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EstimationSession.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", project_entity_1.Project)
], EstimationSession.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EstimationSession.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sprint_entity_1.Sprint, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sprintId' }),
    __metadata("design:type", sprint_entity_1.Sprint)
], EstimationSession.prototype, "sprint", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => estimation_participant_entity_1.EstimationParticipant, participant => participant.session),
    __metadata("design:type", Array)
], EstimationSession.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_issue_entity_1.SessionIssue, sessionIssue => sessionIssue.session),
    __metadata("design:type", Array)
], EstimationSession.prototype, "sessionIssues", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EstimationSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EstimationSession.prototype, "updatedAt", void 0);
exports.EstimationSession = EstimationSession = __decorate([
    (0, typeorm_1.Entity)('estimation_sessions')
], EstimationSession);
//# sourceMappingURL=estimation-session.entity.js.map