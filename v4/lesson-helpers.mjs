export const p=s=>`<p>${s}</p>`;
export const code=s=>`<pre><code>${s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</code></pre>`;
export const table=(heads,rows)=>`<table><thead><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export const req=(f,n)=>`<div class="req"><div class="func"><h3>Functional requirements</h3><ul>${f.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="nonfunc"><h3>Targets and invariants</h3><ul>${n.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`;
export const diagram=(nodes,caption)=>`<figure class="diagram"><div class="flow">${nodes.map(x=>`<div class="node">${x}</div>`).join('<span class="arrow" aria-hidden="true">→</span>')}</div><figcaption>${caption}</figcaption></figure>`;
export const qa=items=>items.map(([level,q,a])=>`<details class="qa"><summary><span class="level ${level==='Foundational'?'easy':level==='Intermediate'?'medium':'hard'}">${level}</span>${q}</summary><div class="answer">${a}</div></details>`).join('');
export const refs=items=>`<ul class="reference-list">${items.map(([url,title,why])=>`<li><a href="${url}">${title}</a>: ${why}</li>`).join('')}</ul>`;
export const warn=s=>`<div class="callout warn">${s}</div>`;
export const section=(id,title,html,cue)=>({id,title,html,cue});
