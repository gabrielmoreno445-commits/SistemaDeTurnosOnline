chrome.webNavigation.onCompleted.addListener(t=>{chrome.scripting.executeScript({target:{tabId:t.tabId},files:["/content-script/content-script.js"]})},{url:[{schemes:["http","https"]}]});
