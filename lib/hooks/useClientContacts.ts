// ============================================
// USE CLIENT CONTACTS HOOK
// ============================================

"use client";

import { useState, useCallback } from "react";
import { clientContactsApi } from "@/lib/api/clientContacts";
import type { ClientContact } from "@/lib/types/models";
import type { CreateClientContactRequest, UpdateClientContactRequest } from "@/lib/api/clientContacts";

interface UseClientContactsReturn {
  contacts: ClientContact[];
  isLoading: boolean;
  /** Carga los contactos de un alumno específico */
  fetchContacts: (clientId: string) => Promise<void>;
  /** Crea un contacto y lo añade al estado local */
  createContact: (data: CreateClientContactRequest) => Promise<ClientContact>;
  /** Edita un contacto y actualiza el estado local */
  updateContact: (id: string, data: UpdateClientContactRequest) => Promise<ClientContact>;
  /** Elimina (soft-delete) un contacto y lo remueve del estado local */
  deleteContact: (id: string) => Promise<void>;
}

export function useClientContacts(): UseClientContactsReturn {
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContacts = useCallback(async (clientId: string) => {
    try {
      setIsLoading(true);
      const response = await clientContactsApi.getAll({ client: clientId, limit: 50 });
      setContacts(response.results);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContact = useCallback(async (data: CreateClientContactRequest): Promise<ClientContact> => {
    const created = await clientContactsApi.create(data);
    setContacts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateContact = useCallback(async (id: string, data: UpdateClientContactRequest): Promise<ClientContact> => {
    const updated = await clientContactsApi.update(id, data);
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    await clientContactsApi.delete(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    contacts,
    isLoading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
