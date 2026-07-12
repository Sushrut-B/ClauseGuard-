export interface RetrievalResult {
  chunk: string
  score: number
  index: number
}

// Simple tokenization (removes punctuation, lowercases, splits by space)
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 0)
}

export const retrieveChunks = (
  query: string,
  chunks: string[],
  topK: number = 2
): RetrievalResult[] => {
  const numDocs = chunks.length
  if (numDocs === 0) return []

  const tokenizedDocs = chunks.map(tokenize)
  const tokenizedQuery = tokenize(query)

  if (tokenizedQuery.length === 0) {
    return chunks.slice(0, topK).map((chunk, i) => ({ chunk, score: 0, index: i }))
  }

  // 1. Build document frequency (DF) dictionary for all terms in chunks
  const df: Record<string, number> = {}
  tokenizedDocs.forEach((docTokens) => {
    const uniqueTokens = new Set(docTokens)
    uniqueTokens.forEach((t) => {
      df[t] = (df[t] || 0) + 1
    })
  })

  // 2. Calculate IDF for each term
  const idf: Record<string, number> = {}
  for (const term in df) {
    // Add smoothing to prevent division by zero
    idf[term] = Math.log(1 + (numDocs / df[term]))
  }

  // 3. Compute TF-IDF for document chunks
  const docVectors = tokenizedDocs.map((docTokens) => {
    const tf: Record<string, number> = {}
    docTokens.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1
    })

    const tfIdf: Record<string, number> = {}
    for (const term in tf) {
      if (idf[term]) {
        tfIdf[term] = tf[term] * idf[term]
      }
    }
    return tfIdf
  })

  // 4. Compute TF-IDF for query
  const queryVector: Record<string, number> = {}
  const queryTf: Record<string, number> = {}
  tokenizedQuery.forEach((t) => {
    queryTf[t] = (queryTf[t] || 0) + 1
  })

  for (const term in queryTf) {
    if (idf[term]) {
      queryVector[term] = queryTf[term] * idf[term]
    }
  }

  // Helper to compute vector magnitude
  const getMagnitude = (vec: Record<string, number>): number => {
    let sum = 0
    for (const term in vec) {
      sum += vec[term] * vec[term]
    }
    return Math.sqrt(sum)
  }

  const queryMag = getMagnitude(queryVector)

  // 5. Calculate Cosine Similarity for each chunk
  const results: RetrievalResult[] = chunks.map((chunk, i) => {
    const docVector = docVectors[i]
    const docMag = getMagnitude(docVector)

    if (queryMag === 0 || docMag === 0) {
      return { chunk, score: 0, index: i }
    }

    // Dot product
    let dotProduct = 0
    for (const term in queryVector) {
      if (docVector[term]) {
        dotProduct += queryVector[term] * docVector[term]
      }
    }

    const score = dotProduct / (queryMag * docMag)
    return { chunk, score, index: i }
  })

  // 6. Rank by score descending and return top K
  return results.sort((a, b) => b.score - a.score).slice(0, topK)
}
