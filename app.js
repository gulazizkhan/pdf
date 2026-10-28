(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const dialog = $("#toolDialog"), content = $("#dialogContent"), status = $("#dialogStatus");
  let activeTool = "", activeFiles = [];
  const names = {
    merge:["Merge PDF","Combine two or more PDF files into one document."],
    split:["Split PDF","Create a separate PDF for each page or save a page range."],
    rotate:["Rotate pages","Rotate all pages or only the pages you specify."],
    remove:["Remove pages","Remove selected pages from a PDF."],
    extract:["Extract pages","Create a new PDF from selected pages."],
    imagespdf:["Images to PDF","Combine JPG and PNG images into a single PDF."],
    pdfimages:["PDF to images","Render PDF pages as PNG images."],
    watermark:["Add watermark","Stamp a text watermark on each page."],
    numbers:["Add page numbers","Add a page number to the bottom of each page."],
    info:["PDF information","View basic document details."],
    text:["Extract text","Extract selectable text from a PDF. Scanned PDFs require OCR."],
    compress:["Optimize PDF","Rewrite a PDF file. This may not reduce file size."],
    protect:["Protect PDF","Password encryption is not included in this starter build."],
    unlock:["Unlock PDF","Password removal is not included in this starter build."]
  };
  const setStatus = (message, error=false) => { status.textContent=message; status.classList.toggle("error",error); };
  const field = (label,id,placeholder,value="") => `<label class="dialog-field">${label}<input id="${id}" placeholder="${placeholder}" value="${value}"></label>`;
  const selectField = (label,id,options) => `<label class="dialog-field">${label}<select id="${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join("")}</select></label>`;
  const actionButton = (label,id="runTool") => `<button class="dialog-run" id="${id}">${label}</button>`;
  const pdfUpload = (multiple=false, accept=".pdf") => `<div class="upload-zone" id="uploadZone"><div class="upload-symbol">↑</div><strong>Drop your file${multiple?"s":""} here or browse</strong><p>Supported format: ${accept===".pdf"?"PDF": "JPG and PNG"} · Files stay in your browser for supported tools</p><input id="fileInput" type="file" accept="${accept}" ${multiple?"multiple":""}></div><ul class="file-list" id="fileList"></ul>`;
  const safeName = s => s.replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").toLowerCase() || "toolnest-file";
  function parsePages(value,total) {
    if(!value || value.trim().toLowerCase()==="all") return Array.from({length:total},(_,i)=>i);
    const out=new Set();
    for(const part of value.split(",")) {
      const p=part.trim(); if(!p) continue;
      const range=p.match(/^(\d+)\s*-\s*(\d+)$/);
      if(range) {
        let a=+range[1],b=+range[2]; if(a>b)[a,b]=[b,a];
        for(let n=a;n<=b;n++){if(n<1||n>total)throw Error(`Page ${n} is outside this PDF. Valid pages: 1–${total}.`);out.add(n-1);}
      } else if(/^\d+$/.test(p)) { const n=+p;if(n<1||n>total)throw Error(`Page ${n} is outside this PDF. Valid pages: 1–${total}.`);out.add(n-1); }
      else throw Error("Enter page numbers like 1,3-5,8.");
    }
    return [...out].sort((a,b)=>a-b);
  }
  function download(data,name,type="application/pdf") {
    const blob=data instanceof Blob?data:new Blob([data],{type});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  async function loadPdf(file) {
    if(!file) throw Error("Please choose a PDF file first.");
    if(!window.PDFLib) throw Error("PDF library did not load. Check your internet connection and refresh the page.");
    return PDFLib.PDFDocument.load(await file.arrayBuffer());
  }
  async function savePdf(doc,name) {
    const bytes=await doc.save();download(bytes,name);return bytes.byteLength;
  }
  function buildTool(key) {
    activeTool=key; activeFiles=[];
    $("#dialogTitle").textContent=names[key][0];$("#dialogDescription").textContent=names[key][1];
    setStatus(""); let markup="";
    if(key==="merge") markup=pdfUpload(true)+`<p class="muted" style="font-size:11px;margin:12px 0 0">Files are merged in the order shown in your file selection.</p>${actionButton("Merge PDFs")}`;
    else if(key==="split") markup=pdfUpload()+`<div class="dialog-options">${selectField("Split mode","splitMode",[["each","Every page separately"],["range","Selected page range"]])}${field("Page range","pageRange","e.g. 2-5,8")}</div>${actionButton("Split PDF")}`;
    else if(key==="rotate") markup=pdfUpload()+`<div class="dialog-options">${selectField("Rotation","degrees",[["90","90° clockwise"],["180","180°"],["270","270° clockwise"]])}${field("Pages (optional)","pages","All pages or 1,3-4","all")}</div>${actionButton("Rotate pages")}`;
    else if(key==="remove"||key==="extract") markup=pdfUpload()+`<div class="dialog-options">${field("Pages / ranges","pages","e.g. 2,4-6")}</div>${actionButton(key==="remove"?"Remove selected pages":"Extract selected pages")}`;
    else if(key==="imagespdf") markup=pdfUpload(true,"image/png,image/jpeg")+`<p class="muted" style="font-size:11px;margin:12px 0 0">One image will be placed on each PDF page.</p>${actionButton("Create PDF")}`;
    else if(key==="pdfimages") markup=pdfUpload()+`<div class="dialog-options">${field("Pages (optional)","pages","All pages or 1,3-4","all")}</div>${actionButton("Convert to PNG")}`;
    else if(key==="watermark") markup=pdfUpload()+`<div class="dialog-options">${field("Watermark text","watermarkText","CONFIDENTIAL","CONFIDENTIAL")}${selectField("Placement","placement",[["center","Center"],["bottom","Bottom"]])}</div>${actionButton("Add watermark")}`;
    else if(key==="numbers") markup=pdfUpload()+actionButton("Add page numbers");
    else if(key==="info"||key==="text"||key==="compress") markup=pdfUpload()+actionButton(key==="info"?"Read PDF information":key==="text"?"Extract text":"Optimize PDF");
    else markup=`<div class="upload-zone"><div class="upload-symbol">⌁</div><strong>This feature is not ready yet</strong><p>${key==="protect"?"PDF password encryption needs a suitable encryption library or backend.":"Password-protected PDFs are not supported in this starter build."}</p></div>`;
    content.innerHTML=markup;
    const fileInput=$("#fileInput");
    if(fileInput) {
      fileInput.addEventListener("change",()=>{activeFiles=[...fileInput.files];renderFileList();});
      const zone=$("#uploadZone");
      zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("dragover");});
      zone.addEventListener("dragleave",()=>zone.classList.remove("dragover"));
      zone.addEventListener("drop",e=>{e.preventDefault();zone.classList.remove("dragover");if(e.dataTransfer.files.length){fileInput.files=e.dataTransfer.files;activeFiles=[...fileInput.files];renderFileList();}});
    }
    $("#runTool")?.addEventListener("click",()=>runTool(key));
    if(!dialog.open) dialog.showModal();
  }
  function renderFileList() {
    const list=$("#fileList");if(!list)return;
    list.innerHTML=activeFiles.map(f=>`<li>${f.name.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))} <span style="color:#9aa3b3">(${(f.size/1024).toFixed(1)} KB)</span></li>`).join("");
    setStatus(activeFiles.length?`${activeFiles.length} file${activeFiles.length===1?"":"s"} selected.`:"");
  }
  async function runTool(key) {
    const run=$("#runTool");if(run){run.disabled=true;run.textContent="Working…";}
    try {
      if(!activeFiles.length) throw Error("Select the required file(s) first.");
      if(key==="protect"||key==="unlock") throw Error("This feature is not implemented in this version.");
      if(key==="merge") {
        if(activeFiles.length<2)throw Error("Select at least two PDF files.");
        const out=await PDFLib.PDFDocument.create();
        for(const f of activeFiles){const src=await loadPdf(f);(await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p));}
        const size=await savePdf(out,"toolnest-merged.pdf");setStatus(`Merged ${activeFiles.length} files. Download started (${(size/1024).toFixed(1)} KB).`);
      } else if(key==="imagespdf") {
        const out=await PDFLib.PDFDocument.create();
        for(const f of activeFiles){const bytes=await f.arrayBuffer();let image;
          if(f.type==="image/png"||/\.png$/i.test(f.name))image=await out.embedPng(bytes);
          else if(f.type==="image/jpeg"||/\.jpe?g$/i.test(f.name))image=await out.embedJpg(bytes);
          else continue;
          const page=out.addPage([image.width,image.height]);page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});
        }
        if(!out.getPageCount())throw Error("Choose JPG or PNG images.");await savePdf(out,"toolnest-images.pdf");setStatus("Created your PDF. Download started.");
      } else if(key==="pdfimages") {
        if(!window.pdfjsLib)throw Error("PDF renderer did not load. Check your internet connection.");
        const pdf=await pdfjsLib.getDocument({data:await activeFiles[0].arrayBuffer()}).promise;
        const indexes=parsePages($("#pages").value,pdf.numPages);if(indexes.length>25)throw Error("Convert up to 25 pages per batch in this browser demo.");
        for(const i of indexes){const page=await pdf.getPage(i+1),viewport=page.getViewport({scale:1.5}),canvas=document.createElement("canvas");canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));download(blob,`toolnest-page-${i+1}.png`,"image/png");}
        setStatus(`Converted ${indexes.length} page(s). Your browser may ask permission for multiple downloads.`);
      } else if(key==="text") {
        if(!window.pdfjsLib)throw Error("PDF renderer did not load. Check your internet connection.");
        const pdf=await pdfjsLib.getDocument({data:await activeFiles[0].arrayBuffer()}).promise;let text="";
        for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),items=await page.getTextContent();text+=`--- Page ${i} ---\n${items.items.map(x=>x.str).join(" ")}\n\n`;}
        download(new Blob([text],{type:"text/plain;charset=utf-8"}),"toolnest-extracted-text.txt","text/plain");setStatus("Text extraction complete. Scanned image-only PDFs need OCR.");
      } else {
        const file=activeFiles[0],doc=await loadPdf(file),count=doc.getPageCount();
        if(key==="info"){const info=[`File: ${file.name}`,`File size: ${(file.size/1024).toFixed(1)} KB`,`Page count: ${count}`,`Title: ${doc.getTitle()||"Not set"}`,`Author: ${doc.getAuthor()||"Not set"}`,`Subject: ${doc.getSubject()||"Not set"}`,`Creator: ${doc.getCreator()||"Not set"}`].join("\n");content.insertAdjacentHTML("beforeend",`<pre class="result-box">${info.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</pre>`);setStatus("PDF information read successfully.");return;}
        if(key==="split") {
          if($("#splitMode").value==="each"){if(count>25)throw Error("For this demo, split PDFs with up to 25 pages per batch.");for(let i=0;i<count;i++){const out=await PDFLib.PDFDocument.create();const [p]=await out.copyPages(doc,[i]);out.addPage(p);await savePdf(out,`toolnest-page-${i+1}.pdf`);}setStatus(`Created ${count} separate PDF files. Your browser may ask permission for multiple downloads.`);}
          else {const indexes=parsePages($("#pageRange").value,count);if(!indexes.length)throw Error("Enter a page range.");const out=await PDFLib.PDFDocument.create();(await out.copyPages(doc,indexes)).forEach(p=>out.addPage(p));await savePdf(out,"toolnest-split.pdf");setStatus(`Saved ${indexes.length} page(s) to a new PDF.`);}
        } else if(key==="extract") {const indexes=parsePages($("#pages").value,count);if(!indexes.length)throw Error("Enter pages to extract.");const out=await PDFLib.PDFDocument.create();(await out.copyPages(doc,indexes)).forEach(p=>out.addPage(p));await savePdf(out,"toolnest-extracted-pages.pdf");setStatus(`Extracted ${indexes.length} page(s).`);}
        else if(key==="remove") {const indexes=parsePages($("#pages").value,count);if(indexes.length>=count)throw Error("You cannot remove every page.");for(let i=count-1;i>=0;i--)if(indexes.includes(i))doc.removePage(i);await savePdf(doc,"toolnest-pages-removed.pdf");setStatus(`Removed ${indexes.length} page(s).`);}
        else if(key==="rotate") {const deg=+$("#degrees").value,indexes=parsePages($("#pages").value,count);indexes.forEach(i=>{const p=doc.getPage(i);p.setRotation(PDFLib.degrees((p.getRotation().angle+deg)%360));});await savePdf(doc,"toolnest-rotated.pdf");setStatus(`Rotated ${indexes.length} page(s) by ${deg} degrees.`);}
        else if(key==="watermark") {const text=$("#watermarkText").value.trim()||"CONFIDENTIAL",placement=$("#placement").value;doc.getPages().forEach(p=>{const {width,height}=p.getSize(),size=Math.max(16,Math.min(width,height)*.05);p.drawText(text,{x:placement==="center"?width*.16:width*.08,y:placement==="center"?height*.5:height*.06,size,color:PDFLib.rgb(.75,.12,.18),opacity:.25,rotate:PDFLib.degrees(placement==="center"?-25:0)});});await savePdf(doc,"toolnest-watermarked.pdf");setStatus("Watermark added to all pages.");}
        else if(key==="numbers") {doc.getPages().forEach((p,i)=>{const {width}=p.getSize();p.drawText(String(i+1),{x:width/2-4,y:18,size:10,color:PDFLib.rgb(.25,.28,.34)});});await savePdf(doc,"toolnest-numbered.pdf");setStatus("Page numbers added.");}
        else if(key==="compress") {const size=await savePdf(doc,"toolnest-optimized.pdf");setStatus(`PDF rewritten (${(size/1024).toFixed(1)} KB). This does not guarantee a smaller file; embedded images are not recompressed.`);}
      }
    } catch(e) {setStatus(e?.message||"Something went wrong. Try another file.",true);}
    finally {const b=$("#runTool");if(b){b.disabled=false;b.textContent=({merge:"Merge PDFs",split:"Split PDF",rotate:"Rotate pages",remove:"Remove selected pages",extract:"Extract selected pages",imagespdf:"Create PDF",pdfimages:"Convert to PNG",watermark:"Add watermark",numbers:"Add page numbers",info:"Read PDF information",text:"Extract text",compress:"Optimize PDF"})[key]||"Run tool";}}
  }
  $$(".tool-card").forEach(card=>card.addEventListener("click",()=>buildTool(card.dataset.tool)));
  $("#dialogClose").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  $("#toolSearch").addEventListener("input",filterTools);
  $("#toolSearch").addEventListener("keydown",e=>{if(e.key==="Escape"){e.target.value="";filterTools();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();e.target.focus();}});
  function filterTools(){const q=$("#toolSearch").value.toLowerCase().trim();let visible=0;$$(".tool-card").forEach(c=>{const match=(c.innerText+" "+c.dataset.keywords).toLowerCase().includes(q);c.hidden=!match;if(match)visible++;});$("#emptyState").hidden=visible>0;}
  $$(".filter-chip").forEach(chip=>chip.addEventListener("click",()=>{$$(".filter-chip").forEach(c=>c.classList.toggle("active",c===chip));const category=chip.dataset.filter;$$(".tool-card").forEach(card=>card.hidden=category!=="all"&&card.dataset.category!==category);$("#toolSearch").value="";$("#emptyState").hidden=$$(".tool-card:not([hidden])").length>0;}));
  $("#mobileMenu").addEventListener("click",()=>$(".main-nav").classList.toggle("open"));
  $$(".main-nav a").forEach(a=>a.addEventListener("click",()=>$(".main-nav").classList.remove("open")));
  $("#year").textContent=new Date().getFullYear();
  if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
})();