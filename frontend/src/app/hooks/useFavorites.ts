'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Carregar favoritos
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getFavoriteCaregivers();
      const ids = data
        .map((item: any) => item?._id || item?.caregiverId)
        .filter(Boolean);

      setFavoriteIds(new Set(ids));
      console.log('✅ Favoritos carregados:', ids.length);
    } catch (error) {
      console.error('❌ Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle (Adicionar ou Remover)
  const toggleFavorite = useCallback(async (caregiverId: string) => {
    if (!caregiverId) return;

    const isCurrentlyFavorited = favoriteIds.has(caregiverId);

    console.log(`🔄 Toggle favorito: ${caregiverId} | Atual: ${isCurrentlyFavorited ? 'Favoritado' : 'Não favoritado'}`);

    // Atualização otimista
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFavorited) newSet.delete(caregiverId);
      else newSet.add(caregiverId);
      return newSet;
    });

    try {
      if (isCurrentlyFavorited) {
        await api.removeFavoriteCaregiver(caregiverId);
        console.log(`✅ Removido dos favoritos com sucesso`);
      } else {
        await api.favoriteCaregiver(caregiverId);
        console.log(`✅ Adicionado aos favoritos com sucesso`);
      }
    } catch (error: any) {
      console.error('❌ ERRO NO TOGGLE:', error?.response?.data || error?.message || error);

      // Reverte a mudança visual em caso de erro
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyFavorited) newSet.add(caregiverId);
        else newSet.delete(caregiverId);
        return newSet;
      });

      alert('Erro ao atualizar favorito. Verifique o console.');
    }
  }, [favoriteIds]);

  const isFavorited = useCallback((caregiverId: string) => {
    return favoriteIds.has(caregiverId);
  }, [favoriteIds]);

  const refresh = useCallback(() => loadFavorites(), [loadFavorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    isFavorited,
    toggleFavorite,
    removeFavorite: toggleFavorite, // Podemos reutilizar o toggle para remover também
    loading,
    refresh,
  };
}