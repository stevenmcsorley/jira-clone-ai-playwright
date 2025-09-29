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
exports.EstimationVote = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const session_issue_entity_1 = require("./session-issue.entity");
let EstimationVote = class EstimationVote {
};
exports.EstimationVote = EstimationVote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EstimationVote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EstimationVote.prototype, "sessionIssueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_issue_entity_1.SessionIssue, sessionIssue => sessionIssue.votes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionIssueId' }),
    __metadata("design:type", session_issue_entity_1.SessionIssue)
], EstimationVote.prototype, "sessionIssue", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EstimationVote.prototype, "voterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'voterId' }),
    __metadata("design:type", user_entity_1.User)
], EstimationVote.prototype, "voter", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], EstimationVote.prototype, "estimate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EstimationVote.prototype, "estimateText", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], EstimationVote.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], EstimationVote.prototype, "rationale", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EstimationVote.prototype, "isRevealed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EstimationVote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EstimationVote.prototype, "updatedAt", void 0);
exports.EstimationVote = EstimationVote = __decorate([
    (0, typeorm_1.Entity)('estimation_votes')
], EstimationVote);
//# sourceMappingURL=estimation-vote.entity.js.map