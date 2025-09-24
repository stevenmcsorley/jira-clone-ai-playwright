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
exports.Sprint = exports.SprintStatus = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../projects/entities/project.entity");
const issue_entity_1 = require("../../issues/entities/issue.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var SprintStatus;
(function (SprintStatus) {
    SprintStatus["FUTURE"] = "future";
    SprintStatus["ACTIVE"] = "active";
    SprintStatus["COMPLETED"] = "completed";
})(SprintStatus || (exports.SprintStatus = SprintStatus = {}));
let Sprint = class Sprint {
};
exports.Sprint = Sprint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Sprint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Sprint.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Sprint.prototype, "goal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SprintStatus,
        default: SprintStatus.FUTURE,
    }),
    __metadata("design:type", String)
], Sprint.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Sprint.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, project => project.sprints),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", project_entity_1.Project)
], Sprint.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Sprint.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Sprint.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Sprint.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => issue_entity_1.Issue, issue => issue.sprint),
    __metadata("design:type", Array)
], Sprint.prototype, "issues", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Sprint.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", user_entity_1.User)
], Sprint.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Sprint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Sprint.prototype, "updatedAt", void 0);
exports.Sprint = Sprint = __decorate([
    (0, typeorm_1.Entity)('sprints')
], Sprint);
//# sourceMappingURL=sprint.entity.js.map