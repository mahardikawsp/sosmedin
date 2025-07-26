'use client';

import { useState } from 'react';

interface QueueItem {
    id: string;
    contentId: string;
    contentType: 'post' | 'reply' | 'profile';
    content: string;
    userId: string;
    flagReason: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    moderationTags: string[];
    createdAt: string;
    status: 'pending' | 'reviewed' | 'escalated';
    automatedResult: {
        shouldFlag: boolean;
        suggestedAction: string;
        confidence: number;
        severity: 'low' | 'medium' | 'high';
        flagReason: string;
        moderationTags: string[];
        details: {
            toxicityScore: number;
            spamScore: number;
            profanityScore: number;
            threatScore: number;
            personalInfoScore: number;
        };
    };
}

interface ModerationQueueItemProps {
    item: QueueItem;
    onDecision: (queueId: string, decision: 'approve' | 'reject' | 'escalate', reason?: string) => Promise<void>;
    getSeverityColor: (severity: string) => string;
    getStatusColor: (status: string) => string;
}

export function ModerationQueueItem({
    item,
    onDecision,
    getSeverityColor,
    getStatusColor
}: ModerationQueueItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReasonInput, setShowReasonInput] = useState(false);
    const [reason, setReason] = useState('');

    const handleDecision = async (decision: 'approve' | 'reject' | 'escalate') => {
        if (decision === 'reject' && !reason.trim()) {
            setShowReasonInput(true);
            return;
        }

        setIsProcessing(true);
        try {
            await onDecision(item.id, decision, reason.trim() || undefined);
            setReason('');
            setShowReasonInput(false);
        } catch (error) {
            console.error('Error processing decision:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.7) return 'text-red-600 dark:text-red-400';
        if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                        {item.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.contentType}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Confidence: {Math.round(item.confidence * 100)}%
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <svg
                        className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Content Preview */}
            <div className="mb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Flagged Content:
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border-l-4 border-red-400">
                    <p className="text-gray-900 dark:text-white text-sm">
                        {item.content.length > 200 && !isExpanded
                            ? `${item.content.substring(0, 200)}...`
                            : item.content
                        }
                    </p>
                </div>
            </div>

            {/* Flag Reason */}
            <div className="mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason:
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    {item.flagReason}
                </span>
            </div>

            {/* Moderation Tags */}
            {item.moderationTags.length > 0 && (
                <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tags:
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {item.moderationTags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Automated Analysis Scores */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Analysis Scores
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Toxicity:</span>
                                    <span className={`text-sm font-medium ${getScoreColor(item.automatedResult.details.toxicityScore)}`}>
                                        {Math.round(item.automatedResult.details.toxicityScore * 100)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Spam:</span>
                                    <span className={`text-sm font-medium ${getScoreColor(item.automatedResult.details.spamScore)}`}>
                                        {Math.round(item.automatedResult.details.spamScore * 100)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Profanity:</span>
                                    <span className={`text-sm font-medium ${getScoreColor(item.automatedResult.details.profanityScore)}`}>
                                        {Math.round(item.automatedResult.details.profanityScore * 100)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Threat:</span>
                                    <span className={`text-sm font-medium ${getScoreColor(item.automatedResult.details.threatScore)}`}>
                                        {Math.round(item.automatedResult.details.threatScore * 100)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Personal Info:</span>
                                    <span className={`text-sm font-medium ${getScoreColor(item.automatedResult.details.personalInfoScore)}`}>
                                        {Math.round(item.automatedResult.details.personalInfoScore * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Metadata
                            </h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Content ID:</span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-mono">
                                        {item.contentId}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">User ID:</span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2 font-mono">
                                        {item.userId}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2">
                                        {formatDate(item.createdAt)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Suggested Action:</span>
                                    <span className="text-sm text-gray-900 dark:text-white ml-2">
                                        {item.automatedResult.suggestedAction}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reason Input */}
            {showReasonInput && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reason for rejection (required):
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain why this content is being rejected..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        rows={3}
                        maxLength={500}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {reason.length}/500 characters
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {item.status === 'pending' || item.status === 'escalated' ? (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                        {showReasonInput && (
                            <button
                                onClick={() => {
                                    setShowReasonInput(false);
                                    setReason('');
                                }}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            onClick={() => handleDecision('approve')}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isProcessing ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            Approve
                        </button>

                        <button
                            onClick={() => handleDecision('reject')}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isProcessing ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            Reject
                        </button>

                        <button
                            onClick={() => handleDecision('escalate')}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isProcessing ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            Escalate
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        This item has been reviewed
                    </div>
                </div>
            )}
        </div>
    );
}