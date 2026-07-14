export * from './device';
export * from './pin-config';
export * from './feature-config';
export * from './firmware';
export * from './scada';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
