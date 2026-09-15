window.CR_QUESTIONS=[];
const CR_DOMAINS=[
 ['transit agency','commuters','average commute time','express buses','road congestion'],['retailer','customers','monthly revenue','lower-priced bundles','competitor promotions'],['employer','employees','productivity','mentoring','self-selection'],['university','students','retention','weekly advising','prior preparation'],['health department','patients','clinic attendance','text reminders','distance to clinics'],['restaurant group','diners','table turnover','digital ordering','weekend demand'],['software company','customers','feature adoption','simplified onboarding','existing habits'],['library system','members','library visits','evening hours','neighborhood income'],['utility','households','electricity use','smart-meter alerts','home size'],['manufacturer','production lines','defect rate','automated inspection','supplier quality'],['farm cooperative','farms','crop yield','drip irrigation','soil quality'],['museum','visitors','repeat attendance','family workshops','tourist seasonality'],['education platform','learners','course completion','shorter lessons','learner motivation'],['housing authority','applicants','processing time','online forms','seasonal demand'],['service company','customers','resolution time','callback queues','case complexity'],['airport','passengers','security wait time','extra screening lanes','holiday traffic'],['sports academy','athletes','performance','video feedback','baseline ability'],['environmental agency','households','recycling rate','deposit incentives','collection access'],['bank','account holders','mobile-app usage','fee waivers','customer age'],['publisher','readers','ebook sales','lower digital prices','genre popularity'],['hotel chain','guests','guest satisfaction','mobile check-in','trip purpose'],['pharmacy chain','patients','pickup rate','SMS reminders','distance from stores'],['contractor','projects','project delays','prefabrication','weather disruptions'],['nonprofit','donors','donation revenue','monthly giving','donor income'],['conservation lab','artifacts','preservation','humidity controls','building age']
];
const CR_TYPES=['Strengthen','Weaken','Assumption','Inference','Evaluate','Conclusion','Flaw','Resolve Paradox','Bold Face','Method','Must Be True','Similar Reasoning','Complete the Passage'];
const CR_DIFF=['Easy','Medium','Hard'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function mkCR(i){
 const d=CR_DOMAINS[(i*7+Math.floor(i/13))%CR_DOMAINS.length],t=CR_TYPES[(i-1)%CR_TYPES.length],lv=CR_DIFF[Math.floor((i-1)/CR_TYPES.length)%3];
 const pct=5+(i*11)%26,n=18+(i*7)%67,place=['North','East','Central','West','South'][i%5],period=['one quarter','six months','one year','two semesters','three years'][i%5];
 const a=d[0],p=d[1],m=d[2],x=d[3],alt=d[4]; let s,q,c,o,e;
 const context=`${cap(a)} officials recently examined whether ${x} could improve ${m}. The issue arose after managers noticed that some ${p} who encountered the program reported better outcomes than others. Supporters argue that the difference is meaningful because the program changes how ${p} behave, while critics note that the groups may differ in important ways before the program begins. A review covering ${n} locations found a ${pct}% difference during ${period}, although conditions were not identical at every location. The organization therefore wants to determine what can reasonably be concluded from the evidence before changing its policy.`;
 if(t==='Strengthen'){
  s=context+` In particular, the organization concludes that expanding ${x} is likely to improve ${m} for a broader group of ${p}.`;
  q='Which of the following, if true, most strengthens the conclusion?';
  c=`A controlled pilot found comparable ${p} who received ${x} improved ${m} by about the same amount, while comparable ${p} who did not receive it showed no similar improvement.`;
  o=[`The ${x} program is already familiar to some ${p}.`,`Several ${p} said they preferred a different approach.`,`The program requires additional administrative work.`,`The improvement was somewhat larger at ${place} locations.`];
  e='The controlled comparison supports a causal link by showing that similar groups differed mainly in whether they received the intervention.';
 } else if(t==='Weaken'){
  s=context+` On the basis of the observed difference, the organization concludes that ${x} caused the improvement in ${m}.`;
  q='Which of the following, if true, most weakens the conclusion?';
  c=`The ${p} who chose ${x} already had a characteristic that independently tends to produce better ${m}.`;
  o=[`The review included ${n} locations.`,`The ${x} program was available throughout ${period}.`,`Some ${p} reported being satisfied with the program.`,`The difference was especially large in ${place}.`];
  e='A pre-existing difference provides a plausible alternative explanation for the observed association, so the evidence no longer strongly supports causation.';
 } else if(t==='Assumption'){
  s=context+` The organization plans to expand ${x} because the observed association is taken as evidence that the intervention improves ${m}.`;
  q='The argument depends on which of the following assumptions?';
  c=`The difference in ${m} is not primarily caused by a pre-existing difference between ${p} who received ${x} and those who did not.`;
  o=[`Most ${p} have heard of the program.`,`The program can be administered in ${place}.`,`The program has received favorable publicity.`,`Some ${p} prefer traditional methods.`];
  e='If the groups differed beforehand in a way that explains the outcome, the observed association would not justify the causal conclusion.';
 } else if(t==='Inference'||t==='Must Be True'){
  s=`A policy at a ${a} states that every member of a ${p} group in ${place} who uses ${x} must satisfy a stated eligibility requirement before receiving the associated benefit. Records show that all recipients of the benefit satisfied that requirement. Records also show that some eligible ${p} did not use ${x}. No record indicates that an ineligible person received the benefit. The policy has remained unchanged throughout ${period}.`;
  q='Which of the following must be true?';
  c=`No recipient of the benefit who used ${x} was ineligible under the stated requirement.`;
  o=[`Everyone in ${place} used ${x}.`,`Everyone who was eligible used ${x}.`,`The benefit is available only in ${place}.`,`The stated requirement is the only requirement for receiving the benefit.`];
  e='The policy and records directly establish that recipients who used the program satisfied the stated eligibility condition; the other choices add information not guaranteed by the passage.';
 } else if(t==='Evaluate'){
  s=`A ${a} is considering a proposal to expand ${x}. Supporters point to earlier results in which ${p} associated with the intervention showed better ${m}. Critics respond that the earlier ${p} may not resemble the broader population that would receive the program. The decision makers must decide whether the existing evidence is strong enough to predict the result of a larger rollout. They are particularly concerned about whether the apparent benefit would remain after the program is offered to a different mix of ${p}.`;
  q='Which question would be most useful in evaluating the prediction?';
  c=`Are the ${p} expected to receive ${x} in the proposed rollout substantially different from the ${p} whose outcomes produced the original evidence?`;
  o=[`How long has the organization existed?`,`How many employees administer the program?`,`What color appears on the program materials?`,`How many neighboring organizations have heard about it?`];
  e='The answer directly tests whether the original evidence can reasonably be generalized to the population affected by the proposed expansion.';
 } else if(t==='Conclusion'){
  s=`A survey conducted by a ${a} found that ${pct}% of ${p} using ${x} reported improved ${m}; among comparable ${p} who did not use ${x}, the figure was ${Math.max(1,pct-10)}%. The survey covered several locations over ${period}. Researchers did not randomly assign participants to the two groups, and the groups differed somewhat in ${alt}. The organization nevertheless wants to use the results when deciding whether to recommend ${x} more widely.`;
  q='Which conclusion is best supported by the information above?';
  c=`There is an association between ${x} and reported ${m}, but the survey alone does not establish that ${x} caused the difference.`;
  o=[`${cap(x)} definitely causes better ${m}.`,`${cap(x)} has no effect on ${m}.`,`All ${p} should immediately use ${x}.`,`The two groups were proven identical before the survey.`];
  e='Because participants were not randomly assigned and differed in another relevant factor, the results support an association but do not by themselves prove causation.';
 } else if(t==='Flaw'){
  s=`A ${a} observes that ${p} in ${place} who adopted ${x} showed better ${m} than ${p} who did not. The report notes that adoption was voluntary and that the two groups were not matched on every relevant characteristic. Nevertheless, the ${a} concludes that requiring all ${p} to adopt ${x} will produce the same improvement. It argues that because the successful group used the intervention, the intervention itself must have been responsible for the outcome.`;
  q='The reasoning is most vulnerable to which criticism?';
  c='It treats an association involving a self-selected group as sufficient evidence that imposing the intervention will cause the observed outcome.';
  o=['It relies on a definition that directly contradicts the evidence.','It assumes every trend must be temporary.','It confuses a necessary condition with an average result.','It rejects the conclusion merely because it is unfamiliar.'];
  e='The argument moves from correlation to causation without ruling out selection effects or other differences between the groups.';
 } else if(t==='Resolve Paradox'){
  s=`A report from a ${a} found that ${p} who received ${x} showed a ${pct}% improvement in ${m}. Yet the organization reported that its overall ${m} declined during the same ${period}. At first this seems contradictory: if the intervention improved the outcome for the people who received it, one might expect the organization-wide measure to improve as well. Managers therefore want to identify a circumstance that could make both findings true at the same time without rejecting either finding.`;
  q='Which of the following, if true, best explains the apparent discrepancy?';
  c=`The ${p} receiving ${x} were a small subgroup, while a much larger group experienced a decline in ${m} for an unrelated reason.`;
  o=[`The ${x} received favorable publicity.`,`Some ${p} said they were satisfied with it.`,`The organization tracked ${m} carefully.`,`The intervention was discussed at a staff meeting.`];
  e='An improvement in a small subgroup can occur at the same time as an overall decline if the larger subgroup worsens enough to outweigh the improvement.';
 } else if(t==='Bold Face'){
  s=`A ${a} reports that ${x} was associated with better ${m} across several locations. **However,** ${alt} varied substantially among those locations, making it difficult to know whether the difference in outcomes was caused by the intervention or by other conditions. **Therefore,** the report recommends a randomized trial before concluding that ${x} caused the improvement. The authors say that such a trial would provide a stronger basis for deciding whether the policy should be expanded.`;
  q='The two boldfaced portions play which of the following roles?';
  c='The first presents evidence relevant to a causal claim; the second limits that claim and motivates a stronger test.';
  o=['The first states a conclusion; the second gives unrelated background.','The first gives a definition; the second contradicts it.','The first presents an objection; the second proves it false.','The first gives a recommendation; the second proves implementation.'];
  e='The first bold portion is evidence that might support causation, while the second recognizes an alternative explanation and recommends a method for resolving it.';
 } else if(t==='Method'){
  s=`A ${a} first compared ${m} among ${p} who had chosen ${x} with ${m} among those who had not. The researchers then created a separate comparison in which participants were assigned to receive or not receive the intervention, and they checked whether the original pattern appeared again. They reasoned that if the same difference appeared under the second design, the possibility that the original result was caused only by differences in the people who chose the intervention would be reduced.`;
  q='The argument’s method is best described as';
  c='checking whether an initially observed association persists when selection differences are reduced through a separate comparison.';
  o=['replacing quantitative evidence with an appeal to authority.','assuming that correlation automatically proves causation.','using an anecdote to reject an otherwise consistent trend.','inferring a universal rule from one unusual case.'];
  e='The method is designed to address the main alternative explanation by reducing differences between the comparison groups.';
 } else if(t==='Similar Reasoning'){
  s=`A ${a} argues: “A small pilot of ${x} produced better ${m} at one location. The pilot was successful, so every ${p} should adopt the intervention immediately.” The report notes that the pilot location had unusual conditions but says those conditions are unlikely to matter. No evidence is presented showing that other locations are comparable. The recommendation therefore rests largely on the favorable result from the single pilot.`;
  q='Which of the following arguments most closely parallels the reasoning above?';
  c='A trial of a new scheduling system worked at one branch, so every branch should adopt it without testing whether circumstances are comparable.';
  o=['A cheaper product should be preferred when its quality is equal to that of a more expensive product.','A rule applies to all employees, so it should be enforced consistently.','A measurement was repeated twice, so its average is likely to be more reliable.','A proposal has benefits and costs, so decision makers should compare both before acting.'];
  e='Both arguments generalize from one favorable setting to many settings without establishing that the relevant circumstances are comparable.';
 } else {
  s=`A study by a ${a} found that ${p} using ${x} had better ${m}. The study did not randomly assign ${p} to the two groups, and ${alt} differed across groups. Researchers therefore concluded that the study demonstrates an association but not causation. Because the organization wants to learn whether the intervention itself produces the observed benefit, the researchers recommend a more informative design for the next study.`;
  q='Which option most logically completes the passage?';
  c=`compare otherwise similar ${p} while controlling for or accounting for differences in ${alt}`;
  o=['use a larger font in the final report',`exclude all ${p} who did not use ${x}`,'assume the association is causal',`avoid measuring ${m} in future studies`];
  e='The proposed step addresses the key limitation of the original study by making the comparison groups more similar on a factor that could otherwise explain the result.';
 }
 let opts=[c,...o],k=(i*3)%5;
 opts=opts.slice(k).concat(opts.slice(0,k));
 const answer=(5-k)%5;
 return {id:i,type:t,difficulty:lv,stimulus:s,question:q,options:opts,answer,explanation:e};
}
for(let i=1;i<=1953;i++)CR_QUESTIONS.push(mkCR(i));
const CR_SOURCES=['GMAT-STYLE ORIGINAL','LSAT-STYLE ORIGINAL','ORIGINAL CR BANK'];
window.CR_DATA={questions:CR_QUESTIONS,sets:Array.from({length:196},(_,j)=>{let start=j*10+1,end=Math.min(start+9,1953);return{id:j+1,name:String(j+1).padStart(3,'0'),source:CR_SOURCES[j%3],question_ids:Array.from({length:end-start+1},(_,k)=>start+k)}})};
