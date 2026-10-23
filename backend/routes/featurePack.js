const express=require('express');
const {filterRows,toCSV,validateTask,beneficiaryRisk,workloadSummary,referralGap}=require('../domain/featurePack');
function createFeaturePackRouter({queryFn,authenticate,table}){const router=express.Router();router.use(authenticate);
 const getRows=async(req)=>{if(Array.isArray(req.body?.records))return req.body.records;const r=await queryFn(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 500`);return r.rows||r;};

 router.get('/search',async(req,res)=>{try{const r=await queryFn(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 500`);const rows=filterRows(r.rows||r,req.query);res.json({data:rows,total:rows.length});}catch(e){res.status(500).json({error:e.message});}});
 router.get('/export',async(req,res)=>{try{const r=await queryFn(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 500`);const rows=filterRows(r.rows||r,req.query);if(String(req.query.format||'json').toLowerCase()==='csv'){res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition','attachment; filename="export.csv"');return res.send(toCSV(rows));}res.json({data:rows,total:rows.length});}catch(e){res.status(500).json({error:e.message});}});
 router.post('/ai/beneficiary-risk',async(req,res)=>{try{const rows=await getRows(req);res.json(beneficiaryRisk(rows));}catch(e){res.status(500).json({error:e.message});}});
 router.post('/ai/workload-summary',async(req,res)=>{try{const rows=await getRows(req);res.json(workloadSummary(rows));}catch(e){res.status(500).json({error:e.message});}});
 router.post('/ai/referral-gap',async(req,res)=>{try{const rows=await getRows(req);res.json(referralGap(rows));}catch(e){res.status(500).json({error:e.message});}});
 return router;}
module.exports={createFeaturePackRouter};
