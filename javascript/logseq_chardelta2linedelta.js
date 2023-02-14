diff_blocksToChars_ = function(text1, text2) {
    var blockArray = [];  // e.g. blockArray[4] == 'Hello\n'
    var blockHash = {};   // e.g. blockHash['Hello\n'] == 4

    const blockRegex = /^\s*-\s/;
    const indentRegex = /^(\s*)/;
  
    // '\x00' is a valid character, but various debuggers don't like it.
    // So we'll insert a junk entry to avoid generating a null character.
    blockArray[0] = '';
  
    /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one block.
     * Modifies blockarray and blockhash through being a closure.
     * @param {string} text String to encode.
     * @return {string} Encoded string.
     * @private
     */
    function diff_blocksToCharsMunge_(text) {
      var chars = '';
      // Walk the text, pulling out a substring for each block.
      // text.split('\n') would would temporarily double our memory footprint.
      // Modifying text would create many large strings to garbage collect.
      var lineStart = 0;
      var lineEnd = -1;
      // Keeping our own length variable is faster than looking it up.
      var blockArrayLength = blockArray.length;
      let blockLines = []
      const indents = []
      while (lineEnd < text.length - 1) {
        lineEnd = text.indexOf('\n', lineStart);
        if (lineEnd == -1) {
          lineEnd = text.length - 1;
        }
        var line = text.substring(lineStart, lineEnd + 1); // \n is included
        const indent = indentRegex.exec(line)[0]
        indents.push(indent); // keep only the indent
        newblocks = []
        if (blockRegex.exec(line) && lineStart != 0){ // It's a new block, cut previous block
            newblocks.push(blockLines.join(''));
            blockLines = [];
        }
        blockLines.push(line.substring(indent.length ,line.length)); // Remove indent
        if (lineEnd == text.length - 1){ // Hit the end of the text, cut current block
            newblocks.push(blockLines.join('')+"\n");
        }

        lineStart = lineEnd + 1;
        
        for (const block of newblocks){
            if (blockHash.hasOwnProperty ? blockHash.hasOwnProperty(block) :
                (blockHash[block] !== undefined)) {
            chars += String.fromCharCode(blockHash[block]);
            } else {
            chars += String.fromCharCode(blockArrayLength);
            blockHash[block] = blockArrayLength;
            blockArray[blockArrayLength++] = block;
            }}
      }
      return [chars, indents];
    }
  
    const [chars1, indents1] = diff_blocksToCharsMunge_(text1);
    const [chars2, indents2] = diff_blocksToCharsMunge_(text2);
    return {chars1: chars1, chars2: chars2, blockArray: blockArray, indents1: indents1, indents2: indents2};
  };


/**
 * The golden standard of indentation is the blockIndentsTar
 */
diff_charsToBlocks_ = function(diffs, blockArray, blockIndentsOri, blockIndentsTar) {
    console.log(blockArray)
    const originBlockBasedDiffs = []
    let blockIndentsOriPtr = -1, blockIndentsTarPtr = -1;
    for (var x = 0; x < diffs.length; x++) {
      const op = diffs[x][0];  // Operation (delete, equal, insert) = (-1, 0, 1)
      var chars = diffs[x][1];
      if (op != 1){
        for (var y = 0; y < chars.length; y++) {
            let opAndBlockContent = undefined;
            if (op == 0){ // op == KEEP, the new indent is the gold standard
                blockIndentsOriPtr += 1;
                blockIndentsTarPtr += 1;
                opAndBlockContent = [diffs[x][0], blockIndentsTar[blockIndentsTarPtr] + blockArray[chars.charCodeAt(y)]]
            } else { // op == DELETE, the old indent is the only option
                blockIndentsOriPtr += 1;
                opAndBlockContent = [diffs[x][0], blockIndentsOri[blockIndentsOriPtr] + blockArray[chars.charCodeAt(y)]]
            }
            originBlockBasedDiffs.push([opAndBlockContent])
        }
      } else {
        // Insertions are always appended to the last unchanged / deleted block
        const currentBlockAnchor = originBlockBasedDiffs.length - 1;
        for (var y = 0; y < chars.length; y++) {
            blockIndentsTarPtr += 1;
            const opAndBlockContent = [diffs[x][0], blockIndentsTar[blockIndentsTarPtr] + blockArray[chars.charCodeAt(y)]]
            originBlockBasedDiffs[currentBlockAnchor].push(opAndBlockContent)
        }
      }
    }
    return originBlockBasedDiffs;
};

// merge_diffs = function(originBlockBasedDiffsA, originBlockBasedDiffsB) {
//     const mergedDiffs = []
//     for (var x = 0; x < originBlockBasedDiffsA.length; x++) {
//         const blockA = originBlockBasedDiffsA[x];
//         const blockB = originBlockBasedDiffsB[x];
//         // If op = -1 exists, then it overrides op = 0;
//         // op = 1 always appends, don't override or overrided
//         const mergedBlock = [];
//         for (var y = 0; y < blockA.length; y++) {


//     }
//     return mergedDiffs;
// }
