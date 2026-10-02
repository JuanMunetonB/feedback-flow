import { create } from 'zustand'

// Definimos la estructura de nuestro estado
interface VoteState {
  optimisticVotes: Record<string, number>; // Ej: { 'idea-id-1': 1, 'idea-id-2': 1 }
  addLocalVote: (ideaId: string) => void;
}

export const useVoteStore = create<VoteState>((set) => ({
  optimisticVotes: {},
  // Esta función suma 1 al contador local de una idea específica
  addLocalVote: (ideaId) => set((state) => ({
    optimisticVotes: {
      ...state.optimisticVotes,
      [ideaId]: 1 
    }
  }))
}))