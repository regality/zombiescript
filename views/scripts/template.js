zs.template = zs.template || {};

zs.template.templates = [];

zs.template.load = function(app, view) {
   if (zs.settings.mode == 'dev') {
      var url = zs.settings.baseUrl + "/js/" + app + "/template/" + view + ".js";
   } else {
      var url = zs.settings.baseUrl + "/build/js/" + zs.settings.version + "/" + app + "/template/" + view + ".js";
   }
   zs.util.importJs(url);
};

zs.template.render = function(app, view, data) {
   zs.template.load(app, view);
   var template = app + "/" + view;
   if (!zs.template.templates[template]) {
      zs.ui.error("template '" + template + "' does not exist.");
   }
   var html = zs.template.templates[template](data);
   return html;
};
