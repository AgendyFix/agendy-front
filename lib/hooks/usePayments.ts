// ============================================
// usePayments HOOK - Academy Module
// ============================================

import { useState, useCallback } from "react";
import { paymentsApi } from "../api/payments";
import type { Payment, PaymentSummary } from "../types/models";
import type {
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentListParams,
  PaymentSummaryParams,
} from "../types/api";

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchPayments = useCallback(
    async (params?: PaymentListParams & { page?: number }) => {
      try {
        setIsLoading(true);
        setError(null);
        const limit = 20;
        const page = params?.page || 1;
        const offset = (page - 1) * limit;
        const { page: _, ...restParams } = params || {};
        const response = await paymentsApi.getAll({ ...restParams, limit, offset });
        setPayments(response.results);
        setTotalCount(response.count);
        setHasNext(!!response.next);
        setHasPrevious(!!response.previous);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar pagos");
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Los vencidos vienen dentro del summary (unpaid_enrollments)
  const fetchSummary = useCallback(async (params?: PaymentSummaryParams) => {
    try {
      const data = await paymentsApi.getSummary(params);
      setSummary(data);
    } catch {
      // no bloqueante
    }
  }, []);

  const createPayment = async (data: CreatePaymentRequest): Promise<Payment> => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await paymentsApi.create(data);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar pago");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePayment = async (id: string, data: UpdatePaymentRequest): Promise<Payment> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await paymentsApi.update(id, data);
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar pago");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePayment = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await paymentsApi.delete(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al revertir pago");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    payments,
    summary,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchPayments,
    fetchSummary,
    createPayment,
    updatePayment,
    deletePayment,
  };
};
