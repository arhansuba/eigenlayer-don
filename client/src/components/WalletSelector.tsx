"use client";

import {
  AnyAptosWallet,
  WalletItem,
  isInstallRequired,
  partitionWallets,
  truncateAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { ChevronDown, Copy, LogOut, User } from "lucide-react";
import { Key, useCallback, useState } from "react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "./ui/use-toast";

const APTOS_CONNECT_ACCOUNT_URL = "https://aptosconnect.com/account";

interface WalletRowProps {
  wallet: AnyAptosWallet;
  onConnect: () => void;
}

export function WalletSelector() {
  // ... (rest of the code remains the same)
}

interface ConnectWalletDialogProps {
  close: () => void;
}

function ConnectWalletDialog({ close }: ConnectWalletDialogProps) {
  const { wallets = [] } = useWallet();

  const {
    defaultWallets,
    moreWallets,
  } = partitionWallets(wallets);

  return (
    <DialogContent className="max-h-screen overflow-auto">
      <DialogHeader className="flex flex-col items-center">
        <DialogTitle className="flex flex-col text-center leading-snug">
          <span>Log in or sign up</span>
          <span>with Social + Aptos Connect</span>
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 pt-3">
        {defaultWallets.map((wallet: { name: Key | null | undefined; }) => (
          <AptosConnectWalletRow
            key={wallet.name}
            wallet={wallet}
            onConnect={close}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 pt-4 text-muted-foreground">
        <div className="h-px w-full bg-secondary" />
        Or
        <div className="h-px w-full bg-secondary" />
      </div>
      <div className="flex flex-col gap-3 pt-3">
        {defaultWallets.map((wallet) => (
          <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
        ))}
        {!!moreWallets.length && (
          <Collapsible className="flex flex-col gap-3">
            <CollapsibleTrigger asChild>
              <Button className="gap-2">
                More wallets <ChevronDown />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3">
              {moreWallets.map((wallet) => (
                <WalletRow
                  key={wallet.name}
                  wallet={wallet}
                  onConnect={close}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </DialogContent>
  );
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border rounded-md"
    >
      <div className="flex items-center gap-4">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-base font-normal" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button asChild>
          <WalletItem.InstallLink />
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button>Connect</Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}
function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect}>
      <WalletItem.ConnectButton asChild>
        <Button className="w-full gap-4 outline">
          <WalletItem.Icon className="h-5 w-5" />
          <WalletItem.Name className="text-base font-normal" />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}
