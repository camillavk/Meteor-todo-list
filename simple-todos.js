Projects = new Mongo.Collection("projects");

if (Meteor.isClient) {
  Meteor.subscribe('projects')

  Template.body.helpers({
    projects: function () {
      if (Session.get("hideCompleted")) {
      return Projects.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
    } else {
      return Projects.find({}, {sort: {createdAt: -1}});
    }
  },
  hideCompleted: function () {
    return Session.get("hideCompleted");
  },
  incompleteCount: function () {
    return Projects.find({checked: {$ne: true}}).count();
  }
  });

  Template.body.events({
    'submit .new-project': function (event) {
      var text = event.target.text.value;

      Meteor.call('addProject', text);

      event.target.text.value = '';
      return false;
    },
    'change .hide-completed input': function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.project.events({
    'click .toggle-checked': function() {
      Meteor.call('setChecked', this._id, ! this.checked);
    },
    'click .delete': function () {
      Meteor.call('deleteProject', this._id);
    },
    'click .toggle-private': function () {
      Meteor.call('setPrivate', this._id, ! this.private);
    }
  });

  Template.project.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
  });
  }

  Meteor.methods({
    addProject: function (text) {
      if (! Meteor.userId()) {
        throw new Meteor.Error("not-authorized");
      }

      Projects.insert({
        text: text,
        createdAt: new Date(),
        owner: Meteor.userId(),
        username: Meteor.user().username
      });
    },
    deleteProject: function (projectId) {
      var project = Projects.findOne(projectId);
      if (project.private && project.owner !== Meteor.userId()) {
        throw new Meteor.Error('not-authorized');
      }
      Projects.remove(projectId);
    },
    setChecked: function (projectId, setChecked) {
      var project = Projects.findOne(projectId);
      if (project.private && project.owner !== Meteor.userId()) {
        throw new Meteor.Error('not-authorized');
      }
      Projects.update(projectId, { $set: {checked: setChecked} });
    },
    setPrivate: function (projectId, setToPrivate) {
      var project = Projects.findOne(projectId);
      if (project.owner !== Meteor.userId()) {
        throw new Meteor.Error("not-authorized");
      }
      Projects.update(projectId, {$set: {private: setToPrivate}});
    }
  });

  if (Meteor.isServer) {
    Meteor.publish('projects', function () {
      return Projects.find({
        $or: [
        { private: {$ne: true}},
        {owner: this.userId}
        ]
      });
    });
  }
