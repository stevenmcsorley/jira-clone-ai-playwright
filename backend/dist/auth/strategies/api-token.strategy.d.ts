import { Strategy } from 'passport-custom';
import { ApiTokenService } from '../services/api-token.service';
declare const ApiTokenStrategy_base: new () => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class ApiTokenStrategy extends ApiTokenStrategy_base {
    private apiTokenService;
    constructor(apiTokenService: ApiTokenService);
}
export {};
