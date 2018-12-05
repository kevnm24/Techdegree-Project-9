'use strict';

const express = require("express");
const router = express.Router();
const User = require("./models").User;
const Course = require("./models").Course;
const auth = require('basic-auth');
const bcrypt = require('bcrypt');

// GET /api
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// POST /api/users
// Creates a user, sets the Location header to "/", and returns no content
router.post('/users', function(req, res, next) {
  const user = new User(req.body);
  user.save(function(err, user){
    if(err) return next();
    res.location('/');
    res.sendStatus(201);
  });
});

// GET /api/courses
// Returns a list of courses
router.get("/courses", function(req, res, next) {
  Course.find({})
  .exec(function(err, courses){
      if(err) return next(err);
      res.json(courses);
    });
});

// GET /api/courses/:id
// Returns a the course for the provided course ID
router.get('/courses/:cID', function(req, res, next) {
  res.json(req.course);
});

// this will make sure you are logged in before you can acces the routes below this function
// the routes above this function can be viewed without being logged in
// it will also make sure that the password is valid with the email address
router.use(function(req, res, next) {
  let userAuth = auth(req)
  if(userAuth) {
    User.findOne({emailAddress: userAuth.name})
      .exec(function(err, user) {
        if(err) {
          return next(err);
        } else if(!user) {
          err = new Error('Please log in with your email');
          err.status = 401;
          return next(err);
        }
        bcrypt.compare(userAuth.pass, user.password, function (err, res) {
          if (res) {
            req.user = user
            return next()
          } else {
            err = new Error('Invalid password')
            err.status = 401;
            return next(err);
          }
        })
      })
    }
});

// GET /api/users
// Returns the currently authenticated user
router.get("/users", function(req, res, next) {
  User.find({})
  .exec(function(err, user){
      if(err) return next(err);
      res.json(req.user);
    });
});

router.param("cID", function(req, res, next, id){
  Course.findById(id, function(err, doc){
    if(err) return next(err);
    if(!doc) {
      err = new Error("Not Found");
      err.status = 404;
      return next(err);
    }
    req.course = doc;
    return next();
  });
});

// POST /api/courses
// Creates a course
router.post('/courses', function(req, res, next) {
  const course = new Course(req.body);
  course.save(function(err, course){
    if(err) return next(err);
    res.location('/');
    res.sendStatus(201);
  });
});

// PUT api/course/:id
// Updates a course and returns no content
router.put('/courses/:cID', function(req, res, next) {
  if (req.course.user.toString() === req.user._id.toString()) {
      req.course.update(req.body, function(err, result){
      if(err) return next(err);
      return res.sendStatus(204);
    });
  } else {
    const err = new Error('Sorry you can not edit course because your are not the creator.');
    err.status = 403;
    next(err)
  }
});

// DELETE api/course/:id
// Deletes a course and returns no content
router.delete('/courses/:cID', function(req, res, next) {
  if (req.course.user.toString() === req.user._id.toString()) {
    req.course.remove(function(err){
      req.course.save(function(err, course){
        if(err) return next(err);
        return res.sendStatus(204);
      });
    });
  } else {
    const err = new Error('Sorry you can not delete course because your are not the creator.');
    err.status = 403;
    next(err)
  }
});

module.exports = router;
