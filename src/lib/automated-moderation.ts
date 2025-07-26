import { moderateContent, ContentValidationResult } from './content-moderation';

export interface AutomatedModerationResult {
    shouldFlag: boolean;
    flagReason?: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number; // 0-1 scale
    details: {
        toxicityScore: number;
        spamScore: number;
        profanityScore: number;
        threatScore: number;
        personalInfoScore: number;
    };
    suggestedAction: 'approve' | 'review' | 'block';
    moderationTags: string[];
}

export interface ContentAnalysisOptions {
    enableToxicityDetection?: boolean;
    enableSpamDetection?: boolean;
    enableProfanityFilter?: boolean;
    enableThreatDetection?: boolean;
    enablePersonalInfoDetection?: boolean;
    flagThreshold?: number; // 0-1 scale, default 0.7
}

// Enhanced pattern matching for different types of harmful content
const TOXICITY_PATTERNS = [
    // Hate speech patterns
    /\b(hate|kill|die|murder|suicide)\s+(you|yourself|them|him|her)\b/gi,
    /\b(go\s+kill\s+yourself|kys)\b/gi,
    /\b(worthless|pathetic|loser|idiot|stupid)\s+(piece\s+of\s+shit|human|person)\b/gi,

    // Harassment patterns
    /\b(shut\s+up|fuck\s+off|get\s+lost)\b/gi,
    /\b(nobody\s+likes\s+you|everyone\s+hates\s+you)\b/gi,

    // Discriminatory language
    /\b(because\s+you\'re\s+(black|white|gay|trans|muslim|jewish|christian))\b/gi,
];

const THREAT_PATTERNS = [
    /\b(i\s+will\s+(kill|hurt|harm|destroy|beat))\b/gi,
    /\b(you\s+better\s+watch\s+out|i\s+know\s+where\s+you\s+live)\b/gi,
    /\b(i\'m\s+coming\s+for\s+you|you\'re\s+dead)\b/gi,
    /\b(bomb|explosion|attack|violence)\s+(threat|plan|going\s+to)\b/gi,
];

const PERSONAL_INFO_PATTERNS = [
    // Phone numbers
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Social Security Numbers (US format)
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Credit card patterns (basic)
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    // Addresses (basic pattern)
    /\b\d+\s+[A-Za-z\s]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/gi,
];

const SPAM_INDICATORS = [
    // Excessive promotional language
    /\b(buy\s+now|click\s+here|limited\s+time|act\s+fast|free\s+money)\b/gi,
    // Cryptocurrency/investment spam
    /\b(bitcoin|crypto|investment|trading|profit|earn\s+money|make\s+money\s+fast)\b/gi,
    // Repeated contact info
    /\b(call\s+now|contact\s+me|dm\s+me|message\s+me)\b/gi,
];

/**
 * Analyzes content using automated moderation rules
 */
export async function analyzeContent(
    content: string,
    options: ContentAnalysisOptions = {}
): Promise<AutomatedModerationResult> {
    const {
        enableToxicityDetection = true,
        enableSpamDetection = true,
        enableProfanityFilter = true,
        enableThreatDetection = true,
        enablePersonalInfoDetection = true,
        flagThreshold = 0.7,
    } = options;

    // Initialize scores
    let toxicityScore = 0;
    let spamScore = 0;
    let profanityScore = 0;
    let threatScore = 0;
    let personalInfoScore = 0;

    const moderationTags: string[] = [];
    const contentLower = content.toLowerCase();

    // Basic content validation first
    const basicValidation = moderateContent(content);
    if (!basicValidation.isValid) {
        profanityScore = 0.3; // Basic profanity detected
    }

    // Toxicity detection
    if (enableToxicityDetection) {
        toxicityScore = calculateToxicityScore(content);
        if (toxicityScore > 0.3) {
            moderationTags.push('toxic_language');
        }
    }

    // Spam detection
    if (enableSpamDetection) {
        spamScore = calculateSpamScore(content);
        if (spamScore > 0.4) {
            moderationTags.push('potential_spam');
        }
    }

    // Enhanced profanity detection
    if (enableProfanityFilter) {
        profanityScore = Math.max(profanityScore, calculateProfanityScore(content));
        if (profanityScore > 0.3) {
            moderationTags.push('profanity');
        }
    }

    // Threat detection
    if (enableThreatDetection) {
        threatScore = calculateThreatScore(content);
        if (threatScore > 0.2) {
            moderationTags.push('potential_threat');
        }
    }

    // Personal information detection
    if (enablePersonalInfoDetection) {
        personalInfoScore = calculatePersonalInfoScore(content);
        if (personalInfoScore > 0.3) {
            moderationTags.push('personal_info');
        }
    }

    // Calculate overall confidence and severity
    const maxScore = Math.max(toxicityScore, spamScore, profanityScore, threatScore, personalInfoScore);
    const averageScore = (toxicityScore + spamScore + profanityScore + threatScore + personalInfoScore) / 5;

    const confidence = Math.min(maxScore * 1.2, 1.0); // Boost confidence for high individual scores

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (maxScore > 0.7 || threatScore > 0.3) {
        severity = 'high';
    } else if (maxScore > 0.4 || averageScore > 0.3) {
        severity = 'medium';
    }

    // Determine if content should be flagged
    const shouldFlag = maxScore >= flagThreshold || threatScore > 0.2 || personalInfoScore > 0.5;

    // Determine suggested action
    let suggestedAction: 'approve' | 'review' | 'block' = 'approve';
    if (threatScore > 0.5 || maxScore > 0.8) {
        suggestedAction = 'block';
    } else if (shouldFlag) {
        suggestedAction = 'review';
    }

    // Generate flag reason
    let flagReason: string | undefined;
    if (shouldFlag) {
        const reasons: string[] = [];
        if (toxicityScore > flagThreshold) reasons.push('toxic language');
        if (spamScore > flagThreshold) reasons.push('spam content');
        if (profanityScore > flagThreshold) reasons.push('inappropriate language');
        if (threatScore > 0.2) reasons.push('potential threat');
        if (personalInfoScore > 0.5) reasons.push('personal information');

        flagReason = reasons.length > 0 ? `Flagged for: ${reasons.join(', ')}` : 'Content flagged by automated system';
    }

    return {
        shouldFlag,
        flagReason,
        severity,
        confidence,
        details: {
            toxicityScore,
            spamScore,
            profanityScore,
            threatScore,
            personalInfoScore,
        },
        suggestedAction,
        moderationTags,
    };
}

/**
 * Calculate toxicity score based on harmful language patterns
 */
function calculateToxicityScore(content: string): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Check for toxicity patterns
    TOXICITY_PATTERNS.forEach(pattern => {
        const matches = contentLower.match(pattern);
        if (matches) {
            score += matches.length * 0.3;
        }
    });

    // Check for excessive negative sentiment
    const negativeWords = ['hate', 'awful', 'terrible', 'disgusting', 'pathetic', 'worthless'];
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
    if (negativeCount > 2) {
        score += 0.2;
    }

    // Check for all caps (aggressive tone)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 20) {
        score += 0.1;
    }

    return Math.min(score, 1.0);
}

