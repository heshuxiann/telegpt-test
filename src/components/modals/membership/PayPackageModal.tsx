import React, { memo, useCallback, useEffect, useState } from '../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../global';

import type { TabState } from '../../../global/types';

import { telegptSettings } from '../../chatAssistant/api/user-settings';
import { getSubscriptionInfo } from '../../chatAssistant/utils/telegpt-api';

import Icon from '../../common/icons/Icon';
import Modal from '../../ui/Modal';

import styles from './PayPackageModal.module.scss';

export type OwnProps = {
  modal: TabState['payPackageModal'];
};

type PlanType = 'free' | 'basic' | 'pro' | 'plus';

interface PricingPlan {
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
  free: {
    title: 'Free',
    price: '$0',
    period: '/month',
    creditsInfo: '2,000 Credits monthly',
    creditsInfoDescription: '2,000 extra credits first month [LIMITED TIME]',
    buttonLink: '',
    features: [
      'Global Chat Summary (1 every 24h)',
      'Up to 100 Group Chat Summary ',
      'Up to 10 Images Summary ',
      'Up to 5min video & Voice Summary',
      'Up to 10k-characters AI Translation',
      'Up to 10k-characters Grammar Check',
      'Up to 60-pages Web & Doc Summary',
      'AI Chat Folders',
    ],
    buttonText: 'Get Started',
    isSelected: false,
  },
  basic: {
    title: 'Basic',
    price: '$4.99',
    period: '/month',
    creditsInfo: '10,000 Credits monthly',
    creditsInfoDescription: '10,000 extra credits first month [LIMITED TIME]',
    buttonLink: 'https://buy.stripe.com/test_00w6oIfulavq6wl7tv4Ni04',
    features: [
      'Global Chat Summary (1 every 8h）',
      'Up to 1k Group Chat Summary',
      'Up to 100 Images Summary',
      'Up to 300 min Video & Voice Summary',
      'Up to 300k-characters AI Translation',
      'Up to 300k-characters Grammar Check',
      'Up to 25k-pages Web & Doc Summary',
      'Up to 2 Urgent Alert Key Topics',
      'AI Chat Folders',
      'Up to 120 Schedule Meetings',
      'Priority Support',
    ],
    buttonText: 'Upgrade',
    isSelected: true,
  },
  pro: {
    title: 'Pro',
    price: '$9.9',
    period: '/month',
    creditsInfo: '60,000 Credits monthly',
    creditsInfoDescription: '60,000 extra credits first month [LIMITED TIME]',
    buttonLink: 'https://buy.stripe.com/test_dRmfZi5TLcDy5sh9BD4Ni00',
    features: [
      'Global Chat Summary (1 every 8h）',
      'Up to 1k Group Chat Summary',
      'Up to 100 Images Summary',
      'Up to 300 min Video & Voice Summary',
      'Up to 300k-characters AI Translation',
      'Up to 300k-characters Grammar Check',
      'Up to 25k-pages Web & Doc Summary',
      'Up to 2 Urgent Alert Key Topics',
      'AI Chat Folders',
      'Up to 120 Schedule Meetings',
      'Priority Support',
    ],
    buttonText: 'Upgrade',
    isSelected: true,
  },
  plus: {
    title: 'Plus',
    price: '$19.9',
    period: '/month',
    creditsInfo: '120,000 Credits monthly',
    creditsInfoDescription: '120,000 extra credits first month [LIMITED TIME]',
    buttonLink: 'https://buy.stripe.com/test_fZuaEY0zr7je1c1eVX4Ni02',
    features: [
      'Global Chat Summary (1 every 8h）',
      'Up to 2k Group Chat Summary ',
      'Up to 200 Images Summary ',
      'Up to 600 min Video & Voice Summary',
      'Up to 600k-characters AI Translation',
      'Up to 600k-characters Grammar Check',
      'Up to 50k-pages Web & Doc Summary',
      'Up to 10 Urgent Alert Key Topics',
      'AI Chat Folders',
      'Users Portrait',
      'Unlimited Schedule Meetings',
      'Priority Support',
    ],
    buttonText: 'Upgrade',
    isSelected: false,
  },
};

const PayPackageModal = ({ modal }: OwnProps) => {
  const { subscription_info } = telegptSettings.telegptSettings;
  const { closePayPackageModal } = getActions();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(subscription_info.subscription_type as PlanType);
  const [subscriptionInfo, setSubscriptionInfo] = useState(subscription_info);

  useEffect(() => {
    if (modal?.isOpen) {
      getSubscriptionInfo().then(({ code, data }) => {
        if (code === 0) {
          setSubscriptionInfo(data);
          setSelectedPlan(data.subscription_type);
        }
      });
    }
  }, [modal?.isOpen]);

  const handleClose = useCallback(() => {
    closePayPackageModal();
  }, [closePayPackageModal]);

  const handleUpgrade = useCallback((plan: PlanType) => {
    // Handle upgrade logic here
    // setSelectedPlan(plan);
    const buttonLink = PRICING_PLANS[plan].buttonLink;
    const currentUserId = getGlobal().currentUserId;
    if (!currentUserId) {
      return;
    }
    if (subscriptionInfo && !subscriptionInfo.is_expirated) {
      return;
    }
    if (plan === 'basic' || plan === 'pro' || plan === 'plus') {
      window.open(`${buttonLink}?client_reference_id=${currentUserId}`, '_blank');
    }
    closePayPackageModal();
  }, [subscriptionInfo]);

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
                      {plan.buttonText}
                    </span>
                    <Icon name="arrow-right" />
                  </button>
                </div>

                <div className={styles.botInfo}>
                  <div className={styles.featuresTitle}>Features included:</div>
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
