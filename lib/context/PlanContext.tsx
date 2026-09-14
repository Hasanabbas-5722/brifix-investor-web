'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type PlanType = 'free' | 'pro' | 'premium';

export interface PlanInfo {
  id: PlanType;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  desc: string;
  badge: string;
  color: string;
  features: string[];
  limits: {
    aiPredictionsPerDay: number;
    watchlists: number;
    realtimeMarketData: boolean;
    advancedCharts: boolean;
    portfolioAnalytics: boolean;
    optionsChain: boolean;
    institutionalFlow: boolean;
    priceAlerts: boolean;
  };
}

export const PLAN_DETAILS: Record<PlanType, PlanInfo> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    desc: 'Get started with basic features',
    badge: 'FREE',
    color: '#64748B',
    features: [
      'Basic market data',
      'NIFTY 50 tracking',
      'Limited news feed',
      '1 watchlist (10 stocks)',
      'Community support',
    ],
    limits: {
      aiPredictionsPerDay: 0,
      watchlists: 1,
      realtimeMarketData: false,
      advancedCharts: false,
      portfolioAnalytics: false,
      optionsChain: false,
      institutionalFlow: false,
      priceAlerts: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 499,
    priceYearly: 4790,
    desc: 'For serious investors',
    badge: 'PRO',
    color: '#6366F1',
    features: [
      'Everything in Free',
      'Real-time market data',
      'AI predictions (50/day)',
      'Advanced TradingView charts',
      'Portfolio analytics',
      '10 watchlists',
      'Price alerts',
    ],
    limits: {
      aiPredictionsPerDay: 50,
      watchlists: 10,
      realtimeMarketData: true,
      advancedCharts: true,
      portfolioAnalytics: true,
      optionsChain: false,
      institutionalFlow: false,
      priceAlerts: true,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 999,
    priceYearly: 9590,
    desc: 'Maximum power & insights',
    badge: 'PREMIUM',
    color: '#F59E0B',
    features: [
      'Everything in Pro',
      'Unlimited AI predictions',
      'Options chain analysis',
      'Institutional flow data',
      'Custom screeners',
      'API access',
      'Dedicated support',
    ],
    limits: {
      aiPredictionsPerDay: 999999,
      watchlists: 999,
      realtimeMarketData: true,
      advancedCharts: true,
      portfolioAnalytics: true,
      optionsChain: true,
      institutionalFlow: true,
      priceAlerts: true,
    },
  },
};

interface PlanContextType {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  planInfo: PlanInfo;
  isFree: boolean;
  isPro: boolean;
  isPremium: boolean;
  canAccessAiPredictions: boolean;
  canAccessAdvancedCharts: boolean;
  canAccessPortfolioAnalytics: boolean;
  canAccessOptionsChain: boolean;
  canAccessPriceAlerts: boolean;
  upgradePlan: (plan: PlanType) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const STORAGE_KEY = 'brifix_user_plan';

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<PlanType>('free');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as PlanType;
      if (saved && (saved === 'free' || saved === 'pro' || saved === 'premium')) {
        setPlanState(saved);
      } else {
        localStorage.setItem(STORAGE_KEY, 'free');
      }
    } catch {
      // ignore SSR
    }
    setMounted(true);
  }, []);

  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan);
    try {
      localStorage.setItem(STORAGE_KEY, newPlan);
    } catch {
      // ignore
    }
  };

  const upgradePlan = (newPlan: PlanType) => {
    setPlan(newPlan);
  };

  const currentPlanInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.free;
  const isFree = plan === 'free';
  const isPro = plan === 'pro';
  const isPremium = plan === 'premium';

  const value: PlanContextType = {
    plan,
    setPlan,
    planInfo: currentPlanInfo,
    isFree,
    isPro,
    isPremium,
    canAccessAiPredictions: plan === 'pro' || plan === 'premium',
    canAccessAdvancedCharts: plan === 'pro' || plan === 'premium',
    canAccessPortfolioAnalytics: plan === 'pro' || plan === 'premium',
    canAccessOptionsChain: plan === 'premium',
    canAccessPriceAlerts: plan === 'pro' || plan === 'premium',
    upgradePlan,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    // Fallback safe values if used outside provider
    return {
      plan: 'free' as PlanType,
      setPlan: () => {},
      planInfo: PLAN_DETAILS.free,
      isFree: true,
      isPro: false,
      isPremium: false,
      canAccessAiPredictions: false,
      canAccessAdvancedCharts: false,
      canAccessPortfolioAnalytics: false,
      canAccessOptionsChain: false,
      canAccessPriceAlerts: false,
      upgradePlan: () => {},
    };
  }
  return context;
}
