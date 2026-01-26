/* eslint-disable no-null/no-null */
/**
 * PhaseIndicator 组件
 * 显示 Agent 当前执行阶段
 */

import React, { memo } from 'react';

import buildClassName from '../../../util/buildClassName';
import { AgentPhase } from '../agent/stream-events';

import styles from './PhaseIndicator.module.scss';

interface OwnProps {
  phase: AgentPhase | null;
  className?: string;
}

const PHASE_CONFIG = {
  [AgentPhase.THINKING]: {
    icon: '💭',
    label: 'Thinking',
    color: 'blue',
  },
  [AgentPhase.TOOL_CALLING]: {
    icon: '🔍',
    label: 'Getting data',
    color: 'purple',
  },
  [AgentPhase.GENERATING]: {
    icon: '✍️',
    label: 'Generating',
    color: 'green',
  },
  [AgentPhase.COMPLETED]: {
    icon: '✅',
    label: 'Completed',
    color: 'success',
  },
  [AgentPhase.ERROR]: {
    icon: '❌',
    label: 'Error',
    color: 'error',
  },
};

const PhaseIndicator = ({ phase, className }: OwnProps) => {
  if (!phase) return null;

  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  return (
    <div className={buildClassName(styles.root, className, styles[config.color])}>
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.label}>{config.label}</span>
      {phase !== AgentPhase.COMPLETED && phase !== AgentPhase.ERROR && (
        <span className={styles.spinner} />
      )}
    </div>
  );
};

export default memo(PhaseIndicator);
