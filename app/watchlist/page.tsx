'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Star,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  BrainCircuit,
  Search,
  RefreshCcw,
  Sparkles,
  Lock,
  ChevronRight,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  X,
  CheckCircle2,
} from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { usePlan } from '@/lib/context/PlanContext';

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
  sparkline?: number[];
  is_index?: boolean;
  updated_at?: number;
}

const DEFAULT_WATCHLIST: Record<string, string[]> = {
  Main: ['NIFTY 50', 'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'BHARTIARTL', 'TATAMOTORS'],
  'Tech & IT': ['TCS', 'INFY', 'WIPRO', 'HCLTECH'],
  Banking: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK'],
};

const POPULAR_SUGGESTIONS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
  { symbol: 'INFY', name: 'Infosys Ltd' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors CV' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'ITC', name: 'ITC Limited' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd' },
  { symbol: 'NIFTY 50', name: 'Nifty 50 Index' },
];

export default function WatchlistPage() {
  const { plan, isFree, isPro } = usePlan();

  // Active Tab / Watchlist
  const [tabs, setTabs] = useState<string[]>(['Main', 'Tech & IT', 'Banking']);
  const [activeTab, setActiveTab] = useState<string>('Main');
  const [watchlists, setWatchlists] = useState<Record<string, string[]>>(DEFAULT_WATCHLIST);

  // Quotes & Data
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Add UI
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Modals & Notifications
  const [showNewTabModal, setShowNewTabModal] = useState<boolean>(false);
  const [newTabName, setNewTabName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<boolean>(false);

  // Limit settings based on plan
  const maxStocks = isFree ? 10 : isPro ? 50 : 200;
  const maxTabs = isFree ? 1 : isPro ? 10 : 25;

  const showToast = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load user watchlists from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brifix_watchlists_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setWatchlists(parsed);
          const savedTabs = Object.keys(parsed);
          if (savedTabs.length > 0) {
            setTabs(savedTabs);
            if (!savedTabs.includes(activeTab)) {
              setActiveTab(savedTabs[0]);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not read saved watchlists:', e);
    }
  }, []);

  // Sync to localStorage
  const saveWatchlists = (updated: Record<string, string[]>) => {
    setWatchlists(updated);
    try {
      localStorage.setItem('brifix_watchlists_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Error persisting watchlists:', e);
    }
  };

  // Fetch quotes whenever activeTab or active watchlist symbols change
  useEffect(() => {
    const currentSymbols = watchlists[activeTab] || [];
    fetchQuotes(currentSymbols);
  }, [activeTab, watchlists]);

  const fetchQuotes = async (symbolsToFetch: string[], isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const symbolsParam = symbolsToFetch.join(',');
      const res = await authService.getWatchlistQuotes(symbolsParam, activeTab);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setStocks(res.data.data);
      } else {
        setStocks(
          symbolsToFetch.map((sym) => ({
            symbol: sym,
            name: sym,
            price: 0,
            change: 0,
            change_pct: 0,
            sparkline: [100, 101, 99, 102],
          }))
        );
      }
    } catch (error) {
      console.warn('Watchlist quote fetch error:', error);
      setStocks((prev) => {
        const map = new Map(prev.map((s) => [s.symbol, s]));
        return symbolsToFetch.map(
          (sym) =>
            map.get(sym) || {
              symbol: sym,
              name: sym,
              price: 1000,
              change: 0,
              change_pct: 0,
            }
        );
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search input debouncer
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await authService.searchWatchlistSymbols(searchQuery.trim());
        if (res?.data?.results) {
          setSearchResults(res.data.results);
        } else {
          const q = searchQuery.toUpperCase();
          const filtered = POPULAR_SUGGESTIONS.filter(
            (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
          );
          setSearchResults(filtered);
        }
      } catch (e) {
        const q = searchQuery.toUpperCase();
        setSearchResults(
          POPULAR_SUGGESTIONS.filter(
            (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
          )
        );
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search auto-complete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add stock to active tab
  const handleAddStock = async (symbolToAdd: string, nameToAdd?: string) => {
    const sym = symbolToAdd.trim().toUpperCase();
    if (!sym) return;

    const currentList = watchlists[activeTab] || [];

    if (currentList.includes(sym)) {
      showToast(`${sym} is already in your ${activeTab} watchlist`, 'warn');
      setSearchQuery('');
      setShowSearchDropdown(false);
      return;
    }

    if (currentList.length >= maxStocks) {
      if (isFree) {
        setShowUpgradePrompt(true);
        showToast(`Free plan is limited to ${maxStocks} stocks per watchlist. Upgrade to Pro!`, 'warn');
      } else {
        showToast(`Reached maximum of ${maxStocks} stocks for this watchlist`, 'warn');
      }
      return;
    }

    const updatedList = [...currentList, sym];
    const updatedWatchlists = { ...watchlists, [activeTab]: updatedList };
    saveWatchlists(updatedWatchlists);

    try {
      await authService.addToWatchlist({ symbol: sym, name: nameToAdd, tab: activeTab });
    } catch (e) {
      console.warn('Backend sync failed, stored locally:', e);
    }

    setSearchQuery('');
    setShowSearchDropdown(false);
    showToast(`Added ${sym} to ${activeTab}`, 'success');
  };

  // Remove stock from active tab
  const handleRemoveStock = async (symbolToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const currentList = watchlists[activeTab] || [];
    const updatedList = currentList.filter((s) => s !== symbolToRemove);
    const updatedWatchlists = { ...watchlists, [activeTab]: updatedList };
    saveWatchlists(updatedWatchlists);

    setStocks((prev) => prev.filter((s) => s.symbol !== symbolToRemove));

    try {
      await authService.removeFromWatchlist({ symbol: symbolToRemove, tab: activeTab });
    } catch (err) {
      console.warn('Backend remove sync failed:', err);
    }

    showToast(`Removed ${symbolToRemove} from ${activeTab}`, 'success');
  };

  // Create new tab
  const handleCreateNewTab = () => {
    if (tabs.length >= maxTabs) {
      setShowUpgradePrompt(true);
      return;
    }
    const trimmed = newTabName.trim();
    if (!trimmed) return;

    if (tabs.includes(trimmed)) {
      showToast(`A watchlist named "${trimmed}" already exists`, 'warn');
      return;
    }

    const newTabs = [...tabs, trimmed];
    const newWatchlists = { ...watchlists, [trimmed]: [] };
    setTabs(newTabs);
    saveWatchlists(newWatchlists);
    setActiveTab(trimmed);
    setNewTabName('');
    setShowNewTabModal(false);
    showToast(`Created watchlist "${trimmed}"`, 'success');
  };

  // Delete tab
  const handleDeleteTab = (tabToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) {
      showToast('Cannot delete the last remaining watchlist', 'warn');
      return;
    }
    const newTabs = tabs.filter((t) => t !== tabToDelete);
    const { [tabToDelete]: _, ...rest } = watchlists;
    setTabs(newTabs);
    saveWatchlists(rest);
    if (activeTab === tabToDelete) {
      setActiveTab(newTabs[0]);
    }
    showToast(`Deleted "${tabToDelete}" watchlist`, 'success');
  };

  const currentCount = (watchlists[activeTab] || []).length;
  const capacityPct = Math.min(100, Math.round((currentCount / maxStocks) * 100));

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortBy === 'price') cmp = (a.price || 0) - (b.price || 0);
      else if (sortBy === 'change') cmp = (a.change_pct || 0) - (b.change_pct || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [stocks, sortBy, sortDir]);

  const renderSparkline = (points?: number[], isPositive = true) => {
    if (!points || points.length < 2) {
      return <div style={{ width: 68, height: 24 }} />;
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 72;
    const height = 26;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const strokeColor = isPositive ? '#10B981' : '#F43F5E';
    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords.join(' ')}
        />
      </svg>
    );
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 10,
            background:
              toastMessage.type === 'error'
                ? '#DC2626'
                : toastMessage.type === 'warn'
                ? '#D97706'
                : '#059669',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toastMessage.type === 'warn' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toastMessage.text}
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Star size={20} color="#fff" fill="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
                My Watchlist
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Track real-time market prices, day swings & trigger AI predictions
              </p>
            </div>
          </div>
        </div>

        {/* Plan Capacity & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {/* Plan capacity indicator */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>
                  {plan.toUpperCase()} CAPACITY
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: capacityPct >= 90 ? '#F43F5E' : 'var(--text-1)' }}>
                  {currentCount} / {maxStocks} Stocks
                </span>
              </div>
              <div
                style={{
                  width: 130,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.08)',
                  marginTop: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${capacityPct}%`,
                    background:
                      capacityPct >= 90
                        ? '#F43F5E'
                        : capacityPct >= 70
                        ? '#F59E0B'
                        : 'var(--accent)',
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {isFree && (
              <Link
                href="/pricing"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6366F1',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginLeft: 4,
                }}
              >
                <Sparkles size={11} /> Upgrade
              </Link>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchQuotes(watchlists[activeTab] || [], true)}
            disabled={refreshing || loading}
            className="btn-ghost"
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Refresh Quotes"
          >
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Upgrade Banner for Free Plan when high capacity */}
      {isFree && currentCount >= 8 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(167,139,250,0.08))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} color="#818CF8" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                Nearing Free Plan Limit ({currentCount}/10 Stocks)
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Upgrade to Pro for up to 10 watchlists, 50 stocks each, and instant AI buy/sell predictions.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              padding: '7px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            Upgrade for ₹499/mo
          </Link>
        </div>
      )}

      {/* Watchlist Tabs & Search Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = (watchlists[tab] || []).length;
              return (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : 'var(--text-2)',
                    border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {count}
                  </span>
                  {tabs.length > 1 && tab !== 'Main' && (
                    <button
                      onClick={(e) => handleDeleteTab(tab, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 2,
                        opacity: 0.6,
                      }}
                      title="Delete Watchlist"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* + New Tab button */}
            <button
              onClick={() => {
                if (isFree && tabs.length >= 1) {
                  setShowUpgradePrompt(true);
                } else {
                  setShowNewTabModal(true);
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: '1px dashed var(--border)',
                color: 'var(--text-3)',
              }}
              title={isFree ? 'Pro feature: Create multiple watchlists' : 'Create New Watchlist'}
            >
              {isFree ? <Lock size={12} color="#F59E0B" /> : <Plus size={12} />}
              <span>New List</span>
              {isFree && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    background: '#6366F1',
                    color: '#fff',
                    padding: '1px 4px',
                    borderRadius: 3,
                  }}
                >
                  PRO
                </span>
              )}
            </button>
          </div>

          {/* Table / Grid view switches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setViewMode('table')}
              className="btn-ghost"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: viewMode === 'table' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-1)' : 'var(--text-3)',
              }}
              title="Table View"
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="btn-ghost"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: viewMode === 'grid' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-1)' : 'var(--text-3)',
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Search & Quick-Add Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }} ref={searchRef}>
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                color: 'var(--text-3)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search stocks to add (e.g. RELIANCE, TCS, TATAMOTORS, HDFCBANK)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleAddStock(searchQuery.trim());
                }
              }}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 10,
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                paddingLeft: 40,
                paddingRight: 14,
                fontSize: 13,
                color: 'var(--text-1)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (searchQuery.trim()) handleAddStock(searchQuery.trim());
            }}
            style={{
              height: 42,
              padding: '0 16px',
              borderRadius: 10,
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Stock</span>
          </button>

          {/* Search suggestions dropdown */}
          {showSearchDropdown && (searchQuery.trim() || searchResults.length > 0) && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                zIndex: 100,
                maxHeight: 280,
                overflowY: 'auto',
                padding: '6px 0',
              }}
            >
              {searching ? (
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-3)' }}>
                  Searching market symbols...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const alreadyInList = (watchlists[activeTab] || []).includes(item.symbol);
                  return (
                    <div
                      key={item.symbol}
                      onClick={() => handleAddStock(item.symbol, item.name)}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: alreadyInList ? 'default' : 'pointer',
                        background: 'transparent',
                        opacity: alreadyInList ? 0.5 : 1,
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!alreadyInList) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                          {item.symbol}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.name}</div>
                      </div>
                      <div>
                        {alreadyInList ? (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Added</span>
                        ) : (
                          <button
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: 'rgba(99,102,241,0.15)',
                              color: '#818CF8',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    No exact match for &quot;{searchQuery}&quot;
                  </span>
                  <button
                    onClick={() => handleAddStock(searchQuery.trim())}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Add anyway
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick-add chips */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', marginRight: 4 }}>Popular:</span>
          {POPULAR_SUGGESTIONS.slice(0, 6).map((pop) => {
            const added = (watchlists[activeTab] || []).includes(pop.symbol);
            return (
              <button
                key={pop.symbol}
                onClick={() => handleAddStock(pop.symbol, pop.name)}
                disabled={added}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: added ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                  color: added ? 'var(--text-3)' : 'var(--text-2)',
                  border: '1px solid var(--border)',
                  cursor: added ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {!added && <Plus size={10} />}
                {pop.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stock Content View */}
      {loading ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <RefreshCcw size={28} className="animate-spin" color="var(--accent-light)" />
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Fetching real-time market quotes...</span>
        </div>
      ) : sortedStocks.length === 0 ? (
        /* Empty Watchlist State */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border)',
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(245,158,11,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
            }}
          >
            <Star size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
              Your &quot;{activeTab}&quot; watchlist is empty
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 420, margin: '0 auto' }}>
              Add stocks you want to monitor closely with live prices, intraday swings, and instant AI buy/sell insights.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            {POPULAR_SUGGESTIONS.slice(0, 5).map((pop) => (
              <button
                key={pop.symbol}
                onClick={() => handleAddStock(pop.symbol, pop.name)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} color="var(--accent-light)" />
                {pop.symbol}
              </button>
            ))}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <th
                    style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', cursor: 'pointer' }}
                    onClick={() => {
                      setSortBy('name');
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    SYMBOL & COMPANY
                  </th>
                  <th
                    style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => {
                      setSortBy('price');
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    LTP (₹)
                  </th>
                  <th
                    style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => {
                      setSortBy('change');
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    CHANGE
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'center' }}>
                    7D TREND
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'right' }}>
                    DAY HIGH / LOW
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'center' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const isPos = (stock.change_pct || 0) >= 0;
                  const color = isPos ? '#10B981' : '#F43F5E';
                  const Icon = isPos ? TrendingUp : TrendingDown;

                  return (
                    <tr
                      key={stock.symbol}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {/* Symbol & Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: stock.is_index ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              color: stock.is_index ? '#818CF8' : 'var(--text-1)',
                            }}
                          >
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                                {stock.symbol}
                              </span>
                              {stock.is_index && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    background: 'rgba(99,102,241,0.15)',
                                    color: '#818CF8',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                  }}
                                >
                                  INDEX
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                              {stock.name || stock.symbol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* LTP */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                          ₹{Number(stock.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {stock.volume ? (
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                            Vol: {(stock.volume / 100000).toFixed(1)}L
                          </div>
                        ) : null}
                      </td>

                      {/* Change & % */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isPos ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                            color,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <Icon size={13} />
                          {isPos ? '+' : ''}
                          {(stock.change_pct || 0).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: 10, color, marginTop: 2 }}>
                          {isPos ? '+' : ''}₹{Number(stock.change || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Sparkline */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {renderSparkline(stock.sparkline, isPos)}
                        </div>
                      </td>

                      {/* High / Low */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {stock.high && stock.low ? (
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                              H: ₹{stock.high.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                              L: ₹{stock.low.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {/* Chart link */}
                          <Link
                            href={`/chart?symbol=${encodeURIComponent(stock.symbol)}`}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'rgba(99,102,241,0.12)',
                              color: '#818CF8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              transition: 'transform 0.1s ease',
                            }}
                            title={`Open ${stock.symbol} interactive chart`}
                          >
                            <BarChart3 size={15} />
                          </Link>

                          {/* AI Predict link */}
                          <Link
                            href={`/predictions?symbol=${encodeURIComponent(stock.symbol)}`}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'rgba(167,139,250,0.12)',
                              color: '#A78BFA',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                            }}
                            title={`Run AI prediction on ${stock.symbol}`}
                          >
                            <BrainCircuit size={15} />
                          </Link>

                          {/* Delete button */}
                          <button
                            onClick={(e) => handleRemoveStock(stock.symbol, e)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'rgba(244,63,94,0.1)',
                              color: '#F43F5E',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={`Remove ${stock.symbol} from watchlist`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {sortedStocks.map((stock) => {
            const isPos = (stock.change_pct || 0) >= 0;
            const color = isPos ? '#10B981' : '#F43F5E';
            const Icon = isPos ? TrendingUp : TrendingDown;

            return (
              <div
                key={stock.symbol}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  position: 'relative',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Header inside card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: stock.is_index ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        color: stock.is_index ? '#818CF8' : 'var(--text-1)',
                      }}
                    >
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                        {stock.symbol}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stock.name || stock.symbol}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleRemoveStock(stock.symbol, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-3)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                    title="Remove stock"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Price & Sparkline row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>
                      ₹{Number(stock.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color }}>
                      <Icon size={14} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {isPos ? '+' : ''}{(stock.change_pct || 0).toFixed(2)}%
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>
                        ({isPos ? '+' : ''}₹{Number(stock.change || 0).toFixed(1)})
                      </span>
                    </div>
                  </div>

                  <div>{renderSparkline(stock.sparkline, isPos)}</div>
                </div>

                {/* High/Low bar */}
                {stock.high && stock.low && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                      <span>L: ₹{stock.low.toFixed(1)}</span>
                      <span>H: ₹{stock.high.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                  <Link
                    href={`/chart?symbol=${encodeURIComponent(stock.symbol)}`}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: 8,
                      background: 'rgba(99,102,241,0.12)',
                      color: '#818CF8',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      textDecoration: 'none',
                    }}
                  >
                    <BarChart3 size={13} /> Chart
                  </Link>

                  <Link
                    href={`/predictions?symbol=${encodeURIComponent(stock.symbol)}`}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: 8,
                      background: 'rgba(167,139,250,0.12)',
                      color: '#A78BFA',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      textDecoration: 'none',
                    }}
                  >
                    <BrainCircuit size={13} /> AI Predict
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Tab Modal */}
      {showNewTabModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowNewTabModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 380,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Create New Watchlist
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
              Organize your portfolio stocks into focused categories like EV, Pharma, or Swing.
            </p>

            <input
              type="text"
              placeholder="e.g. Dividend Kings, EV Sector..."
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewTab();
              }}
              autoFocus
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                padding: '0 12px',
                fontSize: 13,
                color: 'var(--text-1)',
                outline: 'none',
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowNewTabModal(false)}
                className="btn-ghost"
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewTab}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowUpgradePrompt(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: 18,
              padding: 28,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
              }}
            >
              <Sparkles size={26} color="#fff" />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
              Unlock Multiple Watchlists with Pro
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 20 }}>
              The Free plan includes 1 watchlist with up to 10 stocks. Upgrade to Pro to track up to 10 separate watchlists, 50 stocks each, real-time tick streaming, and 50 AI predictions per day!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/pricing"
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                View Plans & Upgrade <ChevronRight size={16} />
              </Link>

              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="btn-ghost"
                style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-3)' }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
