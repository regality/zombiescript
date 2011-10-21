zs.test = {};

zs.test.run = function() {
   zs.util.require("zombiescript/qunit");
   zs.util.require("zombiescript/crypt");
   zs.util.require("zombiescript/stack");
   zs.util.loadCSS("test");
   QUnit.done = function() {
      $.ajaxSetup({"async" : true});
      zs.stack.focus("test");
   };
   $.ajaxSetup({"async" : false});
   zs.test.runTests();
};

zs.test.runTests = function() {
   module("zombiescript stack", {
      setup: function() {
         $("#" + testStack + "-stack").remove();
      },
      teardown: function() {
         $("#" + testStack + "-stack").remove();
      }
   });

   var testStack = "welcome";

   test("stack push, pop and size", function() {
      equals(zs.stack.size(testStack), 0, "empty stack has size 0");

      zs.stack.push(testStack);
      equals(zs.stack.size(testStack), 1, "push stack to size 1");

      zs.stack.push(testStack);
      equals(zs.stack.size(testStack), 2, "push stack to size 2");

      zs.stack.pop(testStack);
      equals(zs.stack.size(testStack), 1, "pop stack to size 1");

      zs.stack.pop(testStack);
      equals(zs.stack.size(testStack), 1, "stack popped empty refreshes");
   });

   test("stack focus", function() {
      equal(zs.stack.size(testStack), 0, "verify stack is empty");
      zs.stack.focus(testStack);
      equal(zs.stack.size(testStack), 1, "focus on empty stack pushes it");
      zs.stack.focus(testStack);
      equal(zs.stack.size(testStack), 1, "focus on non-empty stack focuses it");
   });

   test("stack empty", function() {
      zs.stack.push(testStack);
      zs.stack.push(testStack);
      notEqual(zs.stack.size(testStack), 0, "pushed stack is not empty");
      zs.stack.empty(testStack);
      equal(zs.stack.size(testStack), 0, "emptied stack is empty");
   });

   test("stack refresh", function() {
      equal(zs.stack.size(testStack), 0, "verify stack is empty");
      zs.stack.refresh(testStack);
      equal(zs.stack.size(testStack), 1, "refreshing empty stack pushes it");
      zs.stack.push(testStack);
      zs.stack.refresh(testStack);
      equal(zs.stack.size(testStack), 2, "refreshing empty stack pushes it");
   });

   test("stack top action", function() {
      equal(zs.stack.topAction(testStack), undefined);

      zs.stack.push(testStack, "index");
      equal(zs.stack.topAction(testStack), "index", "top action is index");

      zs.stack.push(testStack, "foo");
      equal(zs.stack.topAction(testStack), "foo", "top action is foo");
   });

   test("stack active name", function() {
      zs.stack.focus(testStack);
      equal(zs.stack.activeName(), testStack, "focus makes stack active");
   });

   test("stack pop active", function() {
      zs.stack.push(testStack);
      zs.stack.push(testStack);
      equal(zs.stack.size(testStack), 2, "two pushes makes size 2");
      zs.stack.popActive(testStack);
      equal(zs.stack.size(testStack), 1, "popActive pops active stack");
   });

   module("zombiescript token");

   test("token get and set", function() {
      var token = zs.token.get();
      notEqual(token, '', "token should not be empty");

      zs.token.set('');
      token = zs.token.token;
      equal(token, '', "token is empty");

      token = zs.token.get();
      notEqual(token, '', "token is re-requested");
   });

   module("zombiescript crypt");

   test("crypt hash function", function() {
      var s1 = zs.crypt.hash('');
      var h1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      var s2 = zs.crypt.hash('kachow');
      var h2 = "4b3130877b5c6008a9be52a35bda5d8419ae43c5ae3b5deab16be3f42d3dd0a8";
      equal(s1, h1, "empty hash");
      equal(s2, h2, "nonempty hash");
   });

   module("zombiescript ui form", {
      setup: function() {
         zs.stack.push("test", "form");
         var form = $("#testform");
         var requiredField = form.find("input[name=required]");
         var novalidateField = form.find("input[name=novalidate]");
         var minlenField = form.find("input[name=minlen]");
         var maxlenField = form.find("input[name=maxlen]");
         var numberField = form.find("input[name=number]");
         var intField = form.find("input[name=int]");
         var formatField = form.find("input[name=format]");
         var multipleField = form.find("input[name=multiple]");
         var customField = form.find("input[name=custom]");
         requiredField.val("value");
         novalidateField.val("");
         minlenField.val("two");
         maxlenField.val("ten");
         numberField.val("10.5");
         intField.val("10");
         formatField.val("foo@bar.com");
         multipleField.val("1000");
         customField.val("custom");
      },
      teardown: function() {
         zs.stack.pop("test");
      }
   });

   test("verify form", function() {
      var form = $("#testform");
      var pass = zs.ui.verifyForm(form);
      ok(pass, "form is ready");
   });

   test("verify form required", function() {
      var form = $("#testform");
      form.find("input[name=required]").val("");
      ok(!zs.ui.verifyForm(form), "required field cannot be empty");
   });

   test("verify form minlen", function() {
      var form = $("#testform");
      form.find("input[name=minlen]").val("a");
      ok(!zs.ui.verifyForm(form), "minlen field cannot be too short");

      form.find("input[name=minlen]").val("aa");
      ok(zs.ui.verifyForm(form), "minlen can be exact size");

      form.find("input[name=minlen]").val("aaa");
      ok(zs.ui.verifyForm(form), "minlen can be longer");
   });

   test("verify form maxlen", function() {
      var form = $("#testform");
      form.find("input[name=maxlen]").val("a");
      ok(zs.ui.verifyForm(form), "maxlen can be shorter");

      form.find("input[name=maxlen]").val("1234567890");
      ok(zs.ui.verifyForm(form), "maxlen can be exact size");

      form.find("input[name=maxlen]").val("1234567890x");
      ok(!zs.ui.verifyForm(form), "maxlen cannot be longer");
   });

   test("verify form number", function() {
      var form = $("#testform");

      form.find("input[name=number]").val("100");
      ok(zs.ui.verifyForm(form), "number can be an integer");

      form.find("input[name=number]").val("100.00");
      ok(zs.ui.verifyForm(form), "number can be a float");

      form.find("input[name=number]").val("two");
      ok(!zs.ui.verifyForm(form), "number cannot be non-numeric");
   });

   test("verify form int", function() {
      var form = $("#testform");

      form.find("input[name=int]").val("100");
      ok(zs.ui.verifyForm(form), "int can be an int");

      form.find("input[name=int]").val("100.00");
      ok(!zs.ui.verifyForm(form), "int must not have decimal point");

      form.find("input[name=int]").val("100.5");
      ok(!zs.ui.verifyForm(form), "int must not be a float");

      form.find("input[name=int]").val("two");
      ok(!zs.ui.verifyForm(form), "int must not be non-numeric");
   });

   test("verify form email", function() {
      var form = $("#testform");

      form.find("input[name=format]").val("email");
      ok(!zs.ui.verifyForm(form), "email must not be a non-email");

      form.find("input[name=format]").val("email@email");
      ok(!zs.ui.verifyForm(form), "email must not be a non-email");

      form.find("input[name=format]").val("email@email.com");
      ok(zs.ui.verifyForm(form), "email must be an email");
   });

   test("verify form multiple", function() {
      var form = $("#testform");

      form.find("input[name=multiple]").val("");
      ok(!zs.ui.verifyForm(form), "required cannot be empty");

      form.find("input[name=multiple]").val("1");
      ok(!zs.ui.verifyForm(form), "minlen must be met");

      form.find("input[name=multiple]").val("1000000");
      ok(!zs.ui.verifyForm(form), "maxlen must be met");

      form.find("input[name=multiple]").val("1000");
      ok(zs.ui.verifyForm(form), "must be number len 2-5");
   });

   test("verify form custom error", function() {
      var form = $("#testform");

      form.find("input[name=custom]").val("");
      zs.ui.verifyForm(form);
      var custom = form.find("input[name=custom]")
                       .parent().parent().find(".error")
                       .text().trim();
      equal(custom, "This is a custom error.", "custom error field must be correct");
   });

};
