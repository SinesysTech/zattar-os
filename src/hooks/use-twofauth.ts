"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { TwoFAuthAccount, OTPResult } from "@/lib/integrations/twofauth/types";

export type { TwoFAuthAccount, OTPResult };

/**
 * Estado do hook
 */
export interface UseTwoFAuthState {
  accounts: TwoFAuthAccount[];
  isLoading: boolean;
  error: string | null;
  isPermissionError: boolean;
  selectedAccount: TwoFAuthAccount | null;
  currentOTP: OTPResult | null;
  otpLoading: boolean;
  otpError: string | null;
  timeRemaining: number;
}

/**
 * Retorno do hook
 */
export interface UseTwoFAuthReturn extends UseTwoFAuthState {
  fetchAccounts: () => Promise<void>;
  selectAccount: (account: TwoFAuthAccount | null) => void;
  fetchOTP: (accountId: number) => Promise<OTPResult | null>;
  copyOTPToClipboard: () => Promise<boolean>;
}

/**
 * Hook para gerenciar contas 2FAuth e códigos OTP
 *
 * @example
 * ```tsx
 * function AuthenticatorPopover() {
 *   const {
 *     accounts,
 *     isLoading,
 *     selectedAccount,
 *     currentOTP,
 *     timeRemaining,
 *     fetchAccounts,
 *     selectAccount,
 *     copyOTPToClipboard,
 *   } = useTwoFAuth();
 *
 *   useEffect(() => {
 *     fetchAccounts();
 *   }, [fetchAccounts]);
 *
 *   return (
 *     // ...
 *   );
 * }
 * ```
 */
export function useTwoFAuth(): UseTwoFAuthReturn {
  const [accounts, setAccounts] = useState<TwoFAuthAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<TwoFAuthAccount | null>(null);
  const [currentOTP, setCurrentOTP] = useState<OTPResult | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isPermissionError, setIsPermissionError] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const _permissionErrorRef = useRef(false);

  // Buscar lista de contas
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsPermissionError(false);

    try {
      const response = await fetch("/api/twofauth/accounts");
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        if (isMountedRef.current) {
          setIsPermissionError(true);
        }
        throw new Error(data.error || "Não autorizado. Verifique as configurações de API.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar contas");
      }

      if (isMountedRef.current) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Buscar OTP de uma conta específica
  const fetchOTP = useCallback(async (accountId: number): Promise<OTPResult | null> => {
    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`/api/twofauth/accounts/${accountId}/otp`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar OTP");
      }

      const otpResult: OTPResult = data.data;

      if (isMountedRef.current) {
        setCurrentOTP(otpResult);
        const period = selectedAccount?.period || 30;
        const now = Math.floor(Date.now() / 1000);
        setTimeRemaining(period - (now % period));
      }

      return otpResult;
    } catch (err) {
      if (isMountedRef.current) {
        setOtpError(err instanceof Error ? err.message : "Erro desconhecido");
        setCurrentOTP(null);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setOtpLoading(false);
      }
    }
  }, [selectedAccount]);

  // Selecionar uma conta (e automaticamente buscar OTP)
  const selectAccount = useCallback(
    (account: TwoFAuthAccount | null) => {
      setSelectedAccount(account);
      setCurrentOTP(null);
      setOtpError(null);

      if (account) {
        fetchOTP(account.id);
      }
    },
    [fetchOTP]
  );

  // Copiar OTP para clipboard
  const copyOTPToClipboard = useCallback(async (): Promise<boolean> => {
    if (!currentOTP?.password) return false;

    try {
      await navigator.clipboard.writeText(currentOTP.password);
      return true;
    } catch {
      return false;
    }
  }, [currentOTP]);

  // Timer para countdown do OTP (atualiza a cada segundo)
  useEffect(() => {
    if (selectedAccount && currentOTP) {
      // Limpar timer anterior
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Calcular tempo restante baseado no período TOTP (padrão 30s)
      const period = selectedAccount.period || 30;
      const now = Math.floor(Date.now() / 1000);
      const initialRemaining = period - (now % period);
      setTimeRemaining(initialRemaining);

      // Iniciar countdown
      timerRef.current = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const remaining = period - (currentTime % period);
        setTimeRemaining(remaining);

        // Quando o tempo acabar, buscar novo OTP
        if (remaining === period && selectedAccount) {
          fetchOTP(selectedAccount.id);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedAccount, currentOTP, fetchOTP]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    accounts,
    isLoading,
    error,
    isPermissionError,
    selectedAccount,
    currentOTP,
    otpLoading,
    otpError,
    timeRemaining,
    fetchAccounts,
    selectAccount,
    fetchOTP,
    copyOTPToClipboard,
  };
}
