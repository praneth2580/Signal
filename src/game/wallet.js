import { storage } from "../common/storage.js";

const WALLET_KEY = "wallet";
const RECEIPTS_KEY = "payoutReceipts";
const EMPTY = { balance: 0, earned: 0, spent: 0 };

export function getWallet() {
  const saved = storage.get(WALLET_KEY, EMPTY);
  return {
    balance: Number(saved?.balance) || 0,
    earned: Number(saved?.earned) || 0,
    spent: Number(saved?.spent) || 0,
  };
}

export function creditWallet(amount, receiptId) {
  const value = Math.max(0, Math.round(amount));
  if (value <= 0) return getWallet();

  if (receiptId) {
    const receipts = storage.get(RECEIPTS_KEY, []);
    if (Array.isArray(receipts) && receipts.includes(receiptId)) {
      return getWallet();
    }
    storage.set(RECEIPTS_KEY, [...(receipts || []), receiptId].slice(-80));
  }

  const current = getWallet();
  const next = {
    balance: current.balance + value,
    earned: current.earned + value,
    spent: current.spent,
  };
  storage.set(WALLET_KEY, next);
  return next;
}

export function spendWallet(amount) {
  const value = Math.max(0, Math.round(amount));
  const current = getWallet();
  if (value <= 0 || current.balance < value) return null;

  const next = {
    balance: current.balance - value,
    earned: current.earned,
    spent: current.spent + value,
  };
  storage.set(WALLET_KEY, next);
  return next;
}

/** Max cash for a solved case. Shrinks as elapsed time approaches allotted time. */
export function calculatePayout({ accurate, elapsedMs, allottedMs, maxPay = 200 }) {
  if (!accurate || !allottedMs || allottedMs <= 0) return 0;
  const remaining = Math.max(0, 1 - elapsedMs / allottedMs);
  const ceiling = Math.max(0, Number(maxPay) || 200);
  return Math.round(ceiling * remaining);
}
