import { create } from "zustand";

import { apiFetch } from "@/shared/lib/api";

export interface AccountResponse {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
  status: string;
}

export interface TransactionResponse {
  id: string;
  name: string;
  note: string | null;
  amount: number;
  incoming: boolean;
  color: string | null;
}

interface PageResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  nextCursor: string | null;
}

interface WalletState {
  account: AccountResponse | null;
  transactions: TransactionResponse[];
  isLoading: boolean;
  error: string | null;

  fetchWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  account: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const [accounts, transactionsPage] = await Promise.all([
        apiFetch<AccountResponse[]>("/wallets"),
        apiFetch<PageResponse<TransactionResponse>>("/transactions"),
      ]);

      set({
        account: accounts[0] ?? null,
        transactions: transactionsPage.data,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "No se pudo cargar tu billetera.",
      });
    }
  },
}));
