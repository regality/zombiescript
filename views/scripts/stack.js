/**************************************************
 * Stack functions                                *
 **************************************************/

zs.stack = {};

zs.stack.defaultApp = "welcome";
zs.stack.defaultAction = "index";
zs.stack.ignoreHash = false;
zs.stack.pushCallbacks = {};
zs.stack.popCallbacks = {};

// load the default application
zs.stack.loadDefault = function () {
   var re = window.location.hash.match(/([a-z_]+)\/?([a-z_]+)?\??(.*)?$/);
   if (re === null) {
      var loc = window.location.pathname;
      if (loc.substr(0, zs.settings.baseUrl.length) == zs.settings.baseUrl) {
         loc = loc.substr(zs.settings.baseUrl.length);
      }
      re = loc.match(/([a-z_]+)\/?([a-z_]+)?/);
   }
   if (typeof window.history.replaceState === "function") {
      window.history.replaceState({}, "", zs.settings.baseUrl + "/");
   }
   var data = {};
   if (re !== null) {
      if (typeof re[1] !== "undefined") {
         zs.stack.defaultApp = re[1];
      }
      if (typeof re[2] !== "undefined") {
         zs.stack.defaultAction = re[2];
      }
      if (typeof re[3] !== "undefined") {
         var pairs = re[3].split('&');
         for (i = 0; i < pairs.length; i += 1) {
            pair = pairs[i].split('=');
            if (typeof pair[1] === "undefined") {
               data[pair[0]] = '';
            } else {
               data[pair[0]] = pair[1];
            }
         }
      }
   }
   if (zs.stack.size(zs.stack.defaultApp) === 0 || 
       zs.stack.topAction(zs.stack.defaultApp) !== zs.stack.defaultAction)
   {
      zs.stack.push(zs.stack.defaultApp, zs.stack.defaultAction, data);
   } else {
      zs.stack.focus(zs.stack.defaultApp);
   }
};

// focus on a stack
zs.stack.focus = function (appStack) {
   var newHash;
   if (zs.stack.size(appStack) == 0) {
      zs.stack.push(appStack);
   } else {
      zs.stack.hide();
      $("#" + appStack + "-stack").show().attr("active","true");
      $("#" + appStack + "-stack").find(".app-content").hide();
      $("#" + appStack + "-stack").find(".app-content").last().show();
      $(".item").removeClass("active");
      $(".item[href^='/" + appStack + "']").addClass("active");
      newHash = "/" + appStack + "/" + zs.stack.topAction(appStack);
      if (!window.location.hash.match(newHash)) {
         window.location.hash = newHash;
      }
   }
};

zs.stack.hide = function(appStack) {
   if (!appStack) {
      $(".app-stack:visible").hide().attr("active",null);
   } else {
      $(".app-stack:app=[" + appStack + "]").hide().attr("active",null);
   }
}

// get the name of the active stack
zs.stack.activeName = function () {
   return $(".app-stack[active=true]").attr("app");
};

// pop the active stack
zs.stack.popActive = function (callback) {
   zs.stack.pop(zs.stack.activeName(callback));
};

// get the size of a stack
zs.stack.size = function (appStack) {
   return $("#" + appStack + "-stack").find(".app-content").length;
};

// get the top (most recent) action of a stack
zs.stack.topAction = function (appStack) {
   var action = $("#" + appStack + "-stack").find(".app-content").last().attr("action");
   return action;
};

// handle the changing of the hash
zs.stack.handleHashChange = function (hash) {
   var app, action, re;
   if (zs.stack.ignoreHash === false) {
      re = hash.match(/([a-z_]+)\/([a-z_]+)/);
      if (typeof re !== "undefined" && re != null) {
         app = re[1];
         action = re[2];
         if (zs.stack.size(app) > 1 && zs.stack.topAction(app) !== action) {
            zs.stack.pop(app);
         } else if (zs.stack.size(app) > 0) {
            zs.stack.focus(app);
         }
      } else {
         if (zs.stack.activeName() !== zs.stack.defaultApp) {
            zs.stack.focus(zs.stack.defaultApp);
         } else if (zs.stack.size(zs.stack.defaultApp) > 1) {
            zs.stack.pop(zs.stack.defaultApp);
         }
      }
   } else {
      zs.stack.ignoreHash = false;
   }
};

// event bindings
zs.stack.init = function() {
   $(window).bind('hashchange', function () {
      zs.stack.handleHashChange(window.location.hash);
   });

   $(".pop-active").live('click', function (e) {
      e.preventDefault();
      zs.stack.popActive();
   });

};

