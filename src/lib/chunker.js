/**
 * A recursive character text splitter.
 * It tries to split on double newlines, then single newlines, then periods, then spaces, and finally characters.
 */
export class RecursiveCharacterTextSplitter {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    // Default separators from largest to smallest context boundary
    this.separators = options.separators || ["\n\n", "\n", ". ", " ", ""];
  }

  /**
   * Split text into chunks
   * @param {string} text 
   * @returns {string[]}
   */
  splitText(text) {
    if (typeof text !== 'string') text = String(text);
    const finalChunks = [];
    let separator = this.separators[this.separators.length - 1];
    
    // Find the appropriate separator for this block of text
    for (const sep of this.separators) {
      if (sep === "") {
        separator = sep;
        break;
      }
      if (text.includes(sep)) {
        separator = sep;
        break;
      }
    }

    const splits = text.split(separator);
    let currentChunk = [];
    let currentLength = 0;

    for (const split of splits) {
      const splitLength = split.length + (separator === "" ? 0 : separator.length);
      
      // If a single split is larger than the chunk size, we need to recurse
      if (splitLength > this.chunkSize) {
        // Yield current chunk if it has content
        if (currentChunk.length > 0) {
          const joinedChunk = currentChunk.join(separator);
          if (joinedChunk.trim()) {
            finalChunks.push(joinedChunk.trim());
          }
          currentChunk = [];
          currentLength = 0;
        }

        // Recurse on the large split if we aren't at the character level separator
        if (separator !== "") {
          const nextSeparators = this.separators.slice(this.separators.indexOf(separator) + 1);
          const subSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.chunkSize,
            chunkOverlap: this.chunkOverlap,
            separators: nextSeparators
          });
          const subChunks = subSplitter.splitText(split);
          finalChunks.push(...subChunks);
        } else {
          // If we are at character level, just force split
          for (let i = 0; i < split.length; i += this.chunkSize) {
            finalChunks.push(split.substring(i, i + this.chunkSize));
          }
        }
        continue;
      }

      // If adding this split exceeds chunk size, finish the current chunk
      if (currentLength + splitLength > this.chunkSize && currentChunk.length > 0) {
        const joinedChunk = currentChunk.join(separator);
        if (joinedChunk.trim()) {
          finalChunks.push(joinedChunk.trim());
        }
        
        // Handle overlap: start new chunk with the last few items from previous chunk
        // We backtrack until the currentLength is within the overlap size
        let overlapLength = 0;
        const overlapChunk = [];
        for (let i = currentChunk.length - 1; i >= 0; i--) {
          const itemLen = currentChunk[i].length + (separator === "" ? 0 : separator.length);
          if (overlapLength + itemLen > this.chunkOverlap) {
            break;
          }
          overlapChunk.unshift(currentChunk[i]);
          overlapLength += itemLen;
        }
        
        currentChunk = [...overlapChunk, split];
        currentLength = overlapLength + splitLength;
      } else {
        currentChunk.push(split);
        currentLength += splitLength;
      }
    }

    if (currentChunk.length > 0) {
      const joinedChunk = currentChunk.join(separator);
      if (joinedChunk.trim()) {
        finalChunks.push(joinedChunk.trim());
      }
    }

    return finalChunks;
  }
}
