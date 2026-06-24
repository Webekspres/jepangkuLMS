export type CoreErrorBody = {
    error?: {
        code?: string;
        message?: string;
        details?: Record<string, unknown>;
        requestId?: string;
    };
};

export class CoreApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code?: string,
        readonly details?: Record<string, unknown>,
        readonly coreRequestId?: string,
    ) {
        super(message);
        this.name = 'CoreApiError';
    }

    static fromResponse(status: number, body: CoreErrorBody, fallbackMessage: string): CoreApiError {
        return new CoreApiError(
            body.error?.message ?? fallbackMessage,
            status,
            body.error?.code,
            body.error?.details,
            body.error?.requestId,
        );
    }
}
