import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApiToken } from '../entities/api-token.entity';
export declare class ApiTokenGuard implements CanActivate {
    private readonly apiTokenRepository;
    constructor(apiTokenRepository: Repository<ApiToken>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
