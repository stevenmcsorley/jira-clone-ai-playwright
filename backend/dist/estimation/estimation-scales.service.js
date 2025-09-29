"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimationScalesService = void 0;
const common_1 = require("@nestjs/common");
const estimation_session_entity_1 = require("./entities/estimation-session.entity");
let EstimationScalesService = class EstimationScalesService {
    constructor() {
        this.scales = {
            [estimation_session_entity_1.EstimationScale.FIBONACCI]: {
                name: 'Fibonacci Sequence',
                description: 'Classic agile estimation using fibonacci numbers',
                type: 'numeric',
                unit: 'story points',
                options: [
                    { value: 0, label: '0', description: 'No effort required' },
                    { value: 0.5, label: '½', description: 'Minimal effort' },
                    { value: 1, label: '1', description: 'Very small effort' },
                    { value: 2, label: '2', description: 'Small effort' },
                    { value: 3, label: '3', description: 'Small-medium effort' },
                    { value: 5, label: '5', description: 'Medium effort' },
                    { value: 8, label: '8', description: 'Large effort' },
                    { value: 13, label: '13', description: 'Very large effort' },
                    { value: 21, label: '21', description: 'Extra large effort' },
                    { value: 34, label: '34', description: 'Massive effort - consider splitting' },
                    { value: '?', label: '?', description: 'Need more information' },
                    { value: '☕', label: '☕', description: 'Need a break' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.MODIFIED_FIBONACCI]: {
                name: 'Modified Fibonacci',
                description: 'Modified fibonacci with additional values for better granularity',
                type: 'numeric',
                unit: 'story points',
                options: [
                    { value: 0, label: '0', description: 'No effort' },
                    { value: 0.5, label: '½', description: 'Minimal effort' },
                    { value: 1, label: '1', description: 'Very small' },
                    { value: 2, label: '2', description: 'Small' },
                    { value: 3, label: '3', description: 'Small-medium' },
                    { value: 5, label: '5', description: 'Medium' },
                    { value: 8, label: '8', description: 'Large' },
                    { value: 13, label: '13', description: 'Very large' },
                    { value: 20, label: '20', description: 'Extra large' },
                    { value: 40, label: '40', description: 'XXL - should be split' },
                    { value: 100, label: '100', description: 'Massive - needs breakdown' },
                    { value: '?', label: '?', description: 'Unknown complexity' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.LINEAR]: {
                name: 'Linear Scale',
                description: 'Simple linear scale from 1 to 10',
                type: 'numeric',
                unit: 'points',
                options: [
                    { value: 1, label: '1', description: 'Trivial' },
                    { value: 2, label: '2', description: 'Very easy' },
                    { value: 3, label: '3', description: 'Easy' },
                    { value: 4, label: '4', description: 'Straightforward' },
                    { value: 5, label: '5', description: 'Medium' },
                    { value: 6, label: '6', description: 'Moderate complexity' },
                    { value: 7, label: '7', description: 'Complex' },
                    { value: 8, label: '8', description: 'Very complex' },
                    { value: 9, label: '9', description: 'Extremely complex' },
                    { value: 10, label: '10', description: 'Maximum complexity' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.POWER_OF_2]: {
                name: 'Powers of 2',
                description: 'Exponential scale using powers of 2',
                type: 'numeric',
                unit: 'story points',
                options: [
                    { value: 0, label: '0', description: 'No effort' },
                    { value: 1, label: '1', description: 'Minimal' },
                    { value: 2, label: '2', description: 'Small' },
                    { value: 4, label: '4', description: 'Medium' },
                    { value: 8, label: '8', description: 'Large' },
                    { value: 16, label: '16', description: 'Very large' },
                    { value: 32, label: '32', description: 'Extremely large' },
                    { value: '?', label: '?', description: 'Need more info' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.TSHIRT]: {
                name: 'T-Shirt Sizes',
                description: 'Relative sizing using familiar t-shirt sizes',
                type: 'categorical',
                options: [
                    { value: 'XS', label: 'XS', description: 'Extra Small - Quick fix' },
                    { value: 'S', label: 'S', description: 'Small - Minor feature' },
                    { value: 'M', label: 'M', description: 'Medium - Standard feature' },
                    { value: 'L', label: 'L', description: 'Large - Major feature' },
                    { value: 'XL', label: 'XL', description: 'Extra Large - Complex feature' },
                    { value: 'XXL', label: 'XXL', description: 'Huge - Consider breaking down' },
                    { value: '?', label: '?', description: 'Unknown size' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.HOURS]: {
                name: 'Time in Hours',
                description: 'Direct time estimation in hours',
                type: 'time',
                unit: 'hours',
                options: [
                    { value: 0.25, label: '15m', description: '15 minutes' },
                    { value: 0.5, label: '30m', description: '30 minutes' },
                    { value: 1, label: '1h', description: '1 hour' },
                    { value: 2, label: '2h', description: '2 hours' },
                    { value: 4, label: '4h', description: '4 hours' },
                    { value: 8, label: '1d', description: '1 day (8 hours)' },
                    { value: 16, label: '2d', description: '2 days' },
                    { value: 24, label: '3d', description: '3 days' },
                    { value: 40, label: '1w', description: '1 week (5 days)' },
                    { value: 80, label: '2w', description: '2 weeks' },
                    { value: '?', label: '?', description: 'Time unknown' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.DAYS]: {
                name: 'Time in Days',
                description: 'Direct time estimation in working days',
                type: 'time',
                unit: 'days',
                options: [
                    { value: 0.125, label: '1h', description: '1 hour' },
                    { value: 0.25, label: '2h', description: '2 hours' },
                    { value: 0.5, label: '½d', description: 'Half day' },
                    { value: 1, label: '1d', description: '1 day' },
                    { value: 2, label: '2d', description: '2 days' },
                    { value: 3, label: '3d', description: '3 days' },
                    { value: 5, label: '1w', description: '1 week' },
                    { value: 10, label: '2w', description: '2 weeks' },
                    { value: 15, label: '3w', description: '3 weeks' },
                    { value: 20, label: '1m', description: '1 month' },
                    { value: '?', label: '?', description: 'Duration unknown' },
                ],
            },
            [estimation_session_entity_1.EstimationScale.STORY_POINTS]: {
                name: 'Story Points',
                description: 'Abstract story points for relative sizing',
                type: 'numeric',
                unit: 'story points',
                options: [
                    { value: 0, label: '0', description: 'No development needed' },
                    { value: 1, label: '1', description: 'Trivial change' },
                    { value: 2, label: '2', description: 'Minor change' },
                    { value: 3, label: '3', description: 'Small story' },
                    { value: 5, label: '5', description: 'Medium story' },
                    { value: 8, label: '8', description: 'Large story' },
                    { value: 13, label: '13', description: 'Very large story' },
                    { value: 21, label: '21', description: 'Epic-sized - consider splitting' },
                    { value: '∞', label: '∞', description: 'Too large to estimate' },
                    { value: '?', label: '?', description: 'Need more information' },
                ],
            },
        };
    }
    getAllScales() {
        return this.scales;
    }
    getScale(scale) {
        return this.scales[scale] || null;
    }
    getScaleOptions(scale) {
        const scaleDefinition = this.getScale(scale);
        return scaleDefinition?.options || [];
    }
    isValidVote(scale, value) {
        const options = this.getScaleOptions(scale);
        return options.some(option => option.value === value);
    }
    getNumericValue(scale, value) {
        if (typeof value === 'number')
            return value;
        if (value === '?' || value === '☕' || value === '∞')
            return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }
    getDisplayLabel(scale, value) {
        const options = this.getScaleOptions(scale);
        const option = options.find(opt => opt.value === value);
        return option?.label || String(value);
    }
    getRecommendedScales() {
        return {
            beginner: [estimation_session_entity_1.EstimationScale.TSHIRT, estimation_session_entity_1.EstimationScale.LINEAR],
            experienced: [estimation_session_entity_1.EstimationScale.FIBONACCI, estimation_session_entity_1.EstimationScale.MODIFIED_FIBONACCI],
            timeBased: [estimation_session_entity_1.EstimationScale.HOURS, estimation_session_entity_1.EstimationScale.DAYS],
            abstract: [estimation_session_entity_1.EstimationScale.STORY_POINTS, estimation_session_entity_1.EstimationScale.POWER_OF_2],
        };
    }
};
exports.EstimationScalesService = EstimationScalesService;
exports.EstimationScalesService = EstimationScalesService = __decorate([
    (0, common_1.Injectable)()
], EstimationScalesService);
//# sourceMappingURL=estimation-scales.service.js.map