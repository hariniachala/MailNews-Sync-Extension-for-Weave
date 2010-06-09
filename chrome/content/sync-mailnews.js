Components.utils.import("resource://weave/engines.js");
Components.utils.import("resource://mailnews-sync/engines/mailnews.js");

let MailNews = {
  init: function () {
  	
    try {
      Engines.register(new MailNewsEngine());
    }
    catch(e) {
      alert(e.toString());
    }   	
    
  }
}

window.addEventListener('load', MailNews.init, false);