'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useContracts } from '@/hooks/useContracts';
import { useChat } from '@/hooks/use-chat';
import { useProduct } from '@/hooks/use-products';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContractListItem, ContractStatus } from '@/types/contract';
import type { ChatRoom } from '@/types/chat';
import {
  AlertTriangle,
  Clock,
  FileSignature,
  FileText,
  Inbox,
  MessageCircle,
  RefreshCcw,
  Search,
} from 'lucide-react';

type StatusFilter = 'all' | ContractStatus;

const STATUS_CONFIG: Record<
  ContractStatus,
  {
    label: string;
    badgeClassName: string;
    dotClassName: string;
    description: string;
  }
> = {
  [ContractStatus.PENDING_BOTH]: {
    label: '양측 서명 대기',
    badgeClassName: 'bg-blue-50 text-blue-600 border border-blue-100',
    dotClassName: 'bg-blue-500',
    description: '아직 양측 모두 서명을 완료하지 않았습니다. 계약 내용을 먼저 확인해 주세요.',
  },
  [ContractStatus.PENDING_SELLER]: {
    label: '판매자 서명 대기',
    badgeClassName: 'bg-amber-50 text-amber-600 border border-amber-100',
    dotClassName: 'bg-amber-500',
    description: '구매자는 서명을 마쳤어요. 판매자가 서명하면 계약이 완료됩니다.',
  },
  [ContractStatus.PENDING_BUYER]: {
    label: '구매자 서명 대기',
    badgeClassName: 'bg-violet-50 text-violet-600 border border-violet-100',
    dotClassName: 'bg-violet-500',
    description: '판매자는 서명을 마쳤어요. 구매자의 확인과 서명을 기다리고 있습니다.',
  },
  [ContractStatus.COMPLETED]: {
    label: '서명 완료',
    badgeClassName: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    dotClassName: 'bg-emerald-500',
    description: '양측 서명이 완료되었습니다. 계약서를 보관하고 거래를 마무리하세요.',
  },
};

const STATUS_ORDER: ContractStatus[] = [
  ContractStatus.PENDING_BOTH,
  ContractStatus.PENDING_SELLER,
  ContractStatus.PENDING_BUYER,
  ContractStatus.COMPLETED,
];

const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '전체' },
  ...STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_CONFIG[status].label,
  })),
];

const formatParticipant = (
  name?: string | null,
  identifier?: string | number | null
) => {
  const safeName = typeof name === 'string' ? name.trim() : '';
  if (safeName.length > 0) {
    return safeName;
  }

  const safeIdentifier =
    identifier !== undefined && identifier !== null
      ? String(identifier).trim()
      : '';

  if (safeIdentifier.length > 0) {
    return safeIdentifier;
  }

  return '정보 없음';
};

// 계약서 카드 컴포넌트 (Hook 사용을 위해 분리)
interface ContractCardProps {
  contract: ContractListItem;
  statusMeta: {
    label: string;
    badgeClassName: string;
    dotClassName: string;
    description: string;
  };
  formatContractId: (id: string | number) => string;
  formatParticipant: (name?: string | null, identifier?: string | number | null) => string;
  formatLastUpdated: (value?: Date | string | null) => string;
  getContractDetailUrl: (contract: ContractListItem) => string | null;
  handleDownloadPdf: (contract: ContractListItem) => Promise<void>;
}

