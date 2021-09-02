// on DOM tree, Mutation Observer possibly too complex

let observer = window.MutationObserver || window.WebKitMutationObserver;

if (observer) {
  new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(processNode);
    });
  }).observe(document, { childList: true, subtree: true })
}

// Note, if type has onerror, mutation observer onerror wont lunch
var processNode = function(node) {
    var tagName = node.tagName ? node.tagName.toLowerCase() : '';
    if (tagName === 'script' || tagName === 'link' ) {
      if (!node.onerror) {
        node.onerror = function(error) {
          console.log("Mutation Observer Error Handler Event:", error, " performance ", performance.now())  
      }
    }
  }
}