// refresh the top of a stack
zs.stack.refresh = function (appStack, callback) {
   var topFrame, data;
   if (zs.stack.size(appStack) == 0) {
      zs.stack.push(appStack, callback);
   } else {
      topFrame = $("#" + appStack + "-stack").find(".app-content").last();
      if (topFrame.attr("json")) {
         data = $.parseJSON(window.unescape(topFrame.attr("json")));
      } else {
         data = {"app" : appStack,
                 "action" : zs.stack.topAction(appStack)};
      }
      $.ajax({"data" : data,
              "dataType" : "html",
              success : function (data) {
                  topFrame.html(data);
                  zs.stack.focus(appStack);
                  zs.ui.logMessage("App Refreshed", "The app <i>" + 
                                    appStack + "." + topFrame.attr("action") + 
                                    "</i> was successfully refreshed");
                  if (callback) {
                     callback();
                  }
              }
      });
   }
};

// delete everything from a stack
zs.stack.empty = function (appStack) {
   $("#" + appStack + "-stack").find(".app-content").remove();
};

// pop a stack
zs.stack.pop = function (appStack, callback) {
   $("#" + appStack + "-stack").find(".app-content").last().remove();
   zs.stack.focus(appStack);
   if (typeof callback === "object") {
      callback();
   }
   zs.stack.runPopEvents(appStack);
};

// push onto a stack
zs.stack.push = function (appStack, appAction, data, callback) {
   var stackDiv, jsonStr, getParams, tmp;
   getParams = "";
   if (typeof callback === "undefined") {
      callback = function() {};
   }
   if (typeof appAction === "undefined") {
      appAction = "index";
   }
   if (typeof data === "undefined" || typeof data !== "object") {
      data = {"app" : appStack,
              "action" : appAction};
   } else {
      tmp = [];
      for (key in data) {
         tmp.push(key + "=" + data[key]);
      }
      if (tmp.length > 0) {
         getParams = "?" + tmp.join("&");
      }
      data.app = appStack;
      data.action = appAction;
   }
   stackDiv = $("#" + appStack + "-stack");
   if (stackDiv.length === 0) {
      stackDiv = $('<div app="' + appStack + '" class="app-stack" id="' + appStack + '-stack"></div>');
      $("#content").append(stackDiv);
   }
   jsonStr = window.escape(JSON.stringify(data));
   $.ajax({"data" : data,
           "dataType" : "html",
           "success" : function(data) {
               var div;
               zs.stack.ignoreHash = true;
               window.location.hash = "/" + appStack + "/" + appAction + getParams;
               div = '<div class="app-content" json="' + jsonStr + '" action="' + appAction + '">' + data + '</div>';
               stackDiv.append(div);
               stackDiv.show();
               zs.stack.focus(appStack);
               zs.ui.logMessage("App Loaded", "The app " + 
                                 appStack + "." + appAction + 
                                 " was successfully loaded");
               callback();
               zs.stack.runPushEvents(appStack);
           }
   });
};

zs.stack.getStackDiv = function(app) {
   var stackDiv = $("#" + app + "-stack");
   if (stackDiv.length === 0) {
      stackDiv = $('<div app="' + app + '" class="app-stack" id="' + app + '-stack"></div>');
      $("#content").append(stackDiv);
   }
   return stackDiv;
};

zs.stack.pushTemplate = function(app, action, data) {
   var html = zs.template.render(app, action, data);
   zs.stack.pushHtml(app, action, html);
};

// push onto a stack
zs.stack.pushHtml = function (appStack, appAction, html) {
   var stackDiv = zs.stack.getStackDiv(appStack);
   var contentDiv = $("<div/>");
   contentDiv.addClass("app-content").attr("action", appAction);
   contentDiv.html(html);
   stackDiv.append(contentDiv);
   zs.stack.ignoreHash = true;
   window.location.hash = "/" + appStack + "/" + appAction;
   zs.stack.focus(appStack);
   zs.ui.logMessage("App Loaded", "The app " + 
                     appStack + "." + appAction + 
                     " was successfully loaded");
   zs.stack.runPushEvents(appStack);
};

zs.stack.onPush = function(stack, callback) {
   zs.stack.addEvent(zs.stack.pushCallbacks, stack, callback);
};

zs.stack.runPushEvents = function(stack) {
   zs.stack.runEvents(zs.stack.pushCallbacks, stack);
};

zs.stack.onPop = function(stack, callback) {
   zs.stack.addEvent(zs.stack.popCallbacks, stack, callback);
};

zs.stack.runPopEvents = function(stack) {
   zs.stack.runEvents(zs.stack.popCallbacks, stack);
};

zs.stack.runEvents = function(eventObject, stack) {
   if (typeof eventObject[stack] === "object") {
      var events = eventObject[stack];
      for (var i = 0; i < events.length; ++i) {
         events[i]();
      }
   }
};

zs.stack.addEvent = function(eventObject, stack, callback) {
   if (typeof eventObject[stack] !== "object") {
      eventObject[stack] = [];
   }
   eventObject[stack].push(callback);
};
