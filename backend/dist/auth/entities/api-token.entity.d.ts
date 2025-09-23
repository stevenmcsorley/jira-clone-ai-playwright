import { User } from '../../users/entities/user.entity';
export declare class ApiToken {
    id: number;
    token: string;
    name: string;
    description?: string;
    expiresAt?: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    scopes: string[];
    user: User;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}
