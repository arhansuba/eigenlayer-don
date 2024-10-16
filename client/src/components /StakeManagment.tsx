import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";

interface Validator {
  address: string;
  stake: number;
  performance: number;
}

// Placeholder functions for API calls
const fetchValidatorData = async (): Promise<Validator[]> => {
  // This should be replaced with actual API call
  return [
    { address: '0x123...', stake: 100, performance: 0.95 },
    { address: '0x456...', stake: 200, performance: 0.98 },
  ];
};

const stakeTokens = async (amount: string): Promise<void> => {
  // This should be replaced with actual API call
  console.log(`Staking ${amount} tokens`);
};

const unstakeTokens = async (amount: string): Promise<void> => {
  // This should be replaced with actual API call
  console.log(`Unstaking ${amount} tokens`);
};

const StakeForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const stakeMutation = useMutation(stakeTokens, {
    onSuccess: () => {
      queryClient.invalidateQueries('validators');
      setAmount('');
    },
  });

  const unstakeMutation = useMutation(unstakeTokens, {
    onSuccess: () => {
      queryClient.invalidateQueries('validators');
      setAmount('');
    },
  });

  const handleStake = () => {
    if (!amount || isNaN(Number(amount))) {
      alert('Please enter a valid amount');
      return;
    }
    stakeMutation.mutate(amount);
  };

  const handleUnstake = () => {
    if (!amount || isNaN(Number(amount))) {
      alert('Please enter a valid amount');
      return;
    }
    unstakeMutation.mutate(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Stake</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="number"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="Amount to stake/unstake"
        />
        <div className="mt-4 space-x-2">
          <Button onClick={handleStake} disabled={stakeMutation.isLoading}>
            {stakeMutation.isLoading ? 'Staking...' : 'Stake'}
          </Button>
          <Button onClick={handleUnstake} variant="outline" disabled={unstakeMutation.isLoading}>
            {unstakeMutation.isLoading ? 'Unstaking...' : 'Unstake'}
          </Button>
        </div>
        {(stakeMutation.isError || unstakeMutation.isError) && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              An error occurred while processing your request.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const ValidatorList: React.FC = () => {
  const { data, isLoading, error } = useQuery<Validator[], Error>('validators', fetchValidatorData);

  if (isLoading) return <div>Loading validators...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Error fetching validator data</AlertDescription></Alert>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validators</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul>
            {data.map((validator) => (
              <li key={validator.address} className="mb-2">
                <strong>{validator.address}</strong>
                <br />
                Stake: {validator.stake.toFixed(2)}
                <br />
                Performance: {validator.performance.toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No validators found.</p>
        )}
      </CardContent>
    </Card>
  );
};

const StakeManagement: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Stake Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StakeForm />
        <ValidatorList />
      </div>
    </div>
  );
};

export default StakeManagement;