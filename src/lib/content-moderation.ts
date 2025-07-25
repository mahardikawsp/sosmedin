// Basic profanity filter - in production, you'd want a more comprehensive solution
const PROFANITY_WORDS = [
    'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'crap',
    'piss', 'slut', 'whore', 'fag', 'nigger', 'retard', 'gay', 'lesbian',
    // Add more words as needed - this is a basic list
];

// Spam patterns
const SPAM_PATTERNS = [
    /(.)\1{4,}/g, // Repeated characters (5 or more)
    /^[A-Z\s!]{20,}$/g, // All caps messages over 20 chars
    /(https?:\/\/[^\s]+){3,}/g, // Multiple URLs
    /(.{1,10})\1{3,}/g, // Repeated phrases
];

export interface ContentValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    filteredContent?: string;
}

export interface ContentModerationOptions {
    filterProfanity?: boolean;
    checkSpam?: boolean;
    maxLength?: number;
    minLength?: number;
    allowUrls?: boolean;
    maxUrls?: number;
}

/**
 * Validates and moderates content
 */
export function moderateContent(
    content: string,
    options: ContentModerationOptions = {}
): ContentValidationResult {
    const {
        filterProfanity = true,
        checkSpam = true,
        maxLength = 500,
        minLength = 1,
        allowUrls = true,
        maxUrls = 3,
    } = options;

    const result: ContentValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        filteredContent: content,
    };

    // Basic validation
    if (!content || typeof content !== 'string') {
        result.isValid = false;
        result.errors.push('Content is required');
        return result;
    }

    const trimmedContent = content.trim();

    // Length validation
    if (trimmedContent.length < minLength) {
        result.isValid = false;
        result.errors.push(`Content must be at least ${minLength} character(s)`);
    }

    if (trimmedContent.length > maxLength) {
        result.isValid = false;
        result.errors.push(`Content cannot exceed ${maxLength} characters`);
    }

    // URL validation
    if (!allowUrls) {
        const urlPattern = /https?:\/\/[^\s]+/g;
        if (urlPattern.test(trimmedContent)) {
            result.isValid = false;
            result.errors.push('URLs are not allowed');
        }
    } else if (maxUrls > 0) {
        const urls = trimmedContent.match(/https?:\/\/[^\s]+/g) || [];
        if (urls.length > maxUrls) {
            result.isValid = false;
            result.errors.push(`Maximum ${maxUrls} URL(s) allowed`);
        }
    }

    // Profanity filtering
    if (filterProfanity) {
        const profanityResult = filterProfanityContent(trimmedContent);
        if (profanityResult.hasProfanity) {
            result.warnings.push('Content contains potentially inappropriate language');
            result.filteredContent = profanityResult.filteredContent;
        }
    }

    // Spam detection
    if (checkSpam) {
        const spamResult = detectSpam(trimmedContent);
        if (spamResult.isSpam) {
            result.isValid = false;
            result.errors.push('Content appears to be spam');
        }
        if (spamResult.warnings.length > 0) {
            result.warnings.push(...spamResult.warnings);
        }
    }

    return result;
}

/**
 * Filters profanity from content
 */
export function filterProfanityContent(content: string): {
    hasProfanity: boolean;
    filteredContent: string;
    detectedWords: string[];
} {
    const detectedWords: string[] = [];
    let filteredContent = content;
    let hasProfanity = false;

    // Create regex patterns for each profanity word
    PROFANITY_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(content)) {
            hasProfanity = true;
            detectedWords.push(word);
            // Replace with asterisks, keeping first and last letter
            const replacement = word.length > 2
                ? word[0] + '*'.repeat(word.length - 2) + word[word.length - 1]
                : '*'.repeat(word.length);
            filteredContent = filteredContent.replace(regex, replacement);
        }
    });

    return {
        hasProfanity,
        filteredContent,
        detectedWords,
    };
}

/**
 * Detects spam patterns in content
 */
export function detectSpam(content: string): {
    isSpam: boolean;
    warnings: string[];
    detectedPatterns: string[];
} {
    const warnings: string[] = [];
    const detectedPatterns: string[] = [];
    let isSpam = false;

    // Check for spam patterns
    SPAM_PATTERNS.forEach((pattern, index) => {
        if (pattern.test(content)) {
            switch (index) {
                case 0:
                    warnings.push('Excessive repeated characters detected');
                    detectedPatterns.push('repeated_chars');
                    break;
                case 1:
                    warnings.push('Excessive use of capital letters detected');
                    detectedPatterns.push('all_caps');
                    break;
                case 2:
                    isSpam = true;
                    detectedPatterns.push('multiple_urls');
                    break;
                case 3:
                    warnings.push('Repeated phrases detected');
                    detectedPatterns.push('repeated_phrases');
                    break;
            }
        }
    });

    // Additional spam checks
    const wordCount = content.split(/\s+/).length;
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;

    // If less than 30% of words are unique, it might be spam
    if (wordCount > 10 && uniqueWords / wordCount < 0.3) {
        warnings.push('Low word diversity detected');
        detectedPatterns.push('low_diversity');
    }

    return {
        isSpam,
        warnings,
        detectedPatterns,
    };
}

/**
 * Validates content for specific contexts
 */
export function validatePostContent(content: string): ContentValidationResult {
    return moderateContent(content, {
        filterProfanity: true,
        checkSpam: true,
        maxLength: 500,
        minLength: 1,
        allowUrls: true,
        maxUrls: 3,
    });
}

export function validateReplyContent(content: string): ContentValidationResult {
    return moderateContent(content, {
        filterProfanity: true,
        checkSpam: true,
        maxLength: 500,
        minLength: 1,
        allowUrls: true,
        maxUrls: 2,
    });
}

/**
 * Sanitizes content for display
 */
export function sanitizeContent(content: string): string {
    // Basic HTML sanitization - remove potentially dangerous tags
    return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/<link\b[^>]*>/gi, '')
        .replace(/<meta\b[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}
