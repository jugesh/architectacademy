(() => {
const definitions = {
'p99':'99th-percentile latency: 99% of measured requests finish at or below this duration; 1% take longer.',
'RPS':'Requests per second: the rate of incoming or completed HTTP requests, depending on the metric.',
'latency':'Elapsed time for an operation or request, typically measured in milliseconds.',
'stateless':'An instance does not rely on its own persistent per-client memory to serve the next request.',
'Little’s Law':'For a stable system, average in-flight work equals arrival rate multiplied by average time in system.',
'ECS':'Amazon Elastic Container Service: managed orchestration for running containers.',
'ALB':'Application Load Balancer: AWS Layer 7 HTTP/HTTPS traffic distribution.',
'SQS':'Amazon Simple Queue Service: managed message queue for decoupled asynchronous processing.'
};
document.querySelectorAll('[data-term]').forEach(el => {
const key=el.dataset.term; el.classList.add('term');el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',key+': '+(definitions[key]||key));el.dataset.definition=definitions[key]||key;
el.addEventListener('click',()=>el.focus());
});
window.setBookMode = function(mode) {
document.body.classList.remove('cornell','revision');if(mode!=='textbook')document.body.classList.add(mode);
document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
};
window.printBook = function(){
const entries=[...document.querySelectorAll('details')],state=entries.map(e=>e.open);entries.forEach(e=>e.open=true);
const restore=()=>{entries.forEach((e,i)=>e.open=state[i]);window.removeEventListener('afterprint',restore)};
window.addEventListener('afterprint',restore);window.print();
};
window.setBookMode('textbook');
})();