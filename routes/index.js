var express = require('express');
var router = express.Router();
var userModule = require('../modules/user');
var passCatModel = require('../modules/password_category')
var passModel = require('../modules/add_password');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
var getPassCat = passCatModel.find({});
var getAllPass = passModel.find({});



function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch (err) {
    return res.redirect('/');
  }
  next();
}

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
function checkUsername(req, res, next) {
  var checkExistUsername = userModule.findOne({ username: req.body.uname });
  checkExistUsername.exec((err, data) => {
    if (err) throw err;

    if (data) {
      return res.render('signup', { title: 'password management system ', msg: 'username already exist', })
    }
  })
  next();
}

function checkEmail(req, res, next) {
  var checkExistemail = userModule.findOne({ email: req.body.email });
  checkExistemail.exec((err, data) => {
    if (err) throw err;

    if (data) {
      return res.render('signup', { title: 'password management system ', msg: 'email already exist', })
    }
  })

  next();
}



router.get('/', function (req, res, next) {
  const loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    res.redirect('/dashboard');
  } else {

    return res.render('index', { title: 'PASSWORD MANAGEMENT SYSTEM', msg: '', loginUser: loginUser, });
  }

});

router.post('/', function (req, res, next) {
  var username = req.body.uname;
  var password = req.body.password;
  // console.log("-----" + password + "-------------" + username);
  var checkUser = userModule.findOne({ username: username }
    //, function (err, data) {
    //   if (err) {   console.log('error in finding from the database', err);
    //     return;  }
    //   console.log('data', data); }
  );

  checkUser.exec((err, data) => {
    if (data == null) {
      return res.render('index', { title: 'Password Management System', msg: "Invalid Username and Password." });

    } else {
      if (err) {
        console.log('error is the', err);
        throw err;
      };

      var getUserID = data._id;
      var getPassword = data.password;
      // console.log("-----" + password + "-------------" + getPassword);
      if (bcrypt.compareSync(password, getPassword)) {
        // if(password==getPassword)
        var token = jwt.sign({ userID: getUserID }, 'loginToken');
        localStorage.setItem('userToken', token);
        localStorage.setItem('loginUser', username);
        return res.redirect('/dashboard');
      } else {
        return res.render('index', { title: 'Password Management System', msg: "Invalid Username and Password." });

      }
    }
  });

});

router.get('/dashboard', checkLoginUser, function (req, res) {
  // router.get('/dashboard' ,function(req,res){

  var loginUser = localStorage.getItem('loginUser');

  return res.render('dashboard', { title: 'PASSWORD MANAGEMENT SYSTEM ', loginUser: loginUser, msg: 'you are directed to dashboard page successfully', })

});


router.get('/signup', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');

  if (loginUser) {
    res.redirect('/dashboard');
  } else {

    return res.render('signup', { title: 'PASSWORD MANAGEMENT SYSTEM', msg: '', loginUser: loginUser, });
  }
});

router.post('/signup', checkUsername, checkEmail, function (req, res, next) {
  var username = req.body.uname;
  var email = req.body.email;
  var password = req.body.password;
  var confpassword = req.body.confpassword;
  if (password != confpassword) {

    return res.render('signup', { title: 'Password Management System', msg: 'password not match ' });

  } else {
    password = bcrypt.hashSync(req.body.password, 10);
    var userDetails = new userModule({
      username: username,
      email: email,
      password: password
    });

    userDetails.save((err, doc) => {
      if (err) throw err;
      return res.render('signup', { title: 'Password Management System', msg: 'User Registerd Successfully' });
    });

  }
});

router.get('/addNewCategory', checkLoginUser, function (req, res, next) {
  // router.get('/addNewCategory', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');

  return res.render('addNewCategory', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, errors: "", success: "", });
});



router.post('/addNewCategory', checkLoginUser, [check('passwordCategory', 'enter password category Name ').trim().isLength({ min: 1 })],
  (req, res) => {
    // router.get('/addNewCategory', function (req, res, next) {
    // console.log(passwordCategory);
    var loginUser = localStorage.getItem('loginUser');
    const errors = validationResult(req);
    // console.log(req.body);
    // console.log(errors.mapped());
    if (!errors.isEmpty()) {
      return res.render('addNewCategory', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, errors: errors.mapped(), success: '', });

    } else {
      var passCatName = req.body.passwordCategory;
      // console.log("inside post passCatName is :", passCatName);
      var passcatDetails = new passCatModel({
        password_category: passCatName,
      });
      passcatDetails.save(function (err, doc) {
        if (err) throw err;
        console.log(doc);
        return res.render('addNewCategory', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, errors: "", success: "password category inserted successfully ", });
      });

    }
  });


