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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimationController = void 0;
const common_1 = require("@nestjs/common");
const estimation_service_1 = require("./estimation.service");
let EstimationController = class EstimationController {
    constructor(estimationService) {
        this.estimationService = estimationService;
    }
    async createSession(createSessionDto) {
        return this.estimationService.createSession(createSessionDto);
    }
    async getSession(id) {
        return this.estimationService.getSession(id);
    }
    async getSessionsByProject(projectId) {
        if (!projectId) {
            throw new common_1.BadRequestException('projectId is required');
        }
        return this.estimationService.getSessionsByProject(projectId);
    }
    async addParticipant(sessionId, userId) {
        return this.estimationService.addParticipant(sessionId, userId);
    }
    async startSession(sessionId, facilitatorId) {
        return this.estimationService.startSession(sessionId, facilitatorId);
    }
    async startVoting(sessionId, facilitatorId) {
        return this.estimationService.startVoting(sessionId, facilitatorId);
    }
    async submitVote(sessionId, issueId, voterId, voteData) {
        return this.estimationService.submitVote(sessionId, issueId, voterId, voteData);
    }
    async revealVotes(sessionId, issueId, facilitatorId) {
        return this.estimationService.revealVotes(sessionId, issueId, facilitatorId);
    }
    async finalizeEstimate(sessionId, issueId, facilitatorId, { finalEstimate }) {
        return this.estimationService.finalizeEstimate(sessionId, issueId, facilitatorId, finalEstimate);
    }
    async moveToNextIssue(sessionId, facilitatorId) {
        return this.estimationService.moveToNextIssue(sessionId, facilitatorId);
    }
    async startNewRound(sessionId, issueId, facilitatorId) {
        return this.estimationService.startNewRound(sessionId, issueId, facilitatorId);
    }
    getEstimationScales() {
        return this.estimationService.getEstimationScales();
    }
    async getVoteStatistics(sessionId, issueId, round = 1) {
        const sessionIssueId = parseInt(issueId.toString());
        return this.estimationService.getVoteStatistics(sessionIssueId, round);
    }
};
exports.EstimationController = EstimationController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "getSessionsByProject", null);
__decorate([
    (0, common_1.Post)('sessions/:id/participants'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "addParticipant", null);
__decorate([
    (0, common_1.Post)('sessions/:id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('facilitatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/start-voting'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('facilitatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "startVoting", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/issues/:issueId/vote'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Body)('voterId')),
    __param(3, (0, common_1.Body)('vote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "submitVote", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/issues/:issueId/reveal'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Body)('facilitatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "revealVotes", null);
__decorate([
    (0, common_1.Put)('sessions/:sessionId/issues/:issueId/finalize'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Body)('facilitatorId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "finalizeEstimate", null);
__decorate([
    (0, common_1.Post)('sessions/:id/next-issue'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('facilitatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "moveToNextIssue", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/issues/:issueId/new-round'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Body)('facilitatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "startNewRound", null);
__decorate([
    (0, common_1.Get)('scales'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EstimationController.prototype, "getEstimationScales", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/issues/:issueId/stats'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Query)('round')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EstimationController.prototype, "getVoteStatistics", null);
exports.EstimationController = EstimationController = __decorate([
    (0, common_1.Controller)('api/estimation'),
    __metadata("design:paramtypes", [estimation_service_1.EstimationService])
], EstimationController);
//# sourceMappingURL=estimation.controller.js.map