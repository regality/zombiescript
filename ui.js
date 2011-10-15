/**************************************************
 * UI functions                                   *
 **************************************************/

zs.ui = {};

zs.ui.alertShowTime = 2000;

zs.ui.errorLevels = {
   100 : "Message",
   101 : "Warning",
   102 : "Error",
   2 : "PHP Warning",
   8 : "PHP Notice",
   512 : "PHP User Warning",
   1024 : "PHP User Notice",
   2048 : "PHP Strict"
};

// reports an error 
zs.ui.error = function (mesg, level) {
   var title;
   if (level != null) {
      title = zs.ui.errorLevels[level];
   } else {
      title = "error";
   }
   zs.ui.addAlert("error", title, mesg);
   zs.ui.logError(title, mesg);
};

// warning message
zs.ui.warn = function (mesg) {
   zs.ui.addAlert("warning", "warning", mesg);
   zs.ui.logError("Warning", mesg);
};

// you just wanted to say hi
zs.ui.message = function (mesg) {
   zs.ui.addAlert("message", "message", mesg);
   zs.ui.logMessage("message", mesg);
};

zs.ui.addAlert = function(type, title, mesg) {
   mesg = $("<div/>").text(mesg).html();
   mesg = mesg.replace(/\n/g,"<br />");
   var flash = $("<div style=\"display:none;\" class=\"" + type + "\"></div>");
   flash.html("<span class=\"title\">" + title + ":</span>" + mesg);
   $("#alerts").append(flash);
   flash.slideDown("slow", function() {
      $(this).animate({"left":1}, zs.ui.alertShowTime, function() {
         $(this).slideUp("slow");
      });
   });
   flash.click(function() {
      $(this).stop(true).css({"border-color":"black"}).unbind('click').click(function() {
         $(this).slideUp("slow");
      });
   });
}

// add a message to the console
zs.ui.logMessage = function (title, mesg) {
   var html = "<div class=\"console-title\">" + title + "</div>";
   zs.ui.consoleAdd(html, mesg);
};

// add an error to the console
zs.ui.logError = function (title, mesg) {
   var html;
   html = "<div class=\"console-error\">" + title + "</div>";
   // fix this ugly hack that doesn't work properly
   zs.ui.oldConsoleColor = $("a[href^='/console']").css("color");
   $("a[href^='/console']").css({"color" : "red", "font-weight" : "bold"}).click(function () {
      $(this).css({"color" : zs.oldConsoleColor, "font-weight" : "normal"});
   });
   zs.ui.consoleAdd(html, mesg);
};

// add html to the console
zs.ui.consoleAdd = function (html, text) {
   text = $("<div/>").text(text).html();
   text = text.replace(/\n/g,"<br />");
   var tr = $("<tr />");
   var td = $("<td />");
   td.html("<div class=\"console-mesg-close\">X</div>" + html + text);
   tr.append(td);
   $("#console-messages tr th").parent().after(tr);
};

// check for incomplete required fields
zs.ui.verifyForm = function (form) {
   var formDone = true;
   form.find("input, textarea, select").each(function () {
      var validator, value, tmp, format, re, errorDiv, offenseDiv;
      var validatorsStr = $(this).attr("validate");
      if (!validatorsStr) {
         return true;
      }
      var formValue = $(this).val();
      var formLabel = $(this).attr("name");
      var errorStr = '';
      var offense = null;
      var validators = validatorsStr.split(",");
      var label = $(this).parent().parent().find("label");
      if (label.length == 1) {
         formLabel = label.text();
      } else {
         formLabel = formLabel.replace("_", " ");
      }
      for (var i = 0; i < validators.length; ++i) {
         validator = validators[i];
         if (validator.match("=")) {
            tmp = validator.split("=");
            validator = tmp[0];
            value = tmp[1];
         }
         if (validator == "required") {
            if (!formValue) {
               errorStr = formLabel + " is required.";
               offense = validator;
            }
         } else if (validator == "maxlen") {
            if (formValue && formValue.length > value) {
               errorStr = formLabel + " is too long (max length " + value + ".)";
               offense = validator;
            }
         } else if (validator == "minlen") {
            if (formValue.length > 0 && formValue.length < value) {
               errorStr = formLabel + " is too short (min length " + value + ".)";
               offense = validator;
            }
         } else if (validator == "number") {
            if (formValue && isNaN(formValue)) {
               errorStr = formLabel + " must be a number.";
               offense = validator;
            }
         } else if (validator == "int") {
            if (formValue && parseInt(formValue) != formValue) {
               errorStr = formLabel + " must be a whole number.";
               offense = validator;
            }
         } else if (validator == "format") {
            format = value;
            re = new RegExp(format);
            if (formValue && !formValue.match(re)) {
               errorStr = formLabel + " is in the wrong format.";
               offense = validator;
            }
         }
      }
      errorDiv = $(this).parent().parent().find(".error");
      errorDiv.find("div").hide();
      if (offense) {
         offenseDiv = errorDiv.find("." + offense);
         if (offenseDiv.length == 0) {
            offenseDiv = $("<div/>");
            offenseDiv.addClass(offense).hide().html(errorStr);
            errorDiv.append(offenseDiv);
         }
         formDone = false;
         offenseDiv.hide().fadeIn();
         $(this).css({"background" : "#fdd"});
      } else {
         $(this).css({"background" : "#fff"});
      }
   });
   return formDone;
};

zs.ui.tinymceOptions = {
   script_url : zs.settings.baseUrl + '/build/tinymce/tiny_mce.js',
   theme : "simple"
};

zs.ui.wysiwyg = function (textarea) {
   zs.util.importJs('/build/tinymce/jquery.tinymce.js');
   $(textarea).tinymce(zs.ui.tinymceOptions);
};
