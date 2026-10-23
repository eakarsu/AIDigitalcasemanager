
function hasProviderKey(env=process.env){return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY);}
function esc(v){if(v===null||v===undefined)return '';const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function toCSV(rows,columns){const cols=columns&&columns.length?columns:Object.keys(rows[0]||{});return [cols.join(','),...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+(rows.length?'\n':'');}
function filterRows(rows,{q='',status,priority,...rest}={}){const needle=String(q||'').toLowerCase();return rows.filter(r=>{if(needle&&!Object.values(r).some(v=>v!==null&&v!==undefined&&String(v).toLowerCase().includes(needle)))return false;if(status!==undefined&&status!==''&&String(r.status??'')!==String(status))return false;if(priority!==undefined&&priority!==''&&String(r.priority??'')!==String(priority))return false;for(const[k,v]of Object.entries(rest)){if(v!==undefined&&v!==''&&String(r[k]??'')!==String(v))return false;}return true;});}
function validateTask(b={}){if(!b.title||!String(b.title).trim())return 'title is required';if(b.status&&!['pending','in_progress','completed','cancelled'].includes(b.status))return 'invalid status';return null;}
function section(label,value){return {label,value:value===undefined?null:value};}

function beneficiaryRisk(rows=[]){const high=rows.filter(r=>r.risk_level==='high').length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'beneficiary-risk',sections:[section('Total beneficiaries',rows.length),section('High risk',high),section('Summary',high+' high-risk beneficiary(ies)')],high,total:rows.length};}
function workloadSummary(rows=[]){const active=rows.filter(r=>r.status==='active').length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'workload-summary',sections:[section('Total beneficiaries',rows.length),section('Active',active),section('Summary',active+' active beneficiary(ies)')],active,total:rows.length};}
function referralGap(rows=[]){const noProgram=rows.filter(r=>!r.program).length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'referral-gap',sections:[section('Total beneficiaries',rows.length),section('Without program',noProgram),section('Empty program preserved',noProgram)],noProgram,total:rows.length};}

module.exports={hasProviderKey,toCSV,filterRows,validateTask,section,beneficiaryRisk,workloadSummary,referralGap};
