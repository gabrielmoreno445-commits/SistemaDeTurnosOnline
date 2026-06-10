(()=>{let s=navigator.language;s.split("-")[0];class r{static voices=[];static groups=[];static log(e){var{level:e,msg:t}=this.getMessages(e);this.echo(e,t),this.sendGTag(e,t)}static echo(e,t){}static getMessages(e){var t,o,s={level:"warn",msg:""};return e.length&&([t,...o]=e,s.level=console[t]?t:"log",s.msg=console[t]?o.length?1===o.length?o[0]:o:t:1===e.length?t:e),s}static group(e){var[e,t,o]=e;this.groups.includes(e)?o||this.echo(`log group ${e} already exists!`):(this.groups.push(e),this.echo(t?"groupCollapsed":"group",e))}static groupEnd(e){e?(this.groups.map(e=>this.echo("groupEnd")),this.groups=[]):(this.groups.pop(),this.echo("groupEnd"))}static sendGTag(e,t){var o=`${r.getVoice()?.voiceURI}, ${n.translate_lang}/`+s;["error","warn"].includes(e)&&"function"==typeof gtag&&gtag("event","error"===e?"error":"warn",{event_category:""+t,event_label:o,value:"error"===e?1:0,non_interaction:!0})}static getVoice(e){return"undefined"!=typeof window?r.voices?.length?r.voices[void 0!==e?e:n.speech_voice]:(r.setVoices(),r.voices?.[n.speech_voice]):{voiceURI:"N/A"}}static setVoices(){return"undefined"==typeof window||r.voices?.length||(r.voices=window?.speechSynthesis?.getVoices()),r}}let o=(...e)=>r.log(e),n=(o.group=()=>e=>e,o.groupEnd=e=>e=>e,r.setVoices(),{enable:1,speech_voice:0,translate_lang:s.split("-")[0],rate:1.2,max_rate:1.4,volume:1,pitch:1,speaking_control:"voice",custom_translate_lang:{name:"",code:""},ui_lang:s.split("-")[0],voices_map:{}});console.clear_storage=()=>{chrome.storage.sync.clear().then(e=>o("storage clear"))},console.show_storage=()=>{new Promise((t,o)=>{chrome.storage.sync.get(null,e=>{if(chrome.runtime.lastError)return o(chrome.runtime.lastError);t(e)})}).then(e=>console.log(e))},(async()=>{let a={},i=0,c="",t=(chrome.runtime.onInstalled.addListener(async e=>{"update"===e?.reason&&t()}),()=>{}),g=(chrome.storage.onChanged.addListener(async function(e,t){"sync"===t&&(o("changes",e),await g())}),async e=>{try{Object.assign(a,await new Promise((t,o)=>{chrome.storage.sync.get("options",e=>{chrome.runtime.lastError?o(chrome.runtime.lastError):(Object.assign(n,e?.options),t(n))})})),i=1}catch(e){o("error",`Storage Error: ${e} 
`+e.stack)}});chrome.runtime.onMessageExternal.addListener(function(e,t,o){var s;if(e?.hasOwnProperty("badge")&&((s={text:e.badge}).text&&chrome.action.setBadgeText((["On","Off"].includes(s.text)&&chrome.action.setBadgeBackgroundColor({color:[0,0,0,+!("On"===s.text)]}),s))).then(),e?.hasOwnProperty("title")&&(c=e.title),(e?.hasOwnProperty("options")||i)&&(i=0,o({options:a})),e?.hasOwnProperty("timedtext")&&o({timedtext:_timedtextUrl,headers:_timedtextHeaders})&&console.log("[timedtext] :: url",_timedtextUrl,"headers: ",_timedtextHeaders)&&(_timedtextUrl=null||1),e?.hasOwnProperty("update")){for(var[r,n]of Object.entries(e.update))a.hasOwnProperty(r)&&(a[r]=n);chrome.storage.sync.set({options:a},async e=>{await g()})}}),chrome.runtime.onMessage.addListener(function(e,t,o){"now_playing"===e.question&&o({answer:"now_playing",msg:c})}),await g()})();

let _timedtextUrl = null;
let _timedtextHeaders = null
chrome.webRequest.onBeforeSendHeaders.addListener(
  (e) => {
    //console.log(e)
    if (e.tabId) {
      const r = e.url;
      if(r.includes("/api/timedtext")){
        _timedtextUrl = r        
      }      
      const o = {};
      if (e.requestHeaders)
        for (const s of e.requestHeaders) {
          const a = s.name.toLowerCase();
          a.search("x-") == 0 && (o[a] = s.value);
        }
        _timedtextHeaders = o
        //console.log(`url: ${r}, headers:`,_timedtextHeaders);
        // headers
      //console.log("r2", r, o, e.tabId);
      //chrome.tabs.sendMessage(e.tabId, { url: r, requestHeaders: o });
    }
  },
  { urls: ["*://*.youtube.com/api/timedtext*"] },
  ["requestHeaders", "extraHeaders"]
);
})();