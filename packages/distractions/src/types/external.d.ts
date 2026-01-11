/**
 * Type declarations for external modules without TypeScript definitions
 */

declare module 'sentence-similarity' {
  interface SimilarityOptions {
    f: (s1: string, s2: string) => number
    options: { threshold: number }
  }

  interface SimilarityResult {
    score: number
    order: number
    size: number
  }

  export default function similarity(
    s1: string[],
    s2: string[],
    options: SimilarityOptions
  ): SimilarityResult
}

declare module 'similarity-score' {
  export const winklerMetaphone: (s1: string, s2: string) => number
}
