require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
app.use(logger);
function logger(req, res, next) {
  next();
}
//pm2 start server.js to start service
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "139.180.191.53",
  user: "posadmin",
  password: "Pa$$w0rd",
  database: "loansystem",
  debug: false,
});

app.post("/api/sp", (req, res) => {
  try {
    if(req.body.params[0] !== "LOGIN_CHECK_WEB"){
      const tokenHeader = req.headers.authorization;
      const token = tokenHeader && tokenHeader.split(" ")[1];
      if (token == null) return res.sendStatus(401);
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(401);
        }else{
          var params = [];
          req.body.params.forEach((p) => {
            params.push('"' + p.replace(/"/g, '\\"') + '"');
          });
          var query =
            "CALL " +
            "`" +
            req.body.db +
            "`" +
            "." +
            req.body.spname +
            "(" +
            params.join(",") +
            ")";
          pool.getConnection(function (err, connection) {
            connection.query(query, function (err, results) {
              connection.release();
              if (err) throw err;
              if (Array.isArray(results)) {
                results.splice(-1);
                var vResult = {};
                var i = 0;
                results.forEach((p) => {
                  vResult["table" + i] = p;
                  i = i + 1;
                  if(i == 1){
                    console.log(p);
                  }
                });
                res.send(JSON.stringify(vResult));
              } else {
                res.send("[]");
              }
            });
          });
        }
      });
    }else{
      var params = [];
    req.body.params.forEach((p) => {
      params.push('"' + p.replace(/"/g, '\\"') + '"');
    });
    var query =
      "CALL " +
      "`" +
      req.body.db +
      "`" +
      "." +
      req.body.spname +
      "(" +
      params.join(",") +
      ")";
    pool.getConnection(function (err, connection) {
      connection.query(query, function (err, results) {
        connection.release();
        if (err) throw err;
        if (Array.isArray(results)) {
          results.splice(-1);
          var vResult = {};
          var i = 0;
          results.forEach((p) => {
            vResult["table" + i] = p;
            i = i + 1;
          });
          res.send(JSON.stringify(vResult));
        } else {
          res.send("[]");
        }
      });
    });
    }
    
  } catch (error) {
    res.send("[]");
    console.log(error);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("//refreshtoken", (req, res) => {
  const refreshToken = req.body.authorization;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = getAccessToken({ name: user.name });
    res.json({ accessToken: accessToken });
  });
});

app.post("//gettoken", (req, res) => {
  const username = req.body.username;
  const user = { name: username };

  const accessToken = getAccessToken(user);
  const refreshToken = getRefreshToken(user);
  res.json({ TOKEN: accessToken, REFRESH_TOKEN: refreshToken });
});

app.post("//checktoken", (req, res) => {
  const tokenHeader = req.headers.authorization;
  const token = tokenHeader && tokenHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    res.json(user);
  });
});

app.post("//gettokenunlimit", (req, res) => {
  const username = req.body.username;
  const user = { name: username };

  const accessToken = getAccessTokenUnlimit(user);
  const refreshToken = getRefreshToken(user);
  res.json({ TOKEN: accessToken, REFRESH_TOKEN: refreshToken });
});

function getAccessTokenUnlimit(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
}

function getAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 30 });
}

function getRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: 60 * 60,
  });
}

app.post('//api/data/dataset', (req, res) => {
  try {
    pool.getConnection((err,connection) => {
      connection.query(`"CALL ${req.body.pDatabase}.SYS_PRO_DATA('${req.body.pKey}','${req.body.pValue}')"`,function(err,rs){
        connection.release()
        if (Array.isArray(rs)){
          if(req.query.pathFile!=""){
            rs[0]=rs[0].concat({JSON:'[{"0010":0}]'})
          }    
          res.send(rs[0])
        }else{
          res.send([{JSON:'NO_MATCH_FOUND'}])
        }
      });
    });
  }catch (error) {
      console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

