function j(e){return e===null?"null":typeof e}function y(e){return!!e&&typeof e=="object"}function g(e){if(e===void 0)return"";if(e===null||typeof e=="object"&&!e.constructor)return"Object";var t=/function ([^(]*)/.exec(e.constructor.toString());return t&&t.length>1?t[1]:""}function w(e,t,r){return e==="null"||e==="undefined"?e:(e!=="string"&&e!=="stringifiable"||(r='"'+(r.replace(/"/g,'\\"')+'"')),e==="function"?t.toString().replace(/[\r\n]/g,"").replace(/\{.*\}/,"")+"{…}":r)}function u(e){var t="";return y(e)?(t=g(e),Array.isArray(e)&&(t+="["+e.length+"]")):t=w(j(e),e,e),t}function l(e){return"json-formatter-"+e}function s(e,t,r){var n=document.createElement(e);return t&&n.classList.add(l(t)),r!==void 0&&(r instanceof Node?n.appendChild(r):n.appendChild(document.createTextNode(String(r)))),n}(function(e){if(typeof window<"u"){var t=document.createElement("style");t.setAttribute("media","screen"),t.innerHTML=e,document.head.appendChild(t)}})(`.json-formatter-row {
  font-family: monospace;
}
.json-formatter-row,
.json-formatter-row a,
.json-formatter-row a:hover {
  color: black;
  text-decoration: none;
}
.json-formatter-row .json-formatter-row {
  margin-left: 1rem;
}
.json-formatter-row .json-formatter-children.json-formatter-empty {
  opacity: 0.5;
  margin-left: 1rem;
}
.json-formatter-row .json-formatter-children.json-formatter-empty:after {
  display: none;
}
.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-object:after {
  content: "No properties";
}
.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-array:after {
  content: "[]";
}
.json-formatter-row .json-formatter-string,
.json-formatter-row .json-formatter-stringifiable {
  color: green;
  white-space: pre;
  word-wrap: break-word;
}
.json-formatter-row .json-formatter-number {
  color: blue;
}
.json-formatter-row .json-formatter-boolean {
  color: red;
}
.json-formatter-row .json-formatter-null {
  color: #855A00;
}
.json-formatter-row .json-formatter-undefined {
  color: #ca0b69;
}
.json-formatter-row .json-formatter-function {
  color: #FF20ED;
}
.json-formatter-row .json-formatter-date {
  background-color: rgba(0, 0, 0, 0.05);
}
.json-formatter-row .json-formatter-url {
  text-decoration: underline;
  color: blue;
  cursor: pointer;
}
.json-formatter-row .json-formatter-bracket {
  color: blue;
}
.json-formatter-row .json-formatter-key {
  color: #00008B;
  padding-right: 0.2rem;
}
.json-formatter-row .json-formatter-toggler-link {
  cursor: pointer;
}
.json-formatter-row .json-formatter-toggler {
  line-height: 1.2rem;
  font-size: 0.7rem;
  vertical-align: middle;
  opacity: 0.6;
  cursor: pointer;
  padding-right: 0.2rem;
}
.json-formatter-row .json-formatter-toggler:after {
  display: inline-block;
  transition: transform 100ms ease-in;
  content: "►";
}
.json-formatter-row > a > .json-formatter-preview-text {
  opacity: 0;
  transition: opacity 0.15s ease-in;
  font-style: italic;
}
.json-formatter-row:hover > a > .json-formatter-preview-text {
  opacity: 0.6;
}
.json-formatter-row.json-formatter-open > .json-formatter-toggler-link .json-formatter-toggler:after {
  transform: rotate(90deg);
}
.json-formatter-row.json-formatter-open > .json-formatter-children:after {
  display: inline-block;
}
.json-formatter-row.json-formatter-open > a > .json-formatter-preview-text {
  display: none;
}
.json-formatter-row.json-formatter-open.json-formatter-empty:after {
  display: block;
}
.json-formatter-dark.json-formatter-row {
  font-family: monospace;
}
.json-formatter-dark.json-formatter-row,
.json-formatter-dark.json-formatter-row a,
.json-formatter-dark.json-formatter-row a:hover {
  color: white;
  text-decoration: none;
}
.json-formatter-dark.json-formatter-row .json-formatter-row {
  margin-left: 1rem;
}
.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty {
  opacity: 0.5;
  margin-left: 1rem;
}
.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty:after {
  display: none;
}
.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-object:after {
  content: "No properties";
}
.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-array:after {
  content: "[]";
}
.json-formatter-dark.json-formatter-row .json-formatter-string,
.json-formatter-dark.json-formatter-row .json-formatter-stringifiable {
  color: #31F031;
  white-space: pre;
  word-wrap: break-word;
}
.json-formatter-dark.json-formatter-row .json-formatter-number {
  color: #66C2FF;
}
.json-formatter-dark.json-formatter-row .json-formatter-boolean {
  color: #EC4242;
}
.json-formatter-dark.json-formatter-row .json-formatter-null {
  color: #EEC97D;
}
.json-formatter-dark.json-formatter-row .json-formatter-undefined {
  color: #ef8fbe;
}
.json-formatter-dark.json-formatter-row .json-formatter-function {
  color: #FD48CB;
}
.json-formatter-dark.json-formatter-row .json-formatter-date {
  background-color: rgba(255, 255, 255, 0.05);
}
.json-formatter-dark.json-formatter-row .json-formatter-url {
  text-decoration: underline;
  color: #027BFF;
  cursor: pointer;
}
.json-formatter-dark.json-formatter-row .json-formatter-bracket {
  color: #9494FF;
}
.json-formatter-dark.json-formatter-row .json-formatter-key {
  color: #23A0DB;
  padding-right: 0.2rem;
}
.json-formatter-dark.json-formatter-row .json-formatter-toggler-link {
  cursor: pointer;
}
.json-formatter-dark.json-formatter-row .json-formatter-toggler {
  line-height: 1.2rem;
  font-size: 0.7rem;
  vertical-align: middle;
  opacity: 0.6;
  cursor: pointer;
  padding-right: 0.2rem;
}
.json-formatter-dark.json-formatter-row .json-formatter-toggler:after {
  display: inline-block;
  transition: transform 100ms ease-in;
  content: "►";
}
.json-formatter-dark.json-formatter-row > a > .json-formatter-preview-text {
  opacity: 0;
  transition: opacity 0.15s ease-in;
  font-style: italic;
}
.json-formatter-dark.json-formatter-row:hover > a > .json-formatter-preview-text {
  opacity: 0.6;
}
.json-formatter-dark.json-formatter-row.json-formatter-open > .json-formatter-toggler-link .json-formatter-toggler:after {
  transform: rotate(90deg);
}
.json-formatter-dark.json-formatter-row.json-formatter-open > .json-formatter-children:after {
  display: inline-block;
}
.json-formatter-dark.json-formatter-row.json-formatter-open > a > .json-formatter-preview-text {
  display: none;
}
.json-formatter-dark.json-formatter-row.json-formatter-open.json-formatter-empty:after {
  display: block;
}
`);var k=/(^\d{1,4}[\.|\\/|-]\d{1,2}[\.|\\/|-]\d{1,4})(\s*(?:0?[1-9]:[0-5]|1(?=[012])\d:[0-5])\d\s*[ap]m)?$/,O=/\d{2}:\d{2}:\d{2} GMT-\d{4}/,C=/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,d=window.requestAnimationFrame||function(e){return e(),0},c={hoverPreviewEnabled:!1,hoverPreviewArrayCount:100,hoverPreviewFieldCount:5,animateOpen:!0,animateClose:!0,theme:null,useToJSON:!0,sortPropertiesBy:null,maxArrayItems:100,exposePath:!1},A=function(){function e(t,r,n,o,i,a,f){r===void 0&&(r=1),n===void 0&&(n=c),a===void 0&&(a=[]),this.json=t,this.open=r,this.config=n,this.key=o,this.displayKey=i,this.path=a,this.arrayRange=f,this._isOpen=null,this.config.hoverPreviewEnabled===void 0&&(this.config.hoverPreviewEnabled=c.hoverPreviewEnabled),this.config.hoverPreviewArrayCount===void 0&&(this.config.hoverPreviewArrayCount=c.hoverPreviewArrayCount),this.config.hoverPreviewFieldCount===void 0&&(this.config.hoverPreviewFieldCount=c.hoverPreviewFieldCount),this.config.useToJSON===void 0&&(this.config.useToJSON=c.useToJSON),this.config.maxArrayItems===void 0&&(this.config.maxArrayItems=c.maxArrayItems),this.key===""&&(this.key='""'),this.displayKey===void 0&&(this.displayKey=this.key)}return Object.defineProperty(e.prototype,"isOpen",{get:function(){return this._isOpen!==null?this._isOpen:this.open>0},set:function(t){this._isOpen=t},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isDate",{get:function(){return this.json instanceof Date||this.type==="string"&&(k.test(this.json)||C.test(this.json)||O.test(this.json))},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isUrl",{get:function(){return this.type==="string"&&this.json.indexOf("http")===0},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isArray",{get:function(){return Array.isArray(this.json)},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isLargeArray",{get:function(){return this.isArray&&this.json.length>this.config.maxArrayItems},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isArrayRange",{get:function(){return this.isArray&&this.arrayRange!==void 0&&this.arrayRange.length==2},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isObject",{get:function(){return y(this.json)},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isEmptyObject",{get:function(){return!this.keys.length&&!this.isArray},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isEmpty",{get:function(){return this.isEmptyObject||this.keys&&!this.keys.length&&this.isArray},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"useToJSON",{get:function(){return this.config.useToJSON&&this.type==="stringifiable"},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"hasKey",{get:function(){return this.key!==void 0},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"constructorName",{get:function(){return g(this.json)},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"type",{get:function(){return this.config.useToJSON&&this.json&&this.json.toJSON?"stringifiable":j(this.json)},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"keys",{get:function(){if(this.isObject){var t=Object.keys(this.json);if(this.isLargeArray){var r=Math.ceil(this.json.length/this.config.maxArrayItems);t=[];for(var n=0;n<r;n++){var o=n*this.config.maxArrayItems,i=Math.min(this.json.length-1,o+(this.config.maxArrayItems-1));t.push(o+" … "+i)}}return!this.isArray&&this.config.sortPropertiesBy?t.sort(this.config.sortPropertiesBy):t}return[]},enumerable:!1,configurable:!0}),e.prototype.toggleOpen=function(){this.isOpen=!this.isOpen,this.element&&(this.isOpen?this.appendChildren(this.config.animateOpen):this.removeChildren(this.config.animateClose),this.element.classList.toggle(l("open")))},e.prototype.openAtDepth=function(t){t===void 0&&(t=1),t<0||(this.open=t,this.isOpen=t!==0,this.element&&(this.removeChildren(!1),t===0?this.element.classList.remove(l("open")):(this.appendChildren(this.config.animateOpen),this.element.classList.add(l("open")))))},e.prototype.getInlinepreview=function(){var t=this;if(this.isArray)return this.json.length>this.config.hoverPreviewArrayCount?"Array["+this.json.length+"]":"["+this.json.map(u).join(", ")+"]";var r=this.keys,n=r.slice(0,this.config.hoverPreviewFieldCount).map(function(i){return i+":"+u(t.json[i])}),o=r.length>=this.config.hoverPreviewFieldCount?"…":"";return"{"+n.join(", ")+o+"}"},e.prototype.render=function(){this.element=s("div","row");var t=this.isObject?s("a","toggler-link"):s("span");if(this.isObject&&!this.useToJSON&&t.appendChild(s("span","toggler")),this.isArrayRange?t.appendChild(s("span","range","["+this.displayKey+"]")):this.hasKey&&(t.appendChild(s("span","key",this.displayKey+":")),this.config.exposePath&&(this.element.dataset.path=JSON.stringify(this.path))),this.isObject&&!this.useToJSON){var r=s("span","value"),n=s("span");if(!this.isArrayRange){var o=s("span","constructor-name",this.constructorName);n.appendChild(o)}if(this.isArray&&!this.isArrayRange){var i=s("span");i.appendChild(s("span","bracket","[")),i.appendChild(s("span","number",this.json.length)),i.appendChild(s("span","bracket","]")),n.appendChild(i)}r.appendChild(n),t.appendChild(r)}else{(r=this.isUrl?s("a"):s("span")).classList.add(l(this.type)),this.isDate&&r.classList.add(l("date")),this.isUrl&&(r.classList.add(l("url")),r.setAttribute("href",this.json));var a=w(this.type,this.json,this.useToJSON?this.json.toJSON():this.json);r.appendChild(document.createTextNode(a)),t.appendChild(r)}if(this.isObject&&this.config.hoverPreviewEnabled){var f=s("span","preview-text");f.appendChild(document.createTextNode(this.getInlinepreview())),t.appendChild(f)}var m=s("div","children");return this.isObject&&m.classList.add(l("object")),this.isArray&&m.classList.add(l("array")),this.isEmpty&&m.classList.add(l("empty")),this.config&&this.config.theme&&this.element.classList.add(l(this.config.theme)),this.isOpen&&this.element.classList.add(l("open")),this.element.appendChild(t),this.element.appendChild(m),this.isObject&&this.isOpen&&this.appendChildren(),this.isObject&&!this.useToJSON&&t.addEventListener("click",this.toggleOpen.bind(this)),this.element},e.prototype.appendChildren=function(t){var r=this;t===void 0&&(t=!1);var n=this.element.querySelector("div."+l("children"));if(n&&!this.isEmpty){var o=function(f,m){var h=r.isLargeArray?[m*r.config.maxArrayItems,Math.min(r.json.length-1,m*r.config.maxArrayItems+(r.config.maxArrayItems-1))]:void 0,p=r.isArrayRange?(r.arrayRange[0]+m).toString():f,b=new e(h?r.json.slice(h[0],h[1]+1):r.json[f],r.open-1,r.config,f,p,h?r.path:r.path.concat(p),h);n.appendChild(b.render())};if(t){var i=0,a=function(){var f=r.keys[i];o(f,i),(i+=1)<r.keys.length&&(i>10?a():d(a))};d(a)}else this.keys.forEach(function(f,m){return o(f,m)})}},e.prototype.removeChildren=function(t){t===void 0&&(t=!1);var r=this.element.querySelector("div."+l("children"));if(t){var n=0,o=function(){r&&r.children.length&&(r.removeChild(r.children[0]),(n+=1)>10?o():d(o))};d(o)}else r&&(r.innerHTML="")},e}();function P(e,t){const{theme:r="follow",hoverPreviewArrayCount:n=-1,hoverPreviewFieldCount:o=5}=t,i={hoverPreviewEnabled:!1,hoverPreviewArrayCount:n,hoverPreviewFieldCount:o,theme:r,animateOpen:!0,animateClose:!0,useToJSON:!0},a=new A(e,2,i);return a.openAtDepth(t.openAtDepthCount),a.render()}function v(e){try{return JSON.parse(e),!0}catch{return!1}}function x(){return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches}function S(e){return new Promise(t=>{chrome.storage.sync.get(e,function(r){const n=r[e];t(n)})})}function N(){if(document.contentType==="application/json"||document.contentType==="text/json")return!0;const e=document.querySelectorAll("body > pre");return!!(e.length===1&&document.body.childElementCount===1&&e[0].textContent&&v(e[0].textContent.trim())||window.location.pathname.endsWith(".json"))}function T(){if(!N())return;document.querySelectorAll("pre").forEach(async t=>{try{if(!t.textContent)return;const r=t.textContent.trim();if(r&&v(r)){const n=JSON.parse(r),o=await S("config"),i=J(o?.theme);document.body.style.backgroundColor=i==="dark"?"#222":"#fff";const a={theme:i,hoverPreviewArrayCount:o?.hoverPreviewArrayCount??100,hoverPreviewFieldCount:o?.hoverPreviewFieldCount??5,openAtDepthCount:o?.openAtDepthCount??5},f=await P(n,a);t.innerHTML="",t.appendChild(f)}}catch(r){console.error("Error beautifying JSON:",r)}})}function J(e){return e==="light"?"":e==="follow"||e===void 0?x()?"dark":"":e??"follow"}T();
