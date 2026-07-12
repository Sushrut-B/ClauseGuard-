export const semanticChunker = (text: string): string[] => {
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n');
  
  // Regex pattern to split on major sections and numbered clauses
  // We use positive lookahead to keep the section headers with the corresponding text
  const pattern = /(?=\n\s*(?:Section|Article|Clause)\s+[A-Z0-9]+)|(?=\n\s*(?:\d+\.\d+|\d+\.)\s+)|(?=\n\s*[A-Z\s]{4,}(?::|\n))/gi;
  
  const rawChunks = normalized.split(pattern);
  const chunks: string[] = [];
  
  for (let chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    
    // Fallback: If a section chunk is still excessively long (> 2000 chars),
    // split it on double newlines (paragraphs) to maintain tight retrieval units.
    if (trimmed.length > 2000) {
      const paragraphs = trimmed.split(/\n\n+/g);
      let currentChunk = "";
      
      for (let p of paragraphs) {
        p = p.trim();
        if (!p) continue;
        if ((currentChunk + "\n\n" + p).length > 2000) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = p;
        } else {
          currentChunk = currentChunk ? currentChunk + "\n\n" + p : p;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
    } else {
      chunks.push(trimmed);
    }
  }
  
  return chunks.length > 0 ? chunks : [text.trim()];
}
