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
exports.SubtasksController = void 0;
const common_1 = require("@nestjs/common");
const subtasks_service_1 = require("./subtasks.service");
const subtask_dto_1 = require("./dto/subtask.dto");
let SubtasksController = class SubtasksController {
    constructor(subtasksService) {
        this.subtasksService = subtasksService;
    }
    create(createSubtaskDto) {
        return this.subtasksService.create(createSubtaskDto);
    }
    findByIssue(issueId) {
        return this.subtasksService.findByIssue(issueId);
    }
    getProgress(issueId) {
        return this.subtasksService.getSubtaskProgress(issueId);
    }
    findOne(id) {
        return this.subtasksService.findOne(id);
    }
    update(id, updateSubtaskDto) {
        return this.subtasksService.update(id, updateSubtaskDto);
    }
    reorderSubtasks(issueId, body) {
        return this.subtasksService.reorderSubtasks(issueId, body.subtaskIds);
    }
    remove(id) {
        return this.subtasksService.remove(id);
    }
};
exports.SubtasksController = SubtasksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [subtask_dto_1.CreateSubtaskDto]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('issue/:issueId'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "findByIssue", null);
__decorate([
    (0, common_1.Get)('issue/:issueId/progress'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, subtask_dto_1.UpdateSubtaskDto]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('issue/:issueId/reorder'),
    __param(0, (0, common_1.Param)('issueId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "reorderSubtasks", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SubtasksController.prototype, "remove", null);
exports.SubtasksController = SubtasksController = __decorate([
    (0, common_1.Controller)('api/subtasks'),
    __metadata("design:paramtypes", [subtasks_service_1.SubtasksService])
], SubtasksController);
//# sourceMappingURL=subtasks.controller.js.map