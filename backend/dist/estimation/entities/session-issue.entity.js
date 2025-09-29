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
exports.SessionIssue = exports.IssueEstimationStatus = void 0;
const typeorm_1 = require("typeorm");
const issue_entity_1 = require("../../issues/entities/issue.entity");
const estimation_session_entity_1 = require("./estimation-session.entity");
const estimation_vote_entity_1 = require("./estimation-vote.entity");
var IssueEstimationStatus;
(function (IssueEstimationStatus) {
    IssueEstimationStatus["PENDING"] = "pending";
    IssueEstimationStatus["VOTING"] = "voting";
    IssueEstimationStatus["DISCUSSING"] = "discussing";
    IssueEstimationStatus["ESTIMATED"] = "estimated";
    IssueEstimationStatus["SKIPPED"] = "skipped";
})(IssueEstimationStatus || (exports.IssueEstimationStatus = IssueEstimationStatus = {}));
let SessionIssue = class SessionIssue {
};
exports.SessionIssue = SessionIssue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SessionIssue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SessionIssue.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => estimation_session_entity_1.EstimationSession, session => session.sessionIssues, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", estimation_session_entity_1.EstimationSession)
], SessionIssue.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SessionIssue.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => issue_entity_1.Issue),
    (0, typeorm_1.JoinColumn)({ name: 'issueId' }),
    __metadata("design:type", issue_entity_1.Issue)
], SessionIssue.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IssueEstimationStatus,
        default: IssueEstimationStatus.PENDING,
    }),
    __metadata("design:type", String)
], SessionIssue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SessionIssue.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SessionIssue.prototype, "finalEstimate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SessionIssue.prototype, "hasConsensus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SessionIssue.prototype, "votingRound", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], SessionIssue.prototype, "discussionNotes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => estimation_vote_entity_1.EstimationVote, vote => vote.sessionIssue),
    __metadata("design:type", Array)
], SessionIssue.prototype, "votes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SessionIssue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SessionIssue.prototype, "updatedAt", void 0);
exports.SessionIssue = SessionIssue = __decorate([
    (0, typeorm_1.Entity)('session_issues')
], SessionIssue);
//# sourceMappingURL=session-issue.entity.js.map