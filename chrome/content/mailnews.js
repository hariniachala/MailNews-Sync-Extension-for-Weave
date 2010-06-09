/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bookmarks Sync.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Myk Melez <myk@mozilla.org>
 *  Jono DiCarlo <jdicarlo@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const EXPORTED_SYMBOLS = ['MailNewsEngine', 'MailNewsSetRecord'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://weave/util.js");
Cu.import("resource://weave/engines.js");
Cu.import("resource://weave/stores.js");
Cu.import("resource://weave/trackers.js");
Cu.import("resource://mailnews-sync/type_records/mailnews.js");
Cu.import("resource://weave/engines/clients.js");
Cu.import("resource://weave/base_records/crypto.js");

function MailNewsSetRecord(uri) {
  CryptoWrapper.call(this, uri);
}
MailNewsSetRecord.prototype = {
  __proto__: CryptoWrapper.prototype,
  _logName: "Record.MailNews",
};

Utils.deferGetSet(MailNewsSetRecord, "cleartext", ["messageId", "flagged", "readStatus"]);

function MailNewsEngine() {
  SyncEngine.call(this, "MailNews");
  this._log.debug("MailNews!!!!!!!!!!!!!!!!!!!"); //TODO: Remove
  // Reset the client on every startup so that we fetch recent tabs
  this._resetClient();
}
MailNewsEngine.prototype = {
  __proto__: SyncEngine.prototype,
  _storeObj: MailNewsStore,
  _trackerObj: MailNewsTracker,
  _recordObj: MailNewsSetRecord,

  /*
  // API for use by Weave UI code to give user choices of tabs to open:
  getAllClients: function MailNewsEngine_getAllClients() {
    return this._store._remoteClients;
  },

  getClientById: function MailNewsEngine_getClientById(id) {
    return this._store._remoteClients[id];
  },
  */
  _resetClient: function MailNewsEngine__resetClient() {
    SyncEngine.prototype._resetClient.call(this);
    this._store.wipe();
  },

  /* The intent is not to show tabs in the menu if they're already
   * open locally.  There are a couple ways to interpret this: for
   * instance, we could do it by removing a tab from the list when
   * you open it -- but then if you close it, you can't get back to
   * it.  So the way I'm doing it here is to not show a tab in the menu
   * if you have a tab open to the same URL, even though this means
   * that as soon as you navigate anywhere, the original tab will
   * reappear in the menu.
   
  locallyOpenTabMatchesURL: function MailNewsEngine_localTabMatches(url) {
    return this._store.getAllTabs().some(function(tab) {
      return tab.urlHistory[0] == url;
    });
  }*/
};


function MailNewsStore(name) {
  Store.call(this, name);
}
MailNewsStore.prototype = {
  __proto__: Store.prototype,

  itemExists: function MailNewsStore_itemExists(id) {
    //TODO
   // return id == Clients.localID;
   return false;
  },
  
  /*
  getAllTabs: function getAllTabs(filter) {
    let filteredUrls = new RegExp(Svc.Prefs.get("engine.tabs.filteredUrls"), "i");

    let allTabs = [];

    let currentState = JSON.parse(Svc.Session.getBrowserState());
    currentState.windows.forEach(function(window) {
      window.tabs.forEach(function(tab) {
        // Make sure there are history entries to look at.
        if (!tab.entries.length)
          return;
        // Until we store full or partial history, just grab the current entry.
        // index is 1 based, so make sure we adjust.
        let entry = tab.entries[tab.index - 1];

        // Filter out some urls if necessary. SessionStore can return empty
        // tabs in some cases - easiest thing is to just ignore them for now.
        if (!entry.url || filter && filteredUrls.test(entry.url))
          return;

        // weaveLastUsed will only be set if the tab was ever selected (or
        // opened after Weave was running). So it might not ever be set.
        // I think it's also possible that attributes[.image] might not be set
        // so handle that as well.
        allTabs.push({
          title: entry.title || "",
          urlHistory: [entry.url],
          icon: tab.attributes && tab.attributes.image || "",
          lastUsed: tab.extData && tab.extData.weaveLastUsed || 0
        });
      });
    });

    return allTabs;
  },*/

  createRecord: function createRecord(guid) {
  	this._log.debug("GUID: "+guid); //TODO: Remove
    // Return the cached one if we have it:
     //let record = this.cache.get(guid);
     //if (record)
      // return record;
     // Otherwise, instantiate:
    var ar= guid.split("@");
    var key = ar[1];
    record = new MailNewsSetRecord();
    var isRead =false; var isFlagged=false; var messageId ="";
    var dbHdr = null;
    try{
      var rootFolderList = this.getRootFolderList();
      var subFolderList = this.getSubFolderList(rootFolderList);
      var msgDbList = this.getMsgDbList(subFolderList);
      for(var i=0; i<msgDbList.length; i++){
        var exists = msgDbList[i].QueryInterface(Components.interfaces.nsIMsgDatabase).ContainsKey(key);
        if(exists)
 	 	dbHdr = msgDbList[i].QueryInterface(Components.interfaces.nsIMsgDatabase).GetMsgHdrForKey(key);
      }
    }
    catch(e)
    {
    this._log.debug("ERROR!!!!!!!!!!!!!!: "+e.toString());
    }
    if(dbHdr!=null)
    {
    	isRead = dbHdr.isRead;
    	isFlagged = dbHdr.isFlagged;
    	messageId = dbHdr.messageId;
    	this._log.debug("ID: "+messageId + " , FLAGGED: "+isFlagged+" , READ: "+isRead);
    }
    //const nsMsgKey = guid;
    record.id = Utils.makeGUID();
    record.messageId = messageId;
    record.flagged = isFlagged; //TODO
    record.readStatus = isRead;
// Add it to the cache:
//     /this.cache.put(guid, record);
     // return the record
     return record;
  },

  getAllIDs: function MailNewsStore_getAllIds() {
    return [];
   	//TODO
     // Return a list of the GUIDs of all items.  Invent GUIDs for any items
     // that don't have them already, and remember the mapping for later use.
  },

  wipe: function MailNewsStore_wipe() {
    //this._remoteClients = {};
  },

  create: function MailNewsStore_create(record) {
     var msgHdr = null;
     try{
       this._log.debug("CREATE!!!!!!!!!!!!!!");
       var rootFolderList = this.getRootFolderList();
       var subFolderList = this.getSubFolderList(rootFolderList);
       var msgDbList = this.getMsgDbList(subFolderList);
       for(var i=0; i<msgDbList.length; i++){
       	 msgHdr = msgDbList[i].getMsgHdrForMessageID(record.messageId);
         if(msgHdr!=null)
         {
           msgHdr.markRead(record.readStatus);
           msgHdr.markFlagged(record.flagged);
           //dump("Message "+i+" in folder "+ folder.name +" is read: "+msgHdr.isRead);
         }
       }
    }  
    catch(e)
    {
     this._log.debug("ERROR!!!!!!!!!!!!!!: "+e.toString());
    }
  },
  
  update: function(record) {
     // look up the stored record with id = record.id, then set
     // its values to those of new record
     var msgHdr = null;
     try{
       var rootFolderList = this.getRootFolderList();
       var subFolderList = this.getSubFolderList(rootFolderList);
       var msgDbList = this.getMsgDbList(subFolderList);
       for(var i=0; i<msgDbList.length; i++){
       	 msgHdr = msgDbList[i].getMsgHdrForMessageID(record.messageId);
         if(msgHdr!=null)
         {
           msgHdr.markRead(record.readStatus);
           msgHdr.markFlagged(record.flagged);
           //dump("Message "+i+" in folder "+ folder.name +" is read: "+msgHdr.isRead);
         }
       }
    }  
    catch(e)
    {
     this._log.debug("ERROR!!!!!!!!!!!!!!: "+e.toString());
    }
  },
  
  remove: function(record) {
     // look up the stored record with id = record.id, then delete it.
   },
   
   getRootFolderList: function(){
     var rootFolderList = new Array();
     var acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"].
     					getService(Components.interfaces.nsIMsgAccountManager);
     for (var i = 0; i < acctMgr.accounts.Count(); i++) {
       var account = acctMgr.accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount);
       var rootFolder = account.incomingServer.rootFolder; // nsIMsgFolder
       this._log.debug("Root folder: "+rootFolder.name);
       if(rootFolder.server.type =="rss")
       {
         rootFolderList.push(rootFolder);
       }
     }
     return rootFolderList;
   },
   
   getSubFolderList: function(rootFolderList){
     var subFolderList = new Array();
     for (var i = 0; i < rootFolderList.length; i++){
       var subFolders = rootFolderList[i].subFolders; // nsIMsgFolder
       while(subFolders.hasMoreElements()){
         var folder = subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
         subFolderList.push(folder);
       }	
     }
     return subFolderList;
   },
   
   getMsgDbList: function(subFolderList){
     var msgDbList = new Array();
     for (var i = 0; i < subFolderList.length; i++){
       msgDbList.push(subFolderList[i].msgDatabase);
     }
     return msgDbList;
   },
     
};