/**
 * Calculate spam score based on promotional and repetitive content
 */
function calculateSpamScore(content: string): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Check for spam indicators
    SPAM_INDICATORS.forEach(pattern => {
        const matches = contentLower.match(pattern);
        if (matches) {
            score += matches.length * 0.2;
        }
    });

    // Check for excessive repetition
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    if (repetitionRatio > 0.7 && words.length > 10) {
        score += 0.3;
    }

    // Check for excessive punctuation/symbols
    const symbolCount = (content.match(/[!@#$%^&*()_+=\[\]{}|;':",./<>?~`]/g) || []).length;
    const symbolRatio = symbolCount / content.length;
    if (symbolRatio > 0.3) {
        score += 0.2;
    }

    // Check for multiple URLs
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 2) {
        score += 0.3;
    }

    return Math.min(score, 1.0);
}

/**
 * Calculate enhanced profanity score
 */
function calculateProfanityScore(content: string): number {
    const basicResult = moderateContent(content);
    let score = 0;

    if (basicResult.warnings.some(w => w.includes('inappropriate language'))) {
        score += 0.3;
    }

    // Check for creative profanity (symbols replacing letters)
    const maskedProfanity = /\b[a-z]*[*@#$%][a-z]*\b/gi;
    const maskedMatches = content.match(maskedProfanity);
    if (maskedMatches && maskedMatches.length > 0) {
        score += 0.2;
    }

    return Math.min(score, 1.0);
}

/**
 * Calculate threat score based on threatening language
 */
function calculateThreatScore(content: string): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Check for threat patterns
    THREAT_PATTERNS.forEach(pattern => {
        const matches = contentLower.match(pattern);
        if (matches) {
            score += matches.length * 0.4; // Threats are serious
        }
    });

    // Check for violence-related words
    const violenceWords = ['kill', 'murder', 'hurt', 'harm', 'destroy', 'attack', 'violence'];
    const violenceCount = violenceWords.filter(word => contentLower.includes(word)).length;
    if (violenceCount > 1) {
        score += 0.3;
    }

    return Math.min(score, 1.0);
}

/**
 * Calculate personal information exposure score
 */
function calculatePersonalInfoScore(content: string): number {
    let score = 0;

    // Check for personal info patterns
    PERSONAL_INFO_PATTERNS.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            score += matches.length * 0.4; // Personal info is serious
        }
    });

    return Math.min(score, 1.0);
}

/**
 * Batch analyze multiple pieces of content
 */
export async function batchAnalyzeContent(
    contents: string[],
    options: ContentAnalysisOptions = {}
): Promise<AutomatedModerationResult[]> {
    const results = await Promise.all(
        contents.map(content => analyzeContent(content, options))
    );

    return results;
}

/**
 * Get moderation statistics for reporting
 */
export function getModerationStats(results: AutomatedModerationResult[]) {
    const total = results.length;
    const flagged = results.filter(r => r.shouldFlag).length;
    const blocked = results.filter(r => r.suggestedAction === 'block').length;
    const needsReview = results.filter(r => r.suggestedAction === 'review').length;

    const severityBreakdown = {
        low: results.filter(r => r.severity === 'low').length,
        medium: results.filter(r => r.severity === 'medium').length,
        high: results.filter(r => r.severity === 'high').length,
    };

    const tagFrequency = results.reduce((acc, result) => {
        result.moderationTags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    return {
        total,
        flagged,
        blocked,
        needsReview,
        flaggedPercentage: (flagged / total) * 100,
        severityBreakdown,
        tagFrequency,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / total,
    };
}