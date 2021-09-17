//on document eventlistener
document.addEventListener('error', (e) => {
    // Returns a event object with type "error"
    console.log('Document.addEventListener(\'error\') handler Event:', e, 'src ', e.target.src, " performance ", performance.now())
    return true 
}, true)
