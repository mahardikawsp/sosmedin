export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export interface ErrorResponse {
    error: string;
    code?: string;
    details?: any;
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorData: ErrorResponse;

        try {
            errorData = await response.json();
        } catch {
            // If we can't parse the error response, create a generic one
            errorData = {
                error: `HTTP ${response.status}: ${response.statusText}`,
                code: response.status.toString()
            };
        }

        throw new APIError(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.code
        );
    }

    try {
        return await response.json();
    } catch (error) {
        throw new APIError('Invalid response format', 500, 'INVALID_RESPONSE');
    }
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof APIError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
}

export function getErrorCode(error: unknown): string | undefined {
    if (error instanceof APIError) {
        return error.code;
    }

    return undefined;
}

export function isNetworkError(error: unknown): boolean {
    if (error instanceof APIError) {
        return error.status >= 500 || error.code === 'NETWORK_ERROR';
    }

    if (error instanceof Error) {
        return error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('connection');
    }

    return false;
}

export function isAuthError(error: unknown): boolean {
    if (error instanceof APIError) {
        return error.status === 401 || error.status === 403;
    }

    return false;
}

export function isValidationError(error: unknown): boolean {
    if (error instanceof APIError) {
        return error.status === 400 || error.code === 'VALIDATION_ERROR';
    }

    return false;
}

export function isNotFoundError(error: unknown): boolean {
    if (error instanceof APIError) {
        return error.status === 404;
    }

    return false;
}

// Retry utility for network errors
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on client errors (4xx) except for 408 (timeout)
            if (error instanceof APIError &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 408) {
                throw error;
            }

            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
                throw error;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }

    throw lastError;
}

// Debounced error handler to prevent spam
export function createDebouncedErrorHandler(
    handler: (error: unknown) => void,
    delay: number = 1000
) {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastError: unknown = null;

    return (error: unknown) => {
        lastError = error;

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            handler(lastError);
            timeoutId = null;
        }, delay);
    };
}