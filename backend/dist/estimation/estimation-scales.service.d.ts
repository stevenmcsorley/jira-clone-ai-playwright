import { EstimationScale } from './entities/estimation-session.entity';
export interface EstimationScaleOption {
    value: string | number;
    label: string;
    description?: string;
}
export interface EstimationScaleDefinition {
    name: string;
    description: string;
    options: EstimationScaleOption[];
    unit?: string;
    type: 'numeric' | 'categorical' | 'time';
}
export declare class EstimationScalesService {
    private readonly scales;
    getAllScales(): Record<EstimationScale, EstimationScaleDefinition>;
    getScale(scale: EstimationScale): EstimationScaleDefinition | null;
    getScaleOptions(scale: EstimationScale): EstimationScaleOption[];
    isValidVote(scale: EstimationScale, value: string | number): boolean;
    getNumericValue(scale: EstimationScale, value: string | number): number | null;
    getDisplayLabel(scale: EstimationScale, value: string | number): string;
    getRecommendedScales(): {
        beginner: EstimationScale[];
        experienced: EstimationScale[];
        timeBased: EstimationScale[];
        abstract: EstimationScale[];
    };
}
