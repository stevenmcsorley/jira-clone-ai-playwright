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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../projects/entities/project.entity");
const issue_entity_1 = require("../../issues/entities/issue.entity");
const comment_entity_1 = require("../../issues/entities/comment.entity");
const attachment_entity_1 = require("../../issues/entities/attachment.entity");
const subtask_entity_1 = require("../../issues/entities/subtask.entity");
const time_log_entity_1 = require("../../issues/entities/time-log.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => project_entity_1.Project, project => project.lead),
    __metadata("design:type", Array)
], User.prototype, "ledProjects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => issue_entity_1.Issue, issue => issue.assignee),
    __metadata("design:type", Array)
], User.prototype, "assignedIssues", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => issue_entity_1.Issue, issue => issue.reporter),
    __metadata("design:type", Array)
], User.prototype, "reportedIssues", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, comment => comment.author),
    __metadata("design:type", Array)
], User.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attachment_entity_1.Attachment, attachment => attachment.uploadedBy),
    __metadata("design:type", Array)
], User.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subtask_entity_1.Subtask, subtask => subtask.assignee),
    __metadata("design:type", Array)
], User.prototype, "assignedSubtasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => time_log_entity_1.TimeLog, timeLog => timeLog.user),
    __metadata("design:type", Array)
], User.prototype, "timeLogs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map