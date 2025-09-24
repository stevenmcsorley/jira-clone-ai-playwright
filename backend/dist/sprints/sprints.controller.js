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
exports.SprintsController = void 0;
const common_1 = require("@nestjs/common");
const sprints_service_1 = require("./sprints.service");
let SprintsController = class SprintsController {
    constructor(sprintsService) {
        this.sprintsService = sprintsService;
    }
    create(createSprintDto) {
        return this.sprintsService.create(createSprintDto);
    }
    findByProject(projectId) {
        return this.sprintsService.findByProject(+projectId);
    }
    getBacklog(projectId) {
        return this.sprintsService.getBacklogIssues(+projectId);
    }
    findOne(id) {
        return this.sprintsService.findOne(+id);
    }
    update(id, updateSprintDto) {
        return this.sprintsService.update(+id, updateSprintDto);
    }
    startSprint(id, startSprintDto) {
        return this.sprintsService.startSprint(+id, startSprintDto.startDate, startSprintDto.endDate);
    }
    completeSprint(id) {
        return this.sprintsService.completeSprint(+id);
    }
    addIssueToSprint(id, issueId) {
        return this.sprintsService.addIssueToSprint(+id, +issueId);
    }
    removeIssueFromSprint(issueId) {
        return this.sprintsService.removeIssueFromSprint(+issueId);
    }
    remove(id) {
        return this.sprintsService.remove(+id);
    }
};
exports.SprintsController = SprintsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)('backlog'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "getBacklog", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "startSprint", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "completeSprint", null);
__decorate([
    (0, common_1.Post)(':id/add-issue/:issueId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('issueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "addIssueToSprint", null);
__decorate([
    (0, common_1.Post)('remove-issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "removeIssueFromSprint", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "remove", null);
exports.SprintsController = SprintsController = __decorate([
    (0, common_1.Controller)('api/sprints'),
    __metadata("design:paramtypes", [sprints_service_1.SprintsService])
], SprintsController);
//# sourceMappingURL=sprints.controller.js.map