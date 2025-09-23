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
exports.TimeTrackingSummaryDto = exports.TimeLogResponseDto = exports.UpdateTimeLogDto = exports.CreateTimeLogDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTimeLogDto {
}
exports.CreateTimeLogDto = CreateTimeLogDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTimeLogDto.prototype, "hours", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimeLogDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeLogDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTimeLogDto.prototype, "issueId", void 0);
class UpdateTimeLogDto {
}
exports.UpdateTimeLogDto = UpdateTimeLogDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateTimeLogDto.prototype, "hours", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTimeLogDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTimeLogDto.prototype, "date", void 0);
class TimeLogResponseDto {
}
exports.TimeLogResponseDto = TimeLogResponseDto;
class TimeTrackingSummaryDto {
}
exports.TimeTrackingSummaryDto = TimeTrackingSummaryDto;
//# sourceMappingURL=time-log.dto.js.map