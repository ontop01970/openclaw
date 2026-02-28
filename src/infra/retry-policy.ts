import { RateLimitError } from "@buape/carbon";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { formatErrorMessage } from "./errors.js";
import { type RetryConfig, resolveRetryConfig, retryAsync } from "./retry.js";

export type RetryRunner = <T>(fn: () => Promise<T>, label?: string) => Promise<T>;

export const GEMINI_RETRY_DEFAULTS = {
  attempts: 4,
  minDelayMs: 1000,
  maxDelayMs: 90_000,
  jitter: 0.15,
};

export const DISCORD_RETRY_DEFAULTS = {
  attempts: 3,
  minDelayMs: 500,
  maxDelayMs: 30_000,
  jitter: 0.1,
};

export const TELEGRAM_RETRY_DEFAULTS = {
  attempts: 3,
  minDelayMs: 400,
  maxDelayMs: 30_000,
  jitter: 0.1,
};

const TELEGRAM_RETRY_RE = /429|timeout|connect|reset|closed|unavailable|temporarily/i;
const log = createSubsystemLogger("retry-policy");

function getTelegramRetryAfterMs(err: unknown): number | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }
  const candidate =
    "parameters" in err && err.parameters && typeof err.parameters === "object"
      ? (err.parameters as { retry_after?: unknown }).retry_after
      : "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "parameters" in err.response
        ? (
            err.response as {
              parameters?: { retry_after?: unknown };
            }
          ).parameters?.retry_after
        : "error" in err && err.error && typeof err.error === "object" && "parameters" in err.error
          ? (err.error as { parameters?: { retry_after?: unknown } }).parameters?.retry_after
          : undefined;
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate * 1000 : undefined;
}

export function createDiscordRetryRunner(params: {
  retry?: RetryConfig;
  configRetry?: RetryConfig;
  verbose?: boolean;
}): RetryRunner {
  const retryConfig = resolveRetryConfig(DISCORD_RETRY_DEFAULTS, {
    ...params.configRetry,
    ...params.retry,
  });
  return <T>(fn: () => Promise<T>, label?: string) =>
    retryAsync(fn, {
      ...retryConfig,
      label,
      shouldRetry: (err) => err instanceof RateLimitError,
      retryAfterMs: (err) => (err instanceof RateLimitError ? err.retryAfter * 1000 : undefined),
      onRetry: params.verbose
        ? (info) => {
            const labelText = info.label ?? "request";
            const maxRetries = Math.max(1, info.maxAttempts - 1);
            log.warn(
              `discord ${labelText} rate limited, retry ${info.attempt}/${maxRetries} in ${info.delayMs}ms`,
            );
          }
        : undefined,
    });
}

const GEMINI_RETRY_RE = /429|resource.exhausted|quota|rate.limit|too many requests|overloaded/i;

/**
 * Parse retry delay from Gemini error responses.
 * Gemini returns `retryDelay` in the error details, e.g. "47s" or "1m30s".
 */
function getGeminiRetryAfterMs(err: unknown): number | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }
  const message = formatErrorMessage(err);
  // Match "retry in Xs" or "retryDelay": "Xs" patterns
  const retryInMatch = message.match(/retry in ([\d.]+)s/i);
  if (retryInMatch?.[1]) {
    const seconds = Number.parseFloat(retryInMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }
  // Check for retryDelay in nested error structure
  const details = (err as { error?: { details?: unknown[] } }).error?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (detail && typeof detail === "object" && "retryDelay" in detail) {
        const delay = (detail as { retryDelay?: string }).retryDelay;
        if (typeof delay === "string") {
          const match = delay.match(/(\d+)s/);
          if (match?.[1]) {
            return Number.parseInt(match[1], 10) * 1000;
          }
        }
      }
    }
  }
  return undefined;
}

export function isGeminiRetryableError(err: unknown): boolean {
  const message = formatErrorMessage(err);
  return GEMINI_RETRY_RE.test(message);
}

export function createGeminiRetryRunner(params: {
  retry?: RetryConfig;
  configRetry?: RetryConfig;
  verbose?: boolean;
}): RetryRunner {
  const retryConfig = resolveRetryConfig(GEMINI_RETRY_DEFAULTS, {
    ...params.configRetry,
    ...params.retry,
  });
  return <T>(fn: () => Promise<T>, label?: string) =>
    retryAsync(fn, {
      ...retryConfig,
      label,
      shouldRetry: isGeminiRetryableError,
      retryAfterMs: getGeminiRetryAfterMs,
      onRetry: params.verbose
        ? (info) => {
            const labelText = info.label ?? "request";
            const maxRetries = Math.max(1, info.maxAttempts - 1);
            console.warn(
              `gemini ${labelText} rate limited, retry ${info.attempt}/${maxRetries} in ${info.delayMs}ms`,
            );
          }
        : undefined,
    });
}

export function createTelegramRetryRunner(params: {
  retry?: RetryConfig;
  configRetry?: RetryConfig;
  verbose?: boolean;
  shouldRetry?: (err: unknown) => boolean;
}): RetryRunner {
  const retryConfig = resolveRetryConfig(TELEGRAM_RETRY_DEFAULTS, {
    ...params.configRetry,
    ...params.retry,
  });
  const shouldRetry = params.shouldRetry
    ? (err: unknown) => params.shouldRetry?.(err) || TELEGRAM_RETRY_RE.test(formatErrorMessage(err))
    : (err: unknown) => TELEGRAM_RETRY_RE.test(formatErrorMessage(err));

  return <T>(fn: () => Promise<T>, label?: string) =>
    retryAsync(fn, {
      ...retryConfig,
      label,
      shouldRetry,
      retryAfterMs: getTelegramRetryAfterMs,
      onRetry: params.verbose
        ? (info) => {
            const maxRetries = Math.max(1, info.maxAttempts - 1);
            log.warn(
              `telegram send retry ${info.attempt}/${maxRetries} for ${info.label ?? label ?? "request"} in ${info.delayMs}ms: ${formatErrorMessage(info.err)}`,
            );
          }
        : undefined,
    });
}
