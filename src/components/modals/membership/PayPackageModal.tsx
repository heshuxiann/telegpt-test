import React, { memo, useCallback, useEffect, useState } from '../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../global';

import type { TabState } from '../../../global/types';

import { getSubscriptionInfo } from '../../chatAssistant/utils/telegpt-api';

import Icon from '../../common/icons/Icon';
import Modal from '../../ui/Modal';

import styles from './PayPackageModal.module.scss';

export type OwnProps = {
  modal: TabState['payPackageModal'];
};

type AllPlanType = 'free' | 'basic' | 'pro' | 'plus';
type PlanType = 'basic' | 'pro' | 'plus';

const PLAN_ORDER: Record<AllPlanType, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  plus: 3,
};

interface PricingPlan {
  planType: PlanType;
  title: string;
  price: string;
  period: string;
  creditsInfo: string;
  creditsInfoDescription: string;
  buttonLink: string;
  features: string[];
  buttonText: string;
  isSelected?: boolean;
}

const PRICING_PLANS: Record<PlanType, PricingPlan> = {
  basic: {
    planType: 'basic',
    title: 'Basic',
    price: '$4.99',
    period: '/month',
    creditsInfo: '10,000 Credits monthly',
    creditsInfoDescription: '10,000 extra credits first month [LIMITED TIME]',
    buttonLink: 'https://buy.stripe.com/28E8wQeqhfPK2g5g014Ni05',
    // buttonLink: 'https://buy.stripe.com/test_00w6oIfulavq6wl7tv4Ni04',
    features: [
      '1 daily Global Chat Summary',
      '250 Group Chat Summary ',
      '200 Images Summary ',
      '60 mins video & Voice Summary',
      '10k-characters AI Translation',
      '10k-characters Grammar Check',
      '60-pages Web & Doc Summary',
      'AI Chat Folders',
    ],
    buttonText: 'Get Started',
    isSelected: false,
  },
  pro: {
    planType: 'pro',
    title: 'Pro',
    price: '$9.99',
    period: '/month',
    creditsInfo: '60,000 Credits monthly',
    creditsInfoDescription: '60,000 extra credits first month [LIMITED TIME]',
    buttonLink: 'https://buy.stripe.com/28EdRa2HzdHC3k9g014Ni07',
    // buttonLink: 'https://buy.stripe.com/test_dRm00keqh1YU4oddRT4Ni06',
    features: [
      '3 daily Global Chat Summary',
      '1k Group Chat Summary',
      '1k Images Summary',
      '300 min Video & Voice Summary',
      '300k-characters AI Translation',
      '300k-characters Grammar Check',
      '300 pages Web & Doc Summary',
      '120 Schedule Meetings',
      'Urgent Alert',
      'AI Chat Folders',
      'Priority Support',
    ],
    buttonText: 'Upgrade',
    isSelected: true,
  },
  plus: {
    planType: 'plus',
    title: 'Plus',
    price: '$19.99',
    period: '/month',
    creditsInfo: '120,000 Credits monthly',
    creditsInfoDescription: '120,000 extra credits first month [LIMITED TIME]',
    buttonLink: 'https://buy.stripe.com/14A3cwbe5fPKcUJ4hj4Ni08',
    // buttonLink: 'https://buy.stripe.com/test_28EdRa2HzdHC3k9g014Ni07',
    features: [
      '3 daily Global Chat Summary',
      '2k Group Chat Summary ',
      '2k Images Summary ',
      '600 min Video & Voice Summary',
      '600k-characters AI Translation',
      '600k-characters Grammar Check',
      '600 pages Web & Doc Summary',
      'Unlimited Schedule Meetings',
      'Urgent Alert',
      'AI Chat Folders',
      'Users Portrait',
      'Priority Support',
    ],
    buttonText: 'Upgrade',
    isSelected: false,
  },
};