/*
var subFolder = rootFolderList[i].subFolders; // nsIMsgFolder
     while(subFolders.hasMoreElements()){
         var folder = subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
         var enumerator = folder.msgDatabase.EnumerateMessages();
      var i = 0;
      while(enumerator.hasMoreElements())
     {
      var msgHdr = enumerator.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
      msgHdr.markRead(true);
      //dump("Message "+i+" in folder "+ folder.name +" is read: "+msgHdr.isRead);
      i++;
      }
       }	
 */


function MailNewsTracker(name) {
  Tracker.call(this, name);
  var nsIFolderListener = Components.interfaces.nsIFolderListener;
  var notifyFlags = nsIFolderListener.propertyFlagChanged;
  var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
  mailSession.AddFolderListener(this, notifyFlags);
}

MailNewsTracker.prototype = {
  __proto__: Tracker.prototype,
  // _logName: "MailNewsTracker",
    //file: "mailnews",
   /*
   _init: function MailNewsTracker_init() {
     // The ugly syntax on the next line calls the base class's init method:
     this.__proto__.__proto__._init.call(this);

	var nsIFolderListener = Components.interfaces.nsIFolderListener;
	var notifyFlags = nsIFolderListener.propertyFlagChanged  ;

	var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
	mailSession.AddFolderListener(this, notifyFlags);
   },*/
   
	OnItemPropertyFlagChanged: function (item, property, oldValue, newValue) {
	this._log.debug("CHANGED PROPERTY: "+property); //TODO: Remove
	var key= item.messageKey;
	//this._log.debug("KEY: "+key);
	var guid = Utils.makeGUID()+"@"+key;
	this.addChangedID(guid);
     // Update the score as you see fit:
    this._score += 100;
	}
	
 }

function RegisterMailNewsEngine()
{
	//this._log.debug("REGISTER");
Engines.register(new MailNewsEngine());
}
