/**
 * Game Data Storage Service
 * 
 * Features:
 * - Game data CRUD operations
 * - Batch operations
 * - Data validation
 * - Search and filtering
 */

import type { GameData } from '@/types/GameData.types';

export interface GameDataFilter {
  category?: string;
  platform?: string;
  rating?: { min?: number; max?: number };
  releaseDate?: { from?: string; to?: string };
  developer?: string;
  publisher?: string;
  genre?: string;
  ageRating?: string;
}

export interface GameDataQuery {
  filters?: GameDataFilter;
  search?: string;
  sortBy?: keyof GameData;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GameDataResult {
  games: GameData[];
  total: number;
  hasMore: boolean;
}

export class GameDataStorageService {
  private static storage: Map<string, GameData> = new Map();
  private static idCounter = 1;

  /**
   * Generate unique game ID
   */
  static generateId(): string {
    return `game_${Date.now()}_${this.idCounter++}`;
  }

  /**
   * Save a game
   */
  static async saveGame(gameData: Omit<GameData, 'id'> & { id?: string }): Promise<GameData> {
    const id = gameData.id || this.generateId();
    const game: GameData = {
      ...gameData,
      id
    };
    
    this.storage.set(id, game);
    return game;
  }

  /**
   * Get game by ID
   */
  static async getGameById(id: string): Promise<GameData | null> {
    return this.storage.get(id) || null;
  }

  /**
   * Update game
   */
  static async updateGame(id: string, updates: Partial<GameData>): Promise<GameData | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, id };
    this.storage.set(id, updated);
    return updated;
  }

  /**
   * Delete game
   */
  static async deleteGame(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  /**
   * Batch query games
   */
  static async batchQuery(ids: string[]): Promise<GameData[]> {
    const games: GameData[] = [];
    for (const id of ids) {
      const game = this.storage.get(id);
      if (game) {
        games.push(game);
      }
    }
    return games;
  }

  /**
   * Query games with filters
   */
  static async queryGames(query: GameDataQuery = {}): Promise<GameDataResult> {
    let games = Array.from(this.storage.values());

    // Apply filters
    if (query.filters) {
      games = this.applyFilters(games, query.filters);
    }

    // Apply search
    if (query.search) {
      games = this.applySearch(games, query.search);
    }

    // Apply sorting
    if (query.sortBy) {
      games = this.applySorting(games, query.sortBy, query.sortOrder || 'asc');
    }

    const total = games.length;

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || total;
    const paginatedGames = games.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      games: paginatedGames,
      total,
      hasMore
    };
  }

  /**
   * Get all games
   */
  static async getAllGames(): Promise<GameData[]> {
    return Array.from(this.storage.values());
  }

  /**
   * Clear all data
   */
  static async clearAll(): Promise<void> {
    this.storage.clear();
    this.idCounter = 1;
  }

  /**
   * Get storage stats
   */
  static getStats(): {
    totalGames: number;
    categories: Record<string, number>;
    platforms: Record<string, number>;
    averageRating: number;
  } {
    const games = Array.from(this.storage.values());
    const categories: Record<string, number> = {};
    const platforms: Record<string, number> = {};
    let totalRating = 0;
    let ratedGames = 0;

    games.forEach(game => {
      if (game.category) {
        categories[game.category] = (categories[game.category] || 0) + 1;
      }
      if (game.platform) {
        platforms[game.platform] = (platforms[game.platform] || 0) + 1;
      }
      if (typeof game.rating === 'number') {
        totalRating += game.rating;
        ratedGames++;
      }
    });

    return {
      totalGames: games.length,
      categories,
      platforms,
      averageRating: ratedGames > 0 ? totalRating / ratedGames : 0
    };
  }

  private static applyFilters(games: GameData[], filters: GameDataFilter): GameData[] {
    return games.filter(game => {
      if (filters.category && game.category !== filters.category) return false;
      if (filters.platform && game.platform !== filters.platform) return false;
      if (filters.developer && game.developer !== filters.developer) return false;
      if (filters.publisher && game.publisher !== filters.publisher) return false;
      if (filters.genre && game.genre !== filters.genre) return false;
      if (filters.ageRating && game.ageRating !== filters.ageRating) return false;
      
      if (filters.rating) {
        if (filters.rating.min && typeof game.rating === 'number' && game.rating < filters.rating.min) return false;
        if (filters.rating.max && typeof game.rating === 'number' && game.rating > filters.rating.max) return false;
      }
      
      if (filters.releaseDate) {
        const releaseDate = new Date(game.releaseDate);
        if (filters.releaseDate.from && releaseDate < new Date(filters.releaseDate.from)) return false;
        if (filters.releaseDate.to && releaseDate > new Date(filters.releaseDate.to)) return false;
      }

      return true;
    });
  }

  private static applySearch(games: GameData[], search: string): GameData[] {
    const searchLower = search.toLowerCase();
    return games.filter(game => {
      return (
        game.name.toLowerCase().includes(searchLower) ||
        game.description?.toLowerCase().includes(searchLower) ||
        game.developer?.toLowerCase().includes(searchLower) ||
        game.publisher?.toLowerCase().includes(searchLower) ||
        game.category?.toLowerCase().includes(searchLower) ||
        game.genre?.toLowerCase().includes(searchLower) ||
        game.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  }

  private static applySorting(games: GameData[], sortBy: keyof GameData, sortOrder: 'asc' | 'desc'): GameData[] {
    return games.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === bValue) return 0;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}