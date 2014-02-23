var appendView = function(view) {
  Ember.run(function() { view.appendTo('#qunit-fixture'); });
};

var set = function(object, key, value) {
  Ember.run(function() { Ember.set(object, key, value); });
};

var compile = function(template) {
  return Ember.Handlebars.compile(template);
};

var buildContainer = function(namespace) {
  var container = new Ember.Container();

  container.set = Ember.set;
  container.resolver = resolverFor(namespace);
  container.optionsForType('view', { singleton: false });
  container.optionsForType('template', { instantiate: false });
  container.register('application:main', namespace, { instantiate: false });
  container.injection('router:main', 'namespace', 'application:main');

  container.register('location:hash', Ember.HashLocation);

  container.register('controller:basic', Ember.Controller, { instantiate: false });
  container.register('controller:object', Ember.ObjectController, { instantiate: false });
  container.register('controller:array', Ember.ArrayController, { instantiate: false });

  container.typeInjection('route', 'router', 'router:main');

  return container;
};

function resolverFor(namespace) {
  return function(fullName) {
    var nameParts = fullName.split(":"),
        type = nameParts[0], name = nameParts[1];

    if (type === 'template') {
      var templateName = Ember.String.decamelize(name);
      if (Ember.TEMPLATES[templateName]) {
        return Ember.TEMPLATES[templateName];
      }
    }

    var className = Ember.String.classify(name) + Ember.String.classify(type);
    var factory = Ember.get(namespace, className);

    if (factory) { return factory; }
  };
}

var view, container;

module("Handlebars {{link-to}} helper", {
  setup: function() {
    var namespace = Ember.Namespace.create();
    container = buildContainer(namespace);
    container.register('view:default', Ember.View.extend());
    container.register('router:main', Ember.Router.extend());
  },
  teardown: function() {
    Ember.run(function () {
      if (container) {
        container.destroy();
      }
      if (view) {
        view.destroy();
      }
    });

    Ember.TEMPLATES = {};
  }
});

test("{{link-to}} error assertion should show a list of routes wihout implicit error/loading routes", function() {
  var template = "<h1>HI</h1>{{#link-to 'non.existent.route'}}Broken link{{/link-to}}";
  var controller = Ember.Controller.extend({container: container});
  view = Ember.View.create({
    controller: controller.create(),
    template: compile(template)
  });

  expectAssertion(function() {
    appendView(view);
  }, "The attempt to link-to route 'non.existent.route' failed. The router did not find 'non.existent.route' in its possible routes: 'index', 'application'");
});