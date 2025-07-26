'use client';

import { useState } from 'react';
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
    type: 'post' | 'user';
    targetId: string;
    targetContent?: string;
    targetUsername?: string;
    className?: string;
}

export function ReportButton({
    type,
    targetId,
    targetContent,
    targetUsername,
    className = ''
}: ReportButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`text-gray-500 hover:text-red-500 transition-colors ${className}`}
                title={`Report ${type}`}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
            </button>

            <ReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={type}
                targetId={targetId}
                targetContent={targetContent}
                targetUsername={targetUsername}
            />
        </>
    );
}