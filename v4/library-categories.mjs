// Subject browsing and the suggested first-read sequence are intentionally separate.
export const coreGroups=[
 {id:'foundations',title:'Foundations',description:'Understand the request, its contract and who may act on a resource.',slugs:['networking','index','security']},
 {id:'scale-services',title:'Scale & Service Design',description:'Measure demand, choose service boundaries and protect finite capacity.',slugs:['scalability','microservices','rate-limiting']},
 {id:'data-consistency',title:'Data & Consistency',description:'Model authoritative facts, reusable copies, concurrent changes and data distribution.',slugs:['databases','caching','consistency','replication-partitioning']},
 {id:'messaging-pipelines',title:'Messaging & Pipelines',description:'Move durable work and derive searchable views without losing identity or progress.',slugs:['messaging','search-pipelines']},
 {id:'reliability-operations',title:'Reliability & Operations',description:'Handle failure, diagnose outcomes, deploy safely and recover usable service.',slugs:['reliability','observability','deployment-runtime','disaster-recovery']},
 {id:'design-practice',title:'Design Practice',description:'Combine requirements, mechanisms and failure recovery in end-to-end designs.',slugs:['design-practice']}
];
export const guideGroups=[
 {id:'decisions',title:'Decide & Estimate',description:'Compare alternatives and quantify the capacity and cost assumptions behind them.',slugs:['decision-guides','capacity-cost']},
 {id:'production',title:'Implement & Operate',description:'Study incidents, Java/Spring behavior and controlled migrations.',slugs:['failure-case-studies','java-spring-internals','migration-modernization']},
 {id:'revision',title:'Interview & Revise',description:'Practice answers, check your reasoning and revisit weak concepts.',slugs:['interview-workbook','revision-toolkit']}
];
export const recommendedOrder=['networking','index','security','scalability','databases','caching','messaging','consistency','microservices','rate-limiting','replication-partitioning','reliability','deployment-runtime','disaster-recovery','search-pipelines','observability','design-practice'];
export function validateGroups(groups,expected,label){
 const entries=groups.flatMap(g=>g.slugs),seen=new Set(entries);
 if(seen.size!==entries.length||entries.length!==expected.length||expected.some(s=>!seen.has(s)))throw Error(`${label}: every page must appear in exactly one group`);
 if(new Set(groups.map(g=>g.id)).size!==groups.length)throw Error(`${label}: duplicate category anchor`);
}