const ContractCard = ({
  contract,
  statusMeta,
  formatContractId,
  formatParticipant,
  formatLastUpdated,
  getContractDetailUrl,
  handleDownloadPdf,
}: ContractCardProps) => {
  const productId = typeof contract.productId === 'number' ? contract.productId : 
                   typeof contract.productId === 'string' ? Number(contract.productId) : null;
  const { data: productData } = useProduct(productId, {
    enabled: !!productId && !isNaN(Number(productId)),
  });

  return (
    <Card className="group border border-slate-200 bg-white/90 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="space-y-5 pb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              #{formatContractId(contract.id)}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                statusMeta.badgeClassName
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  statusMeta.dotClassName
                )}
              />
              {statusMeta.label}
            </span>
          </div>
        </div>
        <CardTitle className="text-xl font-semibold text-[#222]">
          {contract.summary || productData?.product?.productName || '계약서'}
        </CardTitle>
        {productData?.product && (
          <p className="text-sm text-[#767676]">
            {productData.product.productName}
          </p>
        )}
        <p className="text-sm text-[#767676]">
          {statusMeta.description}
        </p>
      </CardHeader>
      <CardContent className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 text-sm text-[#555] sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              판매자
            </p>
            <p className="mt-1 text-sm font-medium text-[#222]">
              {formatParticipant(contract.sellerName, contract.sellerId)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              매수자
            </p>
            <p className="mt-1 text-sm font-medium text-[#222]">
              {formatParticipant(contract.buyerName, contract.buyerId)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              마지막 업데이트
            </span>
            <span className="pl-6 text-[11px] text-slate-400">
              {formatLastUpdated(contract.updatedAt)}
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
            {contract.roomId ? (
              <Link
                href={`/chat/${contract.roomId}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#2487f8]/40 px-4 py-2 text-xs font-semibold text-[#2487f8] transition hover:border-[#2487f8] hover:bg-[#2487f8]/5"
              >
                <MessageCircle className="h-4 w-4" />
                채팅 내역
              </Link>
            ) : null}
            {contract.status === ContractStatus.COMPLETED ? (
              <button
                onClick={() => handleDownloadPdf(contract)}
                className="inline-flex items-center gap-2 rounded-full bg-[#2487f8] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1e6fd8]"
              >
                <FileSignature className="h-4 w-4" />
                PDF 다운로드
              </button>
            ) : getContractDetailUrl(contract) ? (
              <Link
                href={getContractDetailUrl(contract)!}
                className="inline-flex items-center gap-2 rounded-full bg-[#2487f8] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1e6fd8]"
              >
                <FileSignature className="h-4 w-4" />
                상세 보기
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed">
                <FileSignature className="h-4 w-4" />
                접근 불가
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


interface ContractListScreenProps {
  viewerId: string | null;
}

const ContractListScreen = ({ viewerId }: ContractListScreenProps) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useContracts({
    enabled: Boolean(viewerId),
    viewerKey: viewerId,
  });

  const contracts = data?.contracts ?? [];

  // 채팅방 정보 가져오기 (sellerId, buyerId, productId 보강용)
  const { chatRooms } = useChat(viewerId);
  
  // 채팅방 정보를 roomId로 매핑
  const roomInfoMap = useMemo(() => {
    const map = new Map<string, ChatRoom>();
    chatRooms.forEach((room) => {
      map.set(room.roomId, room);
    });
    return map;
  }, [chatRooms]);

  useEffect(() => {
    console.log('[ContractListScreen] Data state:', {
      viewerId,
      hasData: !!data,
      success: data?.success,
      contractsCount: contracts.length,
      isLoading,
      isFetching,
      error: error?.message,
      rawContracts: contracts,
    });
  }, [data, contracts, isLoading, isFetching, error, viewerId]);

  const viewerContracts = useMemo<ContractListItem[]>(() => {
    const allContracts = contracts;
    if (!viewerId) {
      console.log('[ContractListScreen] No viewerId, returning empty array');
      return [];
    }
    const viewerKey = String(viewerId);
    
    // 채팅방 정보로 계약서 정보 보강
    const enrichedContracts = allContracts.map((contract) => {
      // roomId가 있고 채팅방 정보가 있으면 정보 보강
      if (contract.roomId && roomInfoMap.has(contract.roomId)) {
        const roomInfo = roomInfoMap.get(contract.roomId)!;
        return {
          ...contract,
          sellerId: contract.sellerId || roomInfo.sellerId,
          buyerId: contract.buyerId || roomInfo.buyerId,
          productId: contract.productId || roomInfo.productId,
          updatedAt: contract.updatedAt || roomInfo.updatedAt,
        };
      }
      return contract;
    });
    
    console.log('[ContractListScreen] Filtering contracts:', {
      totalContracts: enrichedContracts.length,
      viewerId,
      viewerKey,
      contracts: enrichedContracts.map((c) => ({
        id: c.id,
        sellerId: c.sellerId,
        buyerId: c.buyerId,
        productId: c.productId,
        roomId: c.roomId,
        status: c.status,
      })),
    });
    
    // 디버깅: 필터링 전 모든 계약서를 보여주는 옵션 (개발 환경에서만)
    const DEBUG_SHOW_ALL = process.env.NODE_ENV !== 'production' && 
      typeof window !== 'undefined' && 
      window.localStorage.getItem('DEBUG_SHOW_ALL_CONTRACTS') === 'true';
    
    if (DEBUG_SHOW_ALL) {
      console.warn('[ContractListScreen] DEBUG MODE: Showing all contracts without filtering');
      return enrichedContracts;
    }
    
    const filtered = enrichedContracts.filter((contract) => {
      const participants = [
        contract.sellerId,
        contract.buyerId,
        contract.sellerName,
        contract.buyerName,
      ];
      const matches = participants.some((value) => {
        if (value == null) return false;
        const normalizedValue = String(value);
        const matches = normalizedValue === viewerKey;
        if (matches) {
          console.log('[ContractListScreen] Match found:', {
            contractId: contract.id,
            participant: normalizedValue,
            viewerKey,
          });
        }
        return matches;
      });
      return matches;
    });
    
    console.log('[ContractListScreen] Filtered contracts:', {
      count: filtered.length,
      contracts: filtered.map((c) => ({
        id: c.id,
        sellerId: c.sellerId,
        buyerId: c.buyerId,
        productId: c.productId,
        status: c.status,
      })),
    });
    
    return filtered;
  }, [contracts, viewerId, roomInfoMap]);

  const totalCount = viewerContracts.length;

  const statusCounts = useMemo(() => {
    return viewerContracts.reduce<Record<ContractStatus, number>>(
      (acc, contract) => {
        acc[contract.status] = (acc[contract.status] ?? 0) + 1;
        return acc;
      },
      Object.fromEntries(STATUS_ORDER.map((status) => [status, 0])) as Record<
        ContractStatus,
        number
      >
    );
  }, [viewerContracts]);

  const latestUpdatedAt = useMemo(() => {
    let latest: Date | null = null;

    viewerContracts.forEach((contract) => {
      if (!contract.updatedAt) return;
      const parsed = new Date(contract.updatedAt);
      if (Number.isNaN(parsed.getTime())) return;
      if (!latest || parsed.getTime() > latest.getTime()) {
        latest = parsed;
      }
    });

    return latest;
  }, [viewerContracts]);

  const filteredContracts = useMemo(() => {
    if (viewerContracts.length === 0) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return viewerContracts.filter((contract) => {
      const matchesStatus =
        selectedStatus === 'all' || contract.status === selectedStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        contract.summary ?? '',
        contract.id,
        contract.sellerId,
        contract.buyerId,
        contract.sellerName ?? '',
        contract.buyerName ?? '',
        contract.productId ? String(contract.productId) : '',
        contract.roomId ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [viewerContracts, searchTerm, selectedStatus]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const contractsForLog = viewerContracts.map((contract) => ({
      id: contract.id,
      roomId: contract.roomId,
      status: contract.status,
      sellerId: contract.sellerId,
      buyerId: contract.buyerId,
      updatedAt: contract.updatedAt,
    }));

    console.groupCollapsed('[ContractListScreen] viewerContracts snapshot');
    console.log('selectedStatus:', selectedStatus, 'searchTerm:', searchTerm);
    console.table(contractsForLog);
    console.log('statusCounts:', statusCounts);
    console.log('filteredContracts:', filteredContracts.map((c) => c.id));
    console.groupEnd();
  }, [viewerContracts, statusCounts, filteredContracts, selectedStatus, searchTerm]);

  const isFiltering =
    selectedStatus !== 'all' || searchTerm.trim().length > 0 || false;
  const showEmptyState =
    !isLoading &&
    !isFetching &&
    !error &&
    filteredContracts.length === 0 &&
    viewerContracts.length > 0;
  
  useEffect(() => {
    console.log('[ContractListScreen] Render conditions:', {
      isLoading,
      isFetching,
      hasError: !!error,
      filteredCount: filteredContracts.length,
      viewerCount: viewerContracts.length,
      totalCount,
      showEmptyState,
      isFiltering,
      selectedStatus,
      searchTerm,
    });
  }, [isLoading, isFetching, error, filteredContracts.length, viewerContracts.length, totalCount, showEmptyState, isFiltering, selectedStatus, searchTerm]);

  const formatLastUpdated = (value?: Date | string | null) => {
    if (!value) {
      return '업데이트 기록 없음';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (Number.isNaN(date.getTime())) {
      return '업데이트 기록 없음';
    }

    const datePart = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${datePart} ${timePart}`;
  };

  const formatContractId = (id: string | number) => {
    const idStr = String(id);
    if (idStr.length <= 8) {
      return idStr;
    }
    return `${idStr.slice(0, 4)}...${idStr.slice(-4)}`;
  };

  /**
   * 계약서 상태와 사용자 역할에 따라 적절한 페이지 URL을 결정합니다.
   */
  const getContractDetailUrl = (contract: ContractListItem): string | null => {
    if (!contract.roomId) {
      return `/contracts/${contract.id}`;
    }

    const isSeller = viewerId && contract.sellerId && String(contract.sellerId) === String(viewerId);
    const isBuyer = viewerId && contract.buyerId && String(contract.buyerId) === String(viewerId);

    switch (contract.status) {
      case ContractStatus.PENDING_BOTH:
        // 양측 서명 대기: 판매자만 수정 가능, 구매자는 접근 불가
        if (isSeller) {
          return `/contracts/edit?roomId=${contract.roomId}&sellerId=${contract.sellerId}&buyerId=${contract.buyerId}`;
        }
        // 구매자는 접근 불가
        return null;

      case ContractStatus.PENDING_SELLER:
        // 판매자 서명 대기: 판매자만 수정 가능, 구매자는 접근 불가
        if (isSeller) {
          return `/contracts/edit?roomId=${contract.roomId}&sellerId=${contract.sellerId}&buyerId=${contract.buyerId}`;
        }
        // 구매자는 접근 불가
        return null;

      case ContractStatus.PENDING_BUYER:
        // 구매자 서명 대기: 구매자만 서명/거절 가능, 판매자는 접근 불가
        if (isBuyer) {
          return `/contracts/sign?roomId=${contract.roomId}&buyerId=${contract.buyerId}&sellerId=${contract.sellerId}`;
        }
        // 판매자는 접근 불가
        return null;

      case ContractStatus.COMPLETED:
        // 서명 완료: PDF 다운로드 (URL이 아닌 핸들러로 처리)
        return null;

      default:
        return `/contracts/${contract.id}`;
    }
  };

  /**
   * PDF 다운로드 핸들러
   */
  const handleDownloadPdf = async (contract: ContractListItem) => {
    if (!contract.roomId) {
      console.error('[ContractListScreen] Cannot download PDF: roomId is missing');
      return;
    }

    try {
      const response = await api.contracts.detail({
        roomId: contract.roomId,
        responseType: 'pdf',
      });

      // responseType이 'pdf'일 때는 Blob이 반환됨
      if (!(response instanceof Blob)) {
        console.error('[ContractListScreen] Expected Blob but got:', typeof response);
        alert('PDF 다운로드에 실패했습니다.');
        return;
      }

      // Blob을 다운로드 링크로 변환
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${contract.roomId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ContractListScreen] Failed to download PDF:', error);
      alert('PDF 다운로드에 실패했습니다.');
    }
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSearchTerm('');
  };

  if (!viewerId) {
    return (
      <div className="w-full py-16">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-center px-5 py-24">
          <h2 className="text-2xl font-semibold text-[#222]">
            로그인 정보가 필요합니다.
          </h2>
          <p className="mt-2 text-sm text-[#767676]">
            다시 로그인한 뒤 계약서를 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-16">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5">
        <header className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#2487f8]">
            계약 진행 현황
          </span>
          <h1 className="text-3xl font-bold text-[#222] md:text-[36px]">
            나의 계약서
          </h1>
          <p className="text-sm text-[#767676] md:text-base">
            {totalCount > 0
              ? `총 ${totalCount}건의 계약서 중 원하는 조건을 빠르게 찾아보세요.`
              : '아직 등록된 계약서가 없습니다. 곧 생성될 계약서를 기다려 주세요.'}
          </p>
        </header>

        {!data?.success && data?.message && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {data.message}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2487f8]/10 text-[#2487f8]">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-[#222]">
                  총 {totalCount}건의 계약서
                </p>
                <span className="text-sm text-[#767676]">
                  최근 업데이트 {formatLastUpdated(latestUpdatedAt)}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="계약 번호, 요약, 참여자 검색"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#2487f8] focus:bg-white focus:ring-2 focus:ring-[#2487f8]/20"
                />
              </div>
              {isFiltering && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:border-[#2487f8] hover:text-[#2487f8]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  필터 초기화
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = selectedStatus === option.value;
              const count =
                option.value === 'all'
                  ? totalCount
                  : statusCounts[option.value as ContractStatus];

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={cn(
                    'group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                    isActive
                      ? 'border-[#2487f8] bg-[#2487f8] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#2487f8]/60 hover:text-[#2487f8]'
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      'inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-[#2487f8]/10 group-hover:text-[#2487f8]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <Card className="border border-red-100 bg-red-50/80 text-red-700">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500" />
                <div className="flex flex-col">
                  <span className="text-base font-semibold">
                    계약서를 불러오지 못했습니다.
                  </span>
                  <span className="text-sm text-red-600">
                    {error.message ?? '잠시 후 다시 시도해 주세요.'}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => refetch()}
                className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600"
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="min-h-[300px]">
          {(isLoading || isFetching) && viewerContracts.length === 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  className="border border-slate-200 bg-white/80 shadow-sm"
                >
                  <div className="animate-pulse space-y-5 p-6">
                    <div className="h-3 w-1/3 rounded-full bg-slate-200" />
                    <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
                    <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                        <div className="h-4 w-full rounded-lg bg-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                        <div className="h-4 w-full rounded-lg bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                  </div>
                </Card>
              ))}
            </div>
          ) : showEmptyState ? (
            <Card className="border border-slate-200 bg-white py-16 text-center shadow-sm">
              <CardContent className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2487f8]/10 text-[#2487f8]">
                  <Inbox className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-[#222]">
                  조건에 맞는 계약서를 찾지 못했어요.
                </h2>
                <p className="max-w-md text-sm text-[#767676]">
                  {isFiltering
                    ? '선택한 필터 조건을 조정해 보거나 검색어를 수정해 보세요.'
                    : '새로운 계약서가 생성되면 이곳에서 바로 확인할 수 있어요.'}
                </p>
                {isFiltering && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#2487f8] hover:text-[#2487f8]"
                  >
                    필터 초기화
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredContracts.map((contract: ContractListItem) => {
                const statusMeta = STATUS_CONFIG[contract.status];
                return (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    statusMeta={statusMeta}
                    formatContractId={formatContractId}
                    formatParticipant={formatParticipant}
                    formatLastUpdated={formatLastUpdated}
                    getContractDetailUrl={getContractDetailUrl}
                    handleDownloadPdf={handleDownloadPdf}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ContractListScreen;
