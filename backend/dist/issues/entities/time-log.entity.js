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
exports.TimeLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const issue_entity_1 = require("./issue.entity");
let TimeLog = class TimeLog {
};
exports.TimeLog = TimeLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TimeLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal'),
    __metadata("design:type", Number)
], TimeLog.prototype, "hours", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], TimeLog.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], TimeLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.timeLogs),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], TimeLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TimeLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => issue_entity_1.Issue, issue => issue.timeLogs),
    (0, typeorm_1.JoinColumn)({ name: 'issueId' }),
    __metadata("design:type", issue_entity_1.Issue)
], TimeLog.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TimeLog.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimeLog.prototype, "createdAt", void 0);
exports.TimeLog = TimeLog = __decorate([
    (0, typeorm_1.Entity)('time_logs')
], TimeLog);
//# sourceMappingURL=time-log.entity.js.map