(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();const n=document.querySelector("#app");n.innerHTML=`
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#333">
    <h1 style="font-size:2rem;margin-bottom:0.5rem">Demo 项目</h1>
    <p style="font-size:1rem;color:#666">mtbbs 仓库多项目构建部署验证</p>
    <p style="font-size:0.85rem;color:#999;margin-top:2rem">
      <a href="https://github.com/qcxs/mtbbs" target="_blank" style="color:#4361ee">qcxs/mtbbs</a>
    </p>
  </div>
`;
