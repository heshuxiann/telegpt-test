// import { useChat } from '@ai-sdk/react';
import React, { useEffect, useState } from '../../../lib/teact/teact';

import Modal from '../../ui/Modal';
import CopyIcon from './Icon/CopyIcon';
import RefreshIcon from './Icon/RefreshIcon';

import './SummarizeModal.scss';
import aiSdkService from './ChatApiService';
import SkeletonScreen from './SkeletonScreen';
import { set } from 'idb-keyval';
import StatusResponse from './StatusResponse';

interface SummarizeModalProps {
    isOpen?: boolean;
    text?: string;
    onClose: NoneToVoidFunction;
}
const SummarizeModal = (props: SummarizeModalProps) => {
    const { text, isOpen, onClose } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [summarizeResult, setSummarizeResult] = useState('');
    useEffect(() => {
        if (isOpen) {
            handleChat();
        }
    }, [isOpen]);
    const handleChat = () => {
        setIsLoading(true);
        aiSdkService.useChat({
            data: {
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that summarizes long texts into concise summaries.',
                        id: ''
                    },
                    {
                        role: 'user',
                        content: `Please summarize the following text: "${text}"`,
                        id: '2'
                    }
                ]
            },
            onResponse: (message) => {
                setIsLoading(false);
                setSummarizeResult(message.content);
            },
            onFinish: () => {
                console.log("Finish")
            }
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            hasCloseButton
            className="summarize-modal"
            title="Summarize"
        >
            <div className="summarize-origin-text">{text}</div>
            {isLoading ?(
                <SkeletonScreen />
            ):(
                <StatusResponse content={summarizeResult} />
            )}
            <div className="summarize-footer">
                <div className="summarize-footer-btn">
                    <CopyIcon size={16} fill="#676B74" />
                </div>
                <div className="summarize-footer-btn">
                    <RefreshIcon size={16} fill="#676B74" />
                </div>
            </div>
        </Modal>
    );
};

export default SummarizeModal;
