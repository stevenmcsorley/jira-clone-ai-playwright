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
exports.EstimationParticipant = exports.ParticipantStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const estimation_session_entity_1 = require("./estimation-session.entity");
var ParticipantStatus;
(function (ParticipantStatus) {
    ParticipantStatus["INVITED"] = "invited";
    ParticipantStatus["JOINED"] = "joined";
    ParticipantStatus["VOTING"] = "voting";
    ParticipantStatus["VOTED"] = "voted";
    ParticipantStatus["LEFT"] = "left";
})(ParticipantStatus || (exports.ParticipantStatus = ParticipantStatus = {}));
let EstimationParticipant = class EstimationParticipant {
};
exports.EstimationParticipant = EstimationParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EstimationParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EstimationParticipant.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => estimation_session_entity_1.EstimationSession, session => session.participants, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", estimation_session_entity_1.EstimationSession)
], EstimationParticipant.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EstimationParticipant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], EstimationParticipant.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ParticipantStatus,
        default: ParticipantStatus.INVITED,
    }),
    __metadata("design:type", String)
], EstimationParticipant.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EstimationParticipant.prototype, "isOnline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], EstimationParticipant.prototype, "lastSeenAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EstimationParticipant.prototype, "joinedAt", void 0);
exports.EstimationParticipant = EstimationParticipant = __decorate([
    (0, typeorm_1.Entity)('estimation_participants')
], EstimationParticipant);
//# sourceMappingURL=estimation-participant.entity.js.map