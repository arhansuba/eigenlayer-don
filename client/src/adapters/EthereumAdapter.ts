import { ethers } from 'ethers';
import { BlockchainAdapter } from '../interfaces/BlockchainAdapter';

export class EthereumAdapter implements BlockchainAdapter {
  private provider: ethers.providers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async getLatestBlock() {
    return this.provider.getBlock('latest');
  }

  async sendTransaction(tx: any) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    const transaction = await wallet.sendTransaction(tx);
    return transaction.hash;
  }

  async callContract(address: string, method: string, params: any[]) {
    const contract = new ethers.Contract(address, ['function ' + method], this.provider);
    return contract[method](...params);
  }

  subscribeToEvents(address: string, eventName: string, callback: (event: any) => void) {
    const contract = new ethers.Contract(address, ['event ' + eventName], this.provider);
    contract.on(eventName, callback);
  }
}
