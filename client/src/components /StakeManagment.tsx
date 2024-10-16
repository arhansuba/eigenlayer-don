import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchValidatorData, stakeTokens, unstakeTokens } from '../api/stakeManagement';

const StakeForm = () => {
  const [amount, setAmount] = useState('');
  const stakeMutation = useMutation(stakeTokens);
  const unstakeMutation = useMutation(unstakeTokens);

  const handleStake = () => stakeMutation.mutate(amount);
  const handleUnstake = () => unstakeMutation.mutate(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Stake</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="number"
          value={amount}
          onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setAmount(e.target.value)}
          placeholder="Amount to stake/unstake"
        />
        <div className="mt-4 space-x-2">
          <Button onClick={handleStake}>Stake</Button>
          <Button onClick={handleUnstake} variant="outline">Unstake</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ValidatorList = () => {
  const { data, isLoading, error } = useQuery('validators', fetchValidatorData);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching validator data</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validators</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {data.map((validator: { address: string; stake: number; performance: number; }) => (
            <li key={validator.address}>
              {validator.address} - Stake: {validator.stake} - Performance: {validator.performance.toFixed(2)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const StakeManagement = () => {
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