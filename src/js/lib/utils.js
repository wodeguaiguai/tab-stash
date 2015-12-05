var c = chrome;

var u = {

    init: function() {
        this.bindEvents();
    },

    bookmark: {
        id: null,
        title:  "tab-stash",
        children: null
    },

    bindEvents: function () {
        this.initBookmarkFolder();
        this.iconEvent();
        this.contextMenuEvent();
        this.bookmarkModifyEvent();
    },

    initBookmarkFolder: function(){
        var self = this;
        // 如果没有创建书签文件夹，先创建一个
        c.bookmarks.search({title: self.bookmark.title}, function (bookmark) {
            if(bookmark.length ===0){
                c.bookmarks.create({title: self.bookmark.title}, function(bm){
                    self.bookmark.id = bm.id;
                    if(bm.children && bm.children.length) {
                        self.bookmark.children = bm.children;
                    }
                });
            }else{
                bookmark = bookmark[0];
                self.bookmark.id = bookmark.id;
                if(bookmark.children && bookmark.children.length) {
                    self.bookmark.children = bookmark.children;
                }
            }
        })
    },

    iconEvent: function(){
        var self = this;
        c.browserAction.onClicked.addListener(function (argument) {
            self.stash();
        });
    },

    contextMenuEvent: function () {
        var self = this;
        c.contextMenus.create({
            title:chrome.i18n.getMessage("extMenuTitle"),
            contexts:['all'],
            onclick: function (argument) {
                self.stash();
            }
        });
    },

    stash: function(options) {
        var self = this;
        this.getAllTabs(function (tabs) {
            console.log(tabs);
            self.saveToBookmark(tabs);
        });
    },

    closeTab: function(tabId, callback){
        c.tabs.remove(tabId, callback);
    },

    getAllTabs: function (callback) {
        c.windows.getCurrent(function (win) {
            c.tabs.query( {'windowId': win.id}, function (tabs) {
                callback && callback(tabs);
            });
        });
    },

    saveToBookmark: function (tabs,callback) {
        var self = this;

        function saveTab(tab, parentBookmarkId, callback){
            console.log(tab);
            c.bookmarks.create({
                title: tab.title,
                index: tab.index,
                url:   tab.url,
                parentId: parentBookmarkId
            },function (result) {
                callback && callback(tab, result);
            });
        }

        function saveAllTabs(currentTab){
            c.bookmarks.create({title: currentTab.title, parentId: self.bookmark.id}, function (bm) {
                for(var i = 0; i < tabs.length; i++) {
                    (function(index,length){
                        saveTab(tabs[i], bm.id, function(tab){
                            self.closeTab(tab.id);
                        });
                    })(i, tabs.length);
                }
            });
        }

        c.tabs.query({active:true, currentWindow: true},function(tabs){
            c.tabs.create({active: true});
            saveAllTabs(tabs[0]);
        });

    },

    bookmarkModifyEvent: function(){
        var self = this;
        c.bookmarks.onRemoved.addListener(function () {
            self.initBookmarkFolder();
        });
        c.bookmarks.onChanged.addListener(function () {
            self.initBookmarkFolder();
        });
        c.bookmarks.onMoved.addListener(function () {
            self.initBookmarkFolder();
        });
    }
}


module.exports = u