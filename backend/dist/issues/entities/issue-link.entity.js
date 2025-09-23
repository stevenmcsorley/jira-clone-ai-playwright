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
exports.IssueLink = exports.IssueLinkType = void 0;
const typeorm_1 = require("typeorm");
const issue_entity_1 = require("./issue.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var IssueLinkType;
(function (IssueLinkType) {
    IssueLinkType["BLOCKS"] = "blocks";
    IssueLinkType["BLOCKED_BY"] = "blocked_by";
    IssueLinkType["DUPLICATES"] = "duplicates";
    IssueLinkType["DUPLICATED_BY"] = "duplicated_by";
    IssueLinkType["RELATES_TO"] = "relates_to";
    IssueLinkType["CAUSES"] = "causes";
    IssueLinkType["CAUSED_BY"] = "caused_by";
    IssueLinkType["CLONES"] = "clones";
    IssueLinkType["CLONED_BY"] = "cloned_by";
    IssueLinkType["CHILD_OF"] = "child_of";
    IssueLinkType["PARENT_OF"] = "parent_of";
})(IssueLinkType || (exports.IssueLinkType = IssueLinkType = {}));
let IssueLink = class IssueLink {
};
exports.IssueLink = IssueLink;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], IssueLink.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], IssueLink.prototype, "sourceIssueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => issue_entity_1.Issue, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sourceIssueId' }),
    __metadata("design:type", issue_entity_1.Issue)
], IssueLink.prototype, "sourceIssue", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], IssueLink.prototype, "targetIssueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => issue_entity_1.Issue, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'targetIssueId' }),
    __metadata("design:type", issue_entity_1.Issue)
], IssueLink.prototype, "targetIssue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IssueLinkType,
    }),
    __metadata("design:type", String)
], IssueLink.prototype, "linkType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], IssueLink.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", user_entity_1.User)
], IssueLink.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IssueLink.prototype, "createdAt", void 0);
exports.IssueLink = IssueLink = __decorate([
    (0, typeorm_1.Entity)('issue_links')
], IssueLink);
//# sourceMappingURL=issue-link.entity.js.map