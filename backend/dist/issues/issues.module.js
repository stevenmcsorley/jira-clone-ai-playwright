"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const issue_entity_1 = require("./entities/issue.entity");
const comment_entity_1 = require("./entities/comment.entity");
const attachment_entity_1 = require("./entities/attachment.entity");
const subtask_entity_1 = require("./entities/subtask.entity");
const time_log_entity_1 = require("./entities/time-log.entity");
const issue_link_entity_1 = require("./entities/issue-link.entity");
const user_entity_1 = require("../users/entities/user.entity");
const issues_service_1 = require("./issues.service");
const issues_controller_1 = require("./issues.controller");
const comments_service_1 = require("./comments.service");
const comments_controller_1 = require("./comments.controller");
const attachments_service_1 = require("./attachments.service");
const attachments_controller_1 = require("./attachments.controller");
const subtasks_service_1 = require("./subtasks.service");
const subtasks_controller_1 = require("./subtasks.controller");
const time_tracking_service_1 = require("./time-tracking.service");
const time_tracking_controller_1 = require("./time-tracking.controller");
const issue_links_service_1 = require("./issue-links.service");
const issue_links_controller_1 = require("./issue-links.controller");
const public_subtasks_controller_1 = require("./controllers/public-subtasks.controller");
const events_module_1 = require("../events/events.module");
let IssuesModule = class IssuesModule {
};
exports.IssuesModule = IssuesModule;
exports.IssuesModule = IssuesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([issue_entity_1.Issue, comment_entity_1.Comment, attachment_entity_1.Attachment, subtask_entity_1.Subtask, time_log_entity_1.TimeLog, issue_link_entity_1.IssueLink, user_entity_1.User]), events_module_1.EventsModule],
        providers: [issues_service_1.IssuesService, comments_service_1.CommentsService, attachments_service_1.AttachmentsService, subtasks_service_1.SubtasksService, time_tracking_service_1.TimeTrackingService, issue_links_service_1.IssueLinksService],
        controllers: [
            issues_controller_1.IssuesController,
            comments_controller_1.CommentsController,
            attachments_controller_1.AttachmentsController,
            subtasks_controller_1.SubtasksController,
            time_tracking_controller_1.TimeTrackingController,
            issue_links_controller_1.IssueLinksController,
            public_subtasks_controller_1.PublicSubtasksController,
        ],
        exports: [issues_service_1.IssuesService, comments_service_1.CommentsService, attachments_service_1.AttachmentsService, subtasks_service_1.SubtasksService, time_tracking_service_1.TimeTrackingService, issue_links_service_1.IssueLinksService],
    })
], IssuesModule);
//# sourceMappingURL=issues.module.js.map