const PayPackageModal = ({ modal }: OwnProps) => {
  const { subscriptionInfo } = getGlobal();
  const { subscriptionType } = subscriptionInfo;
  const { closePayPackageModal, updateSubscriptionInfo } = getActions();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    subscriptionType === 'basic' ? 'pro' : subscriptionType === 'pro' ? 'plus' : subscriptionType === 'plus' ? 'plus' : 'basic',
  );
  const [curSubscriptionInfo, setCurSubscriptionInfo] = useState(subscriptionInfo);

  useEffect(() => {
    if (modal?.isOpen) {
      getSubscriptionInfo().then(({ code, data }) => {
        if (code === 0) {
          setCurSubscriptionInfo(data);
          const { subscriptionType, creditBalance, createdAt, subscriptionExpiresAt, isExpirated } = data;
          setSelectedPlan(subscriptionType === 'basic' ? 'pro' : subscriptionType === 'pro' ? 'plus' : subscriptionType === 'plus' ? 'plus' : 'basic');
          updateSubscriptionInfo({
            subscriptionType,
            creditBalance,
            createdAt,
            subscriptionExpiresAt,
            isExpirated,
          });
        }
      });
    }
  }, [modal?.isOpen]);

  const handleClose = useCallback(() => {
    closePayPackageModal();
  }, [closePayPackageModal]);

  const handleUpgrade = useCallback((plan: PlanType) => {
    const buttonLink = PRICING_PLANS[plan].buttonLink;
    const currentUserId = getGlobal().currentUserId;
    const currentPlan: PlanType = curSubscriptionInfo.subscriptionType as PlanType;
    if (!currentUserId) {
      return;
    }
    if (PLAN_ORDER[plan] > PLAN_ORDER[currentPlan]) {
      window.open(`${buttonLink}?client_reference_id=${currentUserId}`, '_blank');
    } else {
      // eslint-disable-next-line no-console
      console.warn('只能升级到比当前更高的套餐');
    }
    closePayPackageModal();
  }, [curSubscriptionInfo.subscriptionType]);

  const handlePlanSelect = useCallback((plan: PlanType) => {
    setSelectedPlan(plan);
  }, []);

  if (!modal?.isOpen) {
    return undefined;
  }

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={handleClose}
      className={styles.modal}
    >
      <div className={styles.container}>
        {/* Header with close button */}
        <div className={styles.header}>
          <div className={styles.headerBadge}></div>
          <h2 className={styles.title}>Upgrade your plan</h2>
          <Icon
            className={styles.closeButton}
            name="close"
            onClick={handleClose}
          />
        </div>

        {/* Pricing Cards */}
        <div className={styles.pricingCards}>
          {(Object.keys(PRICING_PLANS) as PlanType[]).map((planType) => {
            const plan = PRICING_PLANS[planType];
            const isSelected = selectedPlan === planType;

            return (
              <div
                key={planType}
                className={`${styles.pricingCard} ${isSelected ? styles.selected : ''} ${styles[`card${plan.title}`]}`}
                onClick={() => handlePlanSelect(planType)}
              >
                <div className={styles.topContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.planTitle}>{plan.title}</h3>
                  </div>

                  <div className={styles.pricing}>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>{plan.price}</span>
                      <span className={styles.period}>{plan.period}</span>
                    </div>
                  </div>

                  <div>
                    <div className={styles.creditsInfo}>{plan.creditsInfo}</div>
                    <div className={styles.creditsInfoDescription}>{plan.creditsInfoDescription}</div>
                  </div>
                  <button
                    className={styles.upgradeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade(planType);
                    }}
                  >
                    <span>
                      {curSubscriptionInfo.subscriptionType === planType ? 'Your current plan' : 'Upgrade'}
                    </span>
                    {curSubscriptionInfo.subscriptionType !== planType && (
                      <Icon name="arrow-right" />
                    )}
                  </button>
                </div>

                <div className={styles.botInfo}>
                  <ul className={styles.features}>
                    {plan.features.map((feature, index) => (
                      <li key={index} className={styles.feature}>
                        <span className={styles.listdot}>
                          <Icon name="check" className={styles.checkIcon} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default memo(PayPackageModal);
