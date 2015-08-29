FoodImgs = new Mongo.Collection('foodimg');
if (Meteor.isClient) {
  Template.home.helpers({
    rightfoodurl: function(){
      return Session.get('rightfoodurl');
      Meteor.call('instagramFetch', 'foodporn');
    },
    leftfoodurl: function(){
      return Session.get('leftfoodurl');
    }
  });
  Template.rightimg.helpers({
    rightfoodimg: function(){
      var rightfood = Random.choice(FoodImgs.find().fetch());
      Session.set('rightfoodurl', rightfood.link);
      Session.set('rightid', rightfood._id);
      return rightfood.standard;
    }
  });
  Template.leftimg.helpers({
    leftfoodimg: function(){
      var leftfood = Random.choice(FoodImgs.find().fetch());
      Session.set('leftfoodurl', leftfood.link);
      Session.set('leftid', leftfood._id);
      return leftfood.standard;
    }
  });
  Template.home.events({
    'submit #foodinput': function(event){
      event.preventDefault();
      FoodImgs.insert({
        name: event.target.nameofentry.value,
        foodAPINext: '',
        images: [],
        likes: 0
      });
      event.target.nameofentry.value = '';
    }
  });
  Template.rightimg.events({
    'click': function(){
      FoodImgs.update(Session.get('rightid'), {$set: {likes: FoodImgs.findOne(Session.get('rightid')).likes+1}})
    }
  });
  Template.leftimg.events({
    'click': function(){
      FoodImgs.update(Session.get('leftid'), {$set: {likes: FoodImgs.findOne(Session.get('leftid')).likes+1}})
    }
  });
  Template.leaderboards.helpers({
    'values': function(){
      return FoodImgs.find({},{sort: {likes: -1}});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    
  });
  Meteor.methods({
    instagramFetch: function (tag) {
      this.unblock();
      var tagurl="https://api.instagram.com/v1/tags/"+tag+"/media/recent?client_id=d85d0f164ec24220b8aa6d11c29ba61e";
      try {
        var apicall = HTTP.get(tagurl, function(error, images){
          var imageData = images.data.data;
          var foodImgs = [];
          _.each(imageData, function(image){
            var imgctx = {};
            imgctx.link = image.link;
            imgctx.standard = image.images["standard_resolution"].url;
            imgctx.thumb = image.images.thumbnail.url;
            imgctx.likes = 0
            foodImgs.push(imgctx);
          }, this);
          _.each(foodImgs, function(img){
            if(FoodImgs.find({link:img.link, standard:img.standard, thumb:img.thumb}).fetch().length<=0){
              FoodImgs.insert(img);
            } else {

            }
          }, this);
        });
        return apicall;
      } catch (e) {
        console.log(e);
      }
    },
    swipeFood: function(){
      var foodicon = document.getElementById("foodthumb"),
        startX, startY,
        origX, origY,
        down = false;
      document.documentElement.onselectstart = function() {
          return false; // prevent selections
      };
      foodicon.onmousedown = function(e) {
          startX = e.clientX;
          startY = e.clientY;
          origX = foodicon.offsetLeft;
          origY = foodicon.offsetTop;
          down = true;
      };
      document.documentElement.onmouseup = function() {
          // releasing the mouse anywhere to stop dragging
          down = false;
      };
      document.documentElement.onmousemove = function(e) {
          // don't do anything if not dragging
          if(!down) return;
          foodicon.style.left = (e.clientX - startX) + origX + 'px';
          foodicon.style.top  = (e.clientY - startY) + origY + 'px';
          console.log(foodicon.style.left);
      };
    }
  });
  Meteor.publish('imgs', function(){
    return FoodImgs.find();
  });
}

Router.configure({
  layoutTemplate: 'layout'
});
Router.route('/', function(){
  // Meteor.call('instagramFetch', 'foodporn');
  this.render('home');
}, {
  data: function(){
    return FoodImgs.find();
  },
  waitOn: function(){
    Meteor.subscribe('imgs');
  }
});
Router.route('/leaderboards', function(){
  this.render('leaderboards');
}, {
  data: function(){
    return FoodImgs.find();
  },
  waitOn: function(){
    Meteor.subscribe('imgs');
  }
});