router.get('/passwordCategory', checkLoginUser, function (req, res, next) {
  // router.get('/passwordCategory', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');

  getPassCat.exec(function (err, data) {

    if (err) throw err;

    return res.render('passwordCategory', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, records: data, });
  });

});

router.get('/passwordCategory/delete/:id', checkLoginUser, function (req, res, next) {
  // router.get('/passwordCategory', function (req, res, next) {


  let passcat_id = req.params.id;
  // console.log("xyz", passcat_id);
  var passdelete = passCatModel.findByIdAndDelete(passcat_id);

  passdelete.exec(function (err) {

    if (err) throw err;

    res.redirect('/passwordCategory');
  });

});


router.get('/passwordCategory/edit/:id', checkLoginUser, function (req, res, next) {
  // router.get('/passwordCategory', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');
  var passcat_id = req.params.id;
  // console.log(passcat_id);
  var getpassCategory = passCatModel.findById(passcat_id);

  getpassCategory.exec(function (err, data) {

    if (err) throw err;
    // console.log(data);
    res.render('edit_pass_category', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, success: "", errors: "", records: data, id: passcat_id, });

  });

});


router.post('/passwordCategory/edit/', checkLoginUser, function (req, res, next) {
  // router.get('/passwordCategory', function (req, res, next) {

  var passcat_id = req.body.id;
  var passwordCategory = req.body.passwordCategory;
  // console.log(passcat_id + "------------" + passwordCategory);
  var update_passCat = passCatModel.findByIdAndUpdate(passcat_id, { password_category: passwordCategory });

  update_passCat.exec(function (err, doc) {

    if (err) throw err;

    res.redirect('/passwordCategory');

  });

});


router.get('/addNewPassword', checkLoginUser, function (req, res, next) {
  // router.get('/addNewPassword', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');
  getPassCat.exec(function (err, data) {

    if (err) throw err;
// console.log(data);
    return res.render('addNewPassword', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, success: "", records: data });

  })

});

router.post('/addNewPassword', checkLoginUser, function (req, res, next) {
  // router.get('/addNewPassword', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');
  var pass_cat = req.body.pass_cat;
  var project_name = req.body.project_name;
  var pass_details = req.body.pass_details;

  // console.log(pass_cat);
  // console.log(pass_details);
  // console.log(project_name);
  var password_details = new passModel({
    password_category: pass_cat,
    project_name: project_name,
    password_detail: pass_details,
  });

  getPassCat.exec(function (err, data) {
    if (err) throw err;
    password_details.save(function (err, doc) {
      if (err) throw err;
      return res.render('addNewPassword', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser, success: "Password detail Inserted Successfully", records: data });

    })

  })

});


router.get('/allPassword', checkLoginUser, function (req, res, next) {
  // router.get('/allPassword', function (req, res, next) {

  var loginUser = localStorage.getItem('loginUser');
  getAllPass.exec(function(err,data){
    if(err) throw err;
    return res.render('allPassword', { title: 'PASSWORD MANAGEMENT SYSTEM', loginUser: loginUser,records:data });

  }
  )
});

router.get('/password-detail',checkLoginUser, function(req, res, next) {
  res.redirect('/dashboard');
});

router.get('/password-detail/edit/:id',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  var id =req.params.id;
  var getPassDetails=passModel.findById({_id:id});
  getPassDetails.exec(function(err,data){
if(err) throw err;
getPassCat.exec(function(err,data1){
  if(err) throw err;
res.render('edit_password_detail', { title: 'Password Management System',loginUser: loginUser,records:data1,record:data,success:'' });
});
});
});

router.post('/password-detail/edit/:id',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  var id =req.params.id;
  var passcat= req.body.pass_cat;
  var project_name= req.body.project_name;
  var pass_details= req.body.pass_details;
  passModel.findByIdAndUpdate(id,{password_category:passcat,project_name:project_name,password_detail:pass_details}).exec(function(err){
  if(err) throw err;
    var getPassDetails=passModel.findById({_id:id});
  getPassDetails.exec(function(err,data){
if(err) throw err;
getPassCat.exec(function(err,data1){
  if(err) throw err;
res.render('edit_password_detail', { title: 'Password Management System',loginUser: loginUser,records:data1,record:data,success:'Password Updated Successfully' });
});
});
});
});

router.get('/password-detail/delete/:id', checkLoginUser,function(req, res, next) {

  var id =req.params.id;
  var passdelete=passModel.findByIdAndDelete(id);
  passdelete.exec(function(err){
    if(err) throw err;
    res.redirect('/allPassword');
  });
});

router.get('/logout', function (req, res, next) {
  localStorage.removeItem('loginUser');
  localStorage.removeItem('usertoken');
  return res.redirect('/');
});

module.exports = router;

