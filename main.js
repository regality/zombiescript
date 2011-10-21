var zs = zs || {};

/**************************************************
 * Undead settings                                *
 **************************************************/

zs.settings = zs.settings || {};

zs.settings.mode = zs.settings.mode || 'dev';
zs.settings.debug = zs.settings.debug || false;
zs.settings.baseUrl = zs.settings.baseUrl || '';

/**************************************************
 * Util functions                                *
 **************************************************/

zs.util = zs.util || {};

zs.util.scripts = zs.util.scripts || {};
zs.util.stylesheets = zs.util.stylesheets || {};

zs.util.require = function (js, callback) {
   var sp = js.split('/', 2);
   var module = sp[0];
   var file = sp[1];
   if (zs.settings.mode == 'dev') {
      url = '/js/' + module + '/' + file + '.js';
   } else if (zs.settings.mode == 'prod') {
      url = '/build/' + zs.settings.version + '/js/' + 
            module + '/' + file + '.js';
   }
   zs.util.importJs(url, callback);
};

zs.util.importJs = function (url, callback) {
   if (typeof zs.util.scripts[url] === "undefined") {
      var ajaxData = {"url" : zs.settings.baseUrl + url,
                      "dataType" : "script",
                      "cache" : true};
      if (typeof callback == "function") {
         ajaxData.success = callback;
      } else {
         ajaxData.async = false;
      }
      zs.util.scripts[url] = "loaded";
      $.ajax(ajaxData);
   } else if (typeof callback == "function") {
      callback();
   }
};

zs.util.loadCSS = function (name) {
   var url;
   if (zs.settings.mode == 'dev') {
      url = "/css/" + name + ".css";
   } else {
      url = "build/" + zs.settings.version + "/css/" + name + ".css";
   }
   if (typeof zs.util.stylesheets[url] === "undefined") {
      var link = $("<link />");
      link.attr({
         rel : "stylesheet",
         type : "text/css",
         href : zs.settings.baseUrl + url
      });
      $("head").append(link);
      zs.util.stylesheets[url] = "loaded";
   }
};

/**************************************************
 * Init functions                                 *
 **************************************************/

zs.init = {};

zs.init.init = function () {
   if (typeof JSON === "undefined") {
      zs.util.require("zombiescript/json2");
   }
   zs.util.require('zombiescript/ui');
   zs.util.require('zombiescript/crypt');
   zs.util.require('zombiescript/stack');
   zs.util.require('zombiescript/token');
   zs.init.setupAjax();
   zs.stack.init();
   zs.init.bindEvents();
};

zs.init.bindEvents = function() {
   $("a").live('click', function (e) {
      var href, re, app, action, data, i, pairs, pair;
      href = $(this).attr("href");
      re = href.match(/^\/([a-z_]+)\/?([a-z_]+)?\??(.*)$/);
      if (re !== null) {
         e.preventDefault();
         app = re[1];
         if (typeof re[2] === "undefined") {
            if (zs.stack.size(app) === 0) {
               zs.stack.push(app);
            } else if (zs.stack.size(app) === 1 &&
                       $(this).attr("refresh") != "no") {
               zs.stack.refresh(app);
            } else {
               zs.stack.focus(app);
            }
         } else {
            action = re[2];
            data = {};
            if (typeof re[3] !== "undefined") {
               pairs = re[3].split('&');
               for (i = 0; i < pairs.length; i += 1) {
                  pair = pairs[i].split('=');
                  if (typeof pair[1] === "undefined") {
                     data[pair[0]] = '';
                  } else {
                     data[pair[0]] = pair[1];
                  }
               }
            }
            zs.stack.push(app, action, data);
         }
      }
   });
}

// setup ajax for the zs
zs.init.setupAjax = function () {
   $.ajaxSetup({
      "dataType" : "json",
      "url" : zs.settings.baseUrl + "/app.php",
      "cache" : "false",
      "error" : function (xhr, status, error) {
         zs.ui.warn('An error occured:' + error + status);
      },
      "dataFilter" : function (rawData, type) {
         var data, mesg, i;
         if (zs.settings.debug) {
            zs.ui.message('raw data:' + rawData);
         }
         if (type === "json") {
            try {
               data = $.parseJSON(rawData);
               if (data.status === "logged out") {
                  zs.stack.push("login");
               } else if (data.status === "reload") {
                  window.location.assign(zs.settings.baseUrl);
               }
               if (typeof data.query !== "undefined") {
                  zs.ui.message(data.query);
               }
               if (typeof data.php_errors === "object") {
                  for (i = 0; i < data.php_errors.length; i += 1) {
                     mesg = data.php_errors[i].errstr + " in " +
                            data.php_errors[i].errfile + " on line " +
                            data.php_errors[i].errline + ".";
                     zs.ui.error(mesg, data.php_errors[i].errno);
                  }
               }
               if (typeof data.errors === "object") {
                  for (i = 0; i < data.errors.length; i += 1) {
                     zs.ui.error(data.errors[i]);
                  }
               }
               if (typeof data.messages === "object") {
                  for (i = 0; i < data.messages.length; i += 1) {
                     zs.ui.message(data.messages[i]);
                  }
               }
               if (typeof data.warnings === "object") {
                  for (i = 0; i < data.warnings.length; i += 1) {
                     zs.ui.warn(data.warnings[i]);
                  }
               }
            } catch (e) {
               // this needs to only catch json exceptions
               zs.ui.error('error parsing json:' + rawData);
            }
         } else {
            if (rawData === "logged out") {
               zs.stack.push("login");
            }
         }
         return rawData;
      },
      "timeout" : 10000,
      "type" : "get"
   });

   $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
      var csrf;
      if (typeof options.data !== "undefined" &&
          options.data.search("app=csrf") === -1 &&
          options.data.search("csrf=") === -1) {
         csrf = "csrf=" + zs.token.get();
         if (options.data.length > 0) {
            csrf = "&" + csrf;
         }
         options.data += csrf;
      }
      if (options.dataType != "script") {
         if (typeof options.data !== "undefined") {
            options.data += "&format=" + options.dataType;
         } else {
            options.data = "format=" + options.dataType;
         }
      }
      if (zs.settings.debug) {
         zs.ui.message("ajax data:" + options.data);
      }
   });
};
