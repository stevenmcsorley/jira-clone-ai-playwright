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
exports.Issue = exports.IssueType = exports.IssuePriority = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const project_entity_1 = require("../../projects/entities/project.entity");
const comment_entity_1 = require("./comment.entity");
const attachment_entity_1 = require("./attachment.entity");
const subtask_entity_1 = require("./subtask.entity");
const time_log_entity_1 = require("./time-log.entity");
const issue_status_enum_1 = require("../enums/issue-status.enum");
var IssuePriority;
(function (IssuePriority) {
    IssuePriority["LOW"] = "low";
    IssuePriority["MEDIUM"] = "medium";
    IssuePriority["HIGH"] = "high";
    IssuePriority["URGENT"] = "urgent";
})(IssuePriority || (exports.IssuePriority = IssuePriority = {}));
var IssueType;
(function (IssueType) {
    IssueType["STORY"] = "story";
    IssueType["TASK"] = "task";
    IssueType["BUG"] = "bug";
    IssueType["EPIC"] = "epic";
})(IssueType || (exports.IssueType = IssueType = {}));
let Issue = class Issue {
};
exports.Issue = Issue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Issue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Issue.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Issue.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: issue_status_enum_1.IssueStatus,
        default: issue_status_enum_1.IssueStatus.TODO,
    }),
    __metadata("design:type", String)
], Issue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IssuePriority,
        default: IssuePriority.MEDIUM,
    }),
    __metadata("design:type", String)
], Issue.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IssueType,
        default: IssueType.TASK,
    }),
    __metadata("design:type", String)
], Issue.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Issue.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, project => project.issues),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", project_entity_1.Project)
], Issue.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Issue.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.assignedIssues, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigneeId' }),
    __metadata("design:type", user_entity_1.User)
], Issue.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Issue.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.reportedIssues),
    (0, typeorm_1.JoinColumn)({ name: 'reporterId' }),
    __metadata("design:type", user_entity_1.User)
], Issue.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Issue.prototype, "estimate", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true, default: [] }),
    __metadata("design:type", Array)
], Issue.prototype, "labels", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Issue.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Issue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, comment => comment.issue),
    __metadata("design:type", Array)
], Issue.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attachment_entity_1.Attachment, attachment => attachment.issue),
    __metadata("design:type", Array)
], Issue.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subtask_entity_1.Subtask, subtask => subtask.issue),
    __metadata("design:type", Array)
], Issue.prototype, "subtasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => time_log_entity_1.TimeLog, timeLog => timeLog.issue),
    __metadata("design:type", Array)
], Issue.prototype, "timeLogs", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Issue.prototype, "updatedAt", void 0);
exports.Issue = Issue = __decorate([
    (0, typeorm_1.Entity)('issues')
], Issue);
//# sourceMappingURL=issue.entity.js.map