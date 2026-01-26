/**
 * ToolCallCard 组件
 * 显示 Agent 工具调用的状态和结果
 */

import React, { memo } from 'react';

import type { ToolCallState } from '../agent/useAgentChat';

import buildClassName from '../../../util/buildClassName';

import styles from './ToolCallCard.module.scss';

interface OwnProps {
  tool: ToolCallState;
  className?: string;
}

const ToolCallCard = ({ tool, className }: OwnProps) => {
  const {
    toolDescription, params, status, summary, error,
  } = tool;

  const statusIcon = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';

  return (
    <div className={buildClassName(styles.root, className, styles[status])}>
      <div className={styles.header}>
        <span className={styles.icon}>🔧</span>
        <span className={styles.title}>{toolDescription}</span>
        <span className={styles.status}>{statusIcon}</span>
      </div>

      {params && Object.keys(params).length > 0 && (
        <div className={styles.params}>
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className={styles.param}>
              <span className={styles.paramKey}>
                {key}
                :
              </span>
              {' '}
              <span className={styles.paramValue}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className={styles.summary}>
          {summary}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default memo(ToolCallCard);
