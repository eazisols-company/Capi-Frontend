interface RateLimitData {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const RATE_LIMIT_KEY = 'login_rate_limit';
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export class LoginRateLimit {
  private static getRateLimitData(): RateLimitData {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing rate limit data:', error);
    }
    
    return {
      attempts: 0,
      lastAttempt: 0,
      blockedUntil: null
    };
  }

  private static setRateLimitData(data: RateLimitData): void {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing rate limit data:', error);
    }
  }

  private static clearRateLimitData(): void {
    try {
      localStorage.removeItem(RATE_LIMIT_KEY);
    } catch (error) {
      console.error('Error clearing rate limit data:', error);
    }
  }

  /**
   * Check if the user is currently blocked from attempting login
   */
  static isBlocked(): boolean {
    const data = this.getRateLimitData();
    
    if (!data.blockedUntil) {
      return false;
    }

    const now = Date.now();
    if (now >= data.blockedUntil) {
      // Block period has expired, clear the data
      this.clearRateLimitData();
      return false;
    }

    return true;
  }

  /**
   * Get the remaining time until the block expires (in milliseconds)
   */
  static getRemainingBlockTime(): number {
    const data = this.getRateLimitData();
    
    if (!data.blockedUntil) {
      return 0;
    }

    const now = Date.now();
    const remaining = data.blockedUntil - now;
    return Math.max(0, remaining);
  }

  /**
   * Record a failed login attempt
   */
  static recordFailedAttempt(): void {
    const data = this.getRateLimitData();
    const now = Date.now();

    data.attempts += 1;
    data.lastAttempt = now;

    // If we've reached the max attempts, block the user
    if (data.attempts >= MAX_ATTEMPTS) {
      data.blockedUntil = now + BLOCK_DURATION;
    }

    this.setRateLimitData(data);
  }

  /**
   * Record a successful login attempt (clears the rate limit data)
   */
  static recordSuccessfulAttempt(): void {
    this.clearRateLimitData();
  }

  /**
   * Get the number of remaining attempts before being blocked
   */
  static getRemainingAttempts(): number {
    const data = this.getRateLimitData();
    return Math.max(0, MAX_ATTEMPTS - data.attempts);
  }

  /**
   * Get the total number of failed attempts
   */
  static getFailedAttempts(): number {
    const data = this.getRateLimitData();
    return data.attempts;
  }

  /**
   * Format remaining block time as a human-readable string
   */
  static getFormattedRemainingTime(): string {
    const remaining = this.getRemainingBlockTime();
    
    if (remaining <= 0) {
      return '';
    }

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Reset the rate limit data (useful for testing or manual reset)
   */
  static reset(): void {
    this.clearRateLimitData();
  }
}
