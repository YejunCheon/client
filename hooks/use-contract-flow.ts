import { useState } from 'react';
import type { ContractDraft, ContractStatus } from '@/types';

export function useContractFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [contract, setContract] = useState<ContractDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const updateContract = (updates: Partial<ContractDraft>) => {
    setContract((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updateStatus = (status: ContractStatus) => {
    setContract((prev) => (prev ? { ...prev, status } : null));
  };

  return {
    currentStep,
    contract,
    loading,
    error,
    setLoading,
    setError,
    nextStep,
    prevStep,
    updateContract,
    updateStatus,
  };
}

