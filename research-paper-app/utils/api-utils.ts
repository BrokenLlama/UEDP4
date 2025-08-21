// API utility functions for better error handling and validation

export interface APIError extends Error {
  status?: number;
  code?: string;
  response?: {
    status: number;
    data?: any;
  };
}

export class APIValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'APIValidationError';
  }
}

export class APIRateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'APIRateLimitError';
  }
}

export class APIServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIServiceError';
  }
}

// Validation functions
export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new APIValidationError('Query is required and must be a string', 'query');
  }

  if (query.trim().length === 0) {
    throw new APIValidationError('Query cannot be empty', 'query');
  }

  if (query.length > 500) {
    throw new APIValidationError('Query is too long. Please use a shorter search term.', 'query');
  }

  // Check for potentially problematic characters
  const problematicPatterns = /[<>{}[\]\\]/;
  if (problematicPatterns.test(query)) {
    throw new APIValidationError('Query contains invalid characters', 'query');
  }
}

export function validateLimit(limit: any): number {
  if (limit === undefined || limit === null) {
    return 10; // Default limit
  }

  if (typeof limit !== 'number') {
    throw new APIValidationError('Limit must be a number', 'limit');
  }

  if (limit < 1) {
    throw new APIValidationError('Limit must be at least 1', 'limit');
  }

  if (limit > 25) {
    throw new APIValidationError('Limit cannot exceed 25', 'limit');
  }

  return Math.floor(limit); // Ensure it's an integer
}

export function validateYear(year: any): number | undefined {
  if (year === undefined || year === null) {
    return undefined;
  }

  const yearNum = parseInt(year.toString(), 10);
  if (isNaN(yearNum)) {
    throw new APIValidationError('Year must be a valid number', 'year');
  }

  const currentYear = new Date().getFullYear();
  if (yearNum < 1900 || yearNum > currentYear + 1) {
    throw new APIValidationError(`Year must be between 1900 and ${currentYear + 1}`, 'year');
  }

  return yearNum;
}

// Error classification functions
export function isRateLimitError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.response?.status === 429 ||
    error?.code === 'RATE_LIMIT_EXCEEDED' ||
    error?.message?.includes('rate limit') ||
    error?.message?.includes('429')
  );
}

export function isRetryableError(error: any): boolean {
  return (
    error?.response?.status === 500 ||
    error?.response?.status === 502 ||
    error?.response?.status === 503 ||
    error?.response?.status === 504 ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('network') ||
    error?.message?.includes('connection')
  );
}

export function isValidationError(error: any): boolean {
  return error instanceof APIValidationError;
}

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors or rate limit errors
      if (isValidationError(error) || isRateLimitError(error)) {
        throw error;
      }

      // Only retry on retryable errors
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, errorMessage);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Rate limiting utility
export class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval: number;

  constructor(minIntervalMs: number = 1000) {
    this.minInterval = minIntervalMs;
  }

  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const delay = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Response formatting utilities
export function formatAPIResponse<T>(data: T, cacheInfo?: any) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(cacheInfo && { cacheInfo })
  };
}

export function formatAPIError(error: any, defaultMessage: string = 'An error occurred') {
  const response: any = {
    success: false,
    error: defaultMessage,
    timestamp: new Date().toISOString()
  };

  if (error instanceof APIValidationError) {
    response.error = 'Validation error';
    response.message = error.message;
    response.field = error.field;
    response.status = 400;
  } else if (error instanceof APIRateLimitError) {
    response.error = 'Rate limit exceeded';
    response.message = error.message;
    response.retryAfter = error.retryAfter || 60;
    response.status = 429;
  } else if (error instanceof APIServiceError) {
    response.error = 'Service error';
    response.message = error.message;
    response.status = error.status || 503;
  } else if (isRateLimitError(error)) {
    response.error = 'Rate limit exceeded';
    response.message = 'The API is temporarily unavailable due to high request volume.';
    response.retryAfter = 60;
    response.status = 429;
  } else if (isRetryableError(error)) {
    response.error = 'Service temporarily unavailable';
    response.message = 'The service is experiencing technical difficulties. Please try again later.';
    response.status = 503;
  } else {
    response.message = error?.message || defaultMessage;
    response.status = 500;
  }

  return response;
}
