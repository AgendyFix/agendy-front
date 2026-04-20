// ============================================
// USE DISCIPLINES HOOK
// ============================================

"use client";

import { useState, useCallback, useRef } from "react";
import { disciplinesApi } from "@/lib/api/disciplines";
import type { Discipline } from "@/lib/types/models";

interface UseDisciplinesReturn {
  disciplines: Discipline[];
  isLoading: boolean;
  /** Carga el catálogo completo (paginado hasta 200). Idempotente si ya fue cargado. */
  fetchDisciplines: (force?: boolean) => Promise<void>;
  /** Crea una disciplina y la agrega al estado local. Retorna la nueva disciplina. */
  createDiscipline: (name: string) => Promise<Discipline>;
  /** Actualiza una disciplina en la lista local. */
  updateDiscipline: (id: string, name: string) => Promise<Discipline>;
  /** Elimina (soft-delete) una disciplina y la remueve de la lista local. */
  deleteDiscipline: (id: string) => Promise<void>;
}

export function useDisciplines(): UseDisciplinesReturn {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchDisciplines = useCallback(async (force = false) => {
    if (hasFetched.current && !force) return;
    try {
      setIsLoading(true);
      const response = await disciplinesApi.getAll({ ordering: "name", limit: 200 });
      setDisciplines(response.results);
      hasFetched.current = true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDiscipline = useCallback(async (name: string): Promise<Discipline> => {
    const created = await disciplinesApi.create({ name: name.trim() });
    setDisciplines((prev) => {
      // Insertar en orden alfabético
      const next = [...prev, created];
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
    });
    return created;
  }, []);

  const updateDiscipline = useCallback(async (id: string, name: string): Promise<Discipline> => {
    const updated = await disciplinesApi.update(id, { name: name.trim() });
    setDisciplines((prev) =>
      prev.map((d) => (d.id === id ? updated : d))
    );
    return updated;
  }, []);

  const deleteDiscipline = useCallback(async (id: string): Promise<void> => {
    await disciplinesApi.delete(id);
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    disciplines,
    isLoading,
    fetchDisciplines,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
  };
}
