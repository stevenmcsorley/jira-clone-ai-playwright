import { User } from '../../users/entities/user.entity';
import { EstimationSession } from './estimation-session.entity';
export declare enum ParticipantStatus {
    INVITED = "invited",
    JOINED = "joined",
    VOTING = "voting",
    VOTED = "voted",
    LEFT = "left"
}
export declare class EstimationParticipant {
    id: number;
    sessionId: number;
    session: EstimationSession;
    userId: number;
    user: User;
    status: ParticipantStatus;
    isOnline: boolean;
    lastSeenAt: Date;
    joinedAt: Date;
}
