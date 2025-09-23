import { ApiTokenService } from '../services/api-token.service';
interface CreateTokenDto {
    name: string;
    description?: string;
    scopes?: string[];
    expiresAt?: string;
}
interface UpdateTokenDto {
    name?: string;
    description?: string;
    scopes?: string[];
    expiresAt?: string;
    isActive?: boolean;
}
export declare class ApiTokensController {
    private readonly apiTokenService;
    constructor(apiTokenService: ApiTokenService);
    createToken(createTokenDto: CreateTokenDto, userId?: number): Promise<{
        message: string;
        token: string;
        tokenInfo: {
            id: number;
            name: string;
            description: string;
            scopes: string[];
            expiresAt: Date;
            createdAt: Date;
        };
    }>;
    getTokensByUser(userId: number): Promise<{
        id: number;
        name: string;
        description: string;
        scopes: string[];
        isActive: boolean;
        expiresAt: Date;
        lastUsedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getToken(id: number): Promise<{
        id: number;
        name: string;
        description: string;
        scopes: string[];
        isActive: boolean;
        expiresAt: Date;
        lastUsedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        user: {
            id: number;
            name: string;
            email: string;
        };
    }>;
    updateToken(id: number, updateTokenDto: UpdateTokenDto): Promise<{
        id: number;
        name: string;
        description: string;
        scopes: string[];
        isActive: boolean;
        expiresAt: Date;
        updatedAt: Date;
    }>;
    revokeToken(id: number): Promise<void>;
    deleteToken(id: number): Promise<void>;
    validateToken(token: string): Promise<{
        valid: boolean;
        tokenInfo?: undefined;
    } | {
        valid: boolean;
        tokenInfo: {
            id: number;
            name: string;
            scopes: string[];
            user: {
                id: number;
                name: string;
                email: string;
            };
        };
    }>;
}
export {};
