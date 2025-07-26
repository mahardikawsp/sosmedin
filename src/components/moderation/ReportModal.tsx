'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'post' | 'user';
    targetId: string;
    targetContent?: string;
    targetUsername?: string;
}

type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
    {
        value: 'spam',
        label: 'Spam',
        description: 'Repetitive, unwanted, or promotional content'
    },
    {
        value: 'harassment',
        label: 'Harassment',
        description: 'Bullying, threats, or targeted harassment'
    },
    {
        value: 'inappropriate',
        label: 'Inappropriate Content',
        description: 'Content that violates community guidelines'
    },
    {
        value: 'other',
        label: 'Other',
        description: 'Other violations not listed above'
    }
];

export function ReportModal({
    isOpen,
    onClose,
    type,
    targetId,
    targetContent,
    targetUsername
}: ReportModalProps) {
    const { data: session } = useSession();
    const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.id) {
            setError('You must be logged in to report content');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    reason: selectedReason,
                    description: description.trim() || undefined,
                    ...(type === 'post' ? { reportedPostId: targetId } : { reportedUserId: targetId }),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to submit report');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setDescription('');
                setSelectedReason('spam');
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setError(null);
            setSuccess(false);
            setDescription('');
            setSelectedReason('spam');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Report {type === 'post' ? 'Post' : 'User'}
                        </h2>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Report Submitted
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Thank you for helping keep our community safe. We'll review your report.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Content preview */}
                            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Reporting {type}:
                                </p>
                                {type === 'post' && targetContent && (
                                    <p className="text-gray-900 dark:text-white text-sm">
                                        "{targetContent.length > 100 ? targetContent.substring(0, 100) + '...' : targetContent}"
                                    </p>
                                )}
                                {type === 'user' && targetUsername && (
                                    <p className="text-gray-900 dark:text-white text-sm font-medium">
                                        @{targetUsername}
                                    </p>
                                )}
                            </div>

                            {/* Reason selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Why are you reporting this {type}?
                                </label>
                                <div className="space-y-3">
                                    {REPORT_REASONS.map((reason) => (
                                        <label key={reason.value} className="flex items-start cursor-pointer">
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={reason.value}
                                                checked={selectedReason === reason.value}
                                                onChange={(e) => setSelectedReason(e.target.value as ReportReason)}
                                                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                                                disabled={isSubmitting}
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {reason.label}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {reason.description}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Additional description */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Additional details (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide any additional context that might help us understand the issue..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                    rows={3}
                                    maxLength={500}
                                    disabled={isSubmitting}
                                />
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {description.length}/500 characters
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center"
                                >
                                    {isSubmitting && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}