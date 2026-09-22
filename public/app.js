const promptEl=document.querySelector("#prompt");
const modelEl=document.querySelector("#model");
const generateBtn=document.querySelector("#generate");
const statusEl=document.querySelector("#status");
const resultEl=document.querySelector("#result");
const appNameEl=document.querySelector("#appName");
const descriptionEl=document.querySelector("#appDescription");
const featuresEl=document.querySelector("#features");
const filesEl=document.querySelector("#files");
const downloadBtn=document.querySelector("#download");
let generated=null;

generateBtn.addEventListener("click",async()=>{
  const prompt=promptEl.value.trim();
  if(!prompt){statusEl.textContent="Describe the app you want to create first.";return;}
  generateBtn.disabled=true;statusEl.textContent="Mistral is designing your app…";resultEl.classList.add("hidden");
  try{
    const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,model:modelEl.value})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"Generation failed.");
    generated=data;renderResult(data);statusEl.textContent="App generated.";
  }catch(error){statusEl.textContent="Error: "+error.message;}finally{generateBtn.disabled=false;}
});

function renderResult(data){
  appNameEl.textContent=data.name||"Generated App";descriptionEl.textContent=data.description||"";
  featuresEl.innerHTML="";(data.features||[]).forEach(feature=>{const el=document.createElement("span");el.className="feature";el.textContent=feature;featuresEl.appendChild(el);});
  filesEl.innerHTML="";(data.files||[]).forEach(file=>{
    const wrap=document.createElement("div");wrap.className="file";
    const title=document.createElement("div");title.className="file-title";title.textContent=file.path;
    const pre=document.createElement("pre");const code=document.createElement("code");code.textContent=file.content||"";pre.appendChild(code);
    wrap.append(title,pre);filesEl.appendChild(wrap);
  });
  resultEl.classList.remove("hidden");resultEl.scrollIntoView({behavior:"smooth",block:"start"});
}
downloadBtn.addEventListener("click",()=>{
  if(!generated?.files?.length)return;
  generated.files.forEach((file,index)=>{
    const blob=new Blob([file.content||""],{type:"text/plain;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.path.split("/").pop()||("file-"+(index+1)+".txt");a.click();URL.revokeObjectURL(a.href);
  });
});
