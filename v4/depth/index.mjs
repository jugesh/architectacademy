import {databaseDepth} from './databases.mjs';
import {messagingDepth} from './messaging.mjs';
import {reliabilityDepth} from './reliability.mjs';
import {observabilityDepth} from './observability.mjs';
export function addCoreDepth(lessons){
 const additions={databases:databaseDepth,messaging:messagingDepth,reliability:reliabilityDepth,observability:observabilityDepth};
 for(const [slug,sections]of Object.entries(additions)){
  const lesson=lessons.find(l=>l.slug===slug);if(!lesson)throw Error(`Missing depth lesson ${slug}`);
  for(const {after,...entry}of sections){
   const at=lesson.sections.findIndex(s=>s.id===after);
   if(at<0||lesson.sections.some(s=>s.id===entry.id))throw Error(`Invalid depth anchor ${slug}#${entry.id}`);
   lesson.sections.splice(at+1,0,{...entry,html:`<div class="core-deep-dive">${entry.html}</div>`});
  }
 }
}
