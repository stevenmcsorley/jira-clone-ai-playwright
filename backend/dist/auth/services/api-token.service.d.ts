import { Repository } from 'typeorm';
import { ApiToken } from '../entities/api-token.entity';
import { User } from '../../users/entities/user.entity';
interface CreateApiTokenDto {
    name: string;
    description?: string;
    userId: number;
    scopes?: string[];
    expiresAt?: Date;
}
interface UpdateApiTokenDto {
    name?: string;
    description?: string;
    scopes?: string[];
    expiresAt?: Date;
    isActive?: boolean;
}
export declare class ApiTokenService {
    private readonly apiTokenRepository;
    private readonly userRepository;
    constructor(apiTokenRepository: Repository<ApiToken>, userRepository: Repository<User>);
    createToken(createTokenDto: CreateApiTokenDto): Promise<{
        token: ApiToken;
        rawToken: string;
    }>;
    findAllByUser(userId: number): Promise<ApiToken[]>;
    findOne(id: number): Promise<ApiToken>;
    updateToken(id: number, updateTokenDto: UpdateApiTokenDto): Promise<ApiToken>;
    revokeToken(id: number): Promise<void>;
    deleteToken(id: number): Promise<void>;
    validateToken(tokenValue: string): Promise<ApiToken | null>;
}
export {};
