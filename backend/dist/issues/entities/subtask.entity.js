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
exports.Subtask = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const issue_entity_1 = require("./issue.entity");
const issue_status_enum_1 = require("../enums/issue-status.enum");
let Subtask = class Subtask {
};
exports.Subtask = Subtask;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subtask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subtask.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Subtask.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => issue_entity_1.Issue, issue => issue.subtasks),
    (0, typeorm_1.JoinColumn)({ name: 'issueId' }),
    __metadata("design:type", issue_entity_1.Issue)
], Subtask.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Subtask.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.assignedSubtasks, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigneeId' }),
    __metadata("design:type", user_entity_1.User)
], Subtask.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Subtask.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Subtask.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: issue_status_enum_1.IssueStatus,
        default: issue_status_enum_1.IssueStatus.TODO
    }),
    __metadata("design:type", String)
], Subtask.prototype, "status", void 0);
exports.Subtask = Subtask = __decorate([
    (0, typeorm_1.Entity)('subtasks')
], Subtask);
//# sourceMappingURL=subtask.entity.js.map