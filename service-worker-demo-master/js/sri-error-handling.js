//on window eventlistener
window.addEventListener('error', (e) => {
    console.log('Window.addEventListener(\'error\') handler Event: ', e, " src:", e.target.src, " performance ", performance.now());   
    return true 
}, true)

//on document eventlistener
document.addEventListener('error', (e) => {
    // Returns a event object with type "error"
    console.log('Document.addEventListener(\'error\') handler Event:', e, 'src ', e.target.src, " performance ", performance.now())
    return true 
}, true)

//inline on element tag 
function onErrorAttribute(e, event) {
    // This one only executes a function when it gets an error, and it only accepts 'this' & event as the argument
    console.log('onerror Attribute Handler Values of (this) this:', e, 'URL: ', e.baseURI, " integrity ",   e.integrity, " time ", performance.now())
    console.log('onerror Attribute Handler Values of (this) this:', event, " time ", performance.now())
}