'use client';

import React from 'react';
import { useContracts } from '@/hooks/useContracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractListItem } from '@/types/contract';

const ContractListScreen = () => {
  const { data, error, isLoading } = useContracts();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Contracts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.contracts.map((contract: ContractListItem) => (
          <Card key={contract.id}>
            <CardHeader>
              <CardTitle>Contract #{contract.id.substring(0, 8)}...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status: {contract.status}</p>
              <p>Summary: {contract.summary}</p>
              <p>Last updated: {contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString() : 'N/A'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContractListScreen;
