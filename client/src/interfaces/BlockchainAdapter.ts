export interface BlockchainAdapter {
    getLatestBlock(): Promise<any>;
    sendTransaction(tx: any): Promise<string>;
    callContract(address: string, method: string, params: any[]): Promise<any>;
    subscribeToEvents(address: string, eventName: string, callback: (event: any) => void): void;
  }