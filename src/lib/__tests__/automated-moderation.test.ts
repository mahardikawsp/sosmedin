import { analyzeContent, batchAnalyzeContent, getModerationStats } from '../automated-moderation';

describe('Automated Moderation', () => {
    describe('analyzeContent', () => {
        it('should approve clean content', async () => {
            const result = await analyzeContent('This is a nice post about my day!');

            expect(result.shouldFlag).toBe(false);
            expect(result.suggestedAction).toBe('approve');
            expect(result.severity).toBe('low');
            expect(result.moderationTags).toHaveLength(0);
        });

        it('should flag toxic content', async () => {
            const result = await analyzeContent('You are such a worthless piece of shit');

            expect(result.shouldFlag).toBe(true);
            expect(result.suggestedAction).toBe('review');
            expect(result.severity).toBe('medium');
            expect(result.moderationTags).toContain('toxic_language');
            expect(result.details.toxicityScore).toBeGreaterThan(0.3);
        });

        it('should flag threats with high severity', async () => {
            const result = await analyzeContent('I will kill you if you keep posting');

            expect(result.shouldFlag).toBe(true);
            expect(result.suggestedAction).toBe('block');
            expect(result.severity).toBe('high');
            expect(result.moderationTags).toContain('potential_threat');
            expect(result.details.threatScore).toBeGreaterThan(0.3);
        });

        it('should flag spam content', async () => {
            const result = await analyzeContent('BUY NOW!!! CLICK HERE FOR FREE MONEY!!! LIMITED TIME OFFER!!!');

            expect(result.shouldFlag).toBe(true);
            expect(result.moderationTags).toContain('potential_spam');
            expect(result.details.spamScore).toBeGreaterThan(0.4);
        });

        it('should flag personal information', async () => {
            const result = await analyzeContent('Call me at 555-123-4567 or email john@example.com');

            expect(result.shouldFlag).toBe(true);
            expect(result.moderationTags).toContain('personal_info');
            expect(result.details.personalInfoScore).toBeGreaterThan(0.3);
        });

        it('should handle profanity filtering', async () => {
            const result = await analyzeContent('This is fucking awesome!');

            expect(result.moderationTags).toContain('profanity');
            expect(result.details.profanityScore).toBeGreaterThan(0);
        });

        it('should detect repeated characters as spam', async () => {
            const result = await analyzeContent('Hellooooooo everyone!!!!!');

            expect(result.moderationTags).toContain('potential_spam');
            expect(result.details.spamScore).toBeGreaterThan(0);
        });

        it('should handle empty content', async () => {
            const result = await analyzeContent('');

            expect(result.shouldFlag).toBe(false);
            expect(result.suggestedAction).toBe('approve');
        });

        it('should respect custom thresholds', async () => {
            const result = await analyzeContent('This is mildly inappropriate', {
                flagThreshold: 0.1, // Very low threshold
            });

            // With a very low threshold, even mild content might be flagged
            expect(result.confidence).toBeDefined();
        });

        it('should disable specific detection types', async () => {
            const result = await analyzeContent('This fucking sucks', {
                enableProfanityFilter: false,
            });

            expect(result.moderationTags).not.toContain('profanity');
        });
    });

    describe('batchAnalyzeContent', () => {
        it('should analyze multiple pieces of content', async () => {
            const contents = [
                'This is a nice post',
                'You are stupid',
                'I will hurt you',
                'Buy now for free money!'
            ];

            const results = await batchAnalyzeContent(contents);

            expect(results).toHaveLength(4);
            expect(results[0].shouldFlag).toBe(false);
            expect(results[1].shouldFlag).toBe(true);
            expect(results[2].shouldFlag).toBe(true);
            expect(results[3].shouldFlag).toBe(true);
        });
    });

    describe('getModerationStats', () => {
        it('should calculate moderation statistics', async () => {
            const contents = [
                'This is a nice post',
                'You are stupid',
                'I will hurt you',
                'Buy now for free money!'
            ];

            const results = await batchAnalyzeContent(contents);
            const stats = getModerationStats(results);

            expect(stats.total).toBe(4);
            expect(stats.flagged).toBe(3);
            expect(stats.flaggedPercentage).toBe(75);
            expect(stats.severityBreakdown).toBeDefined();
            expect(stats.tagFrequency).toBeDefined();
            expect(stats.averageConfidence).toBeGreaterThan(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle very long content', async () => {
            const longContent = 'a'.repeat(1000);
            const result = await analyzeContent(longContent);

            expect(result).toBeDefined();
            expect(result.confidence).toBeDefined();
        });

        it('should handle special characters', async () => {
            const result = await analyzeContent('🔥💯✨ This is awesome! 🎉');

            expect(result.shouldFlag).toBe(false);
        });

        it('should handle mixed case content', async () => {
            const result = await analyzeContent('ThIs Is A wEiRd CaSe MeSSaGe');

            expect(result).toBeDefined();
        });

        it('should handle URLs in content', async () => {
            const result = await analyzeContent('Check out https://example.com and https://test.com and https://spam.com');

            expect(result.moderationTags).toContain('potential_spam');
        });
    });
});