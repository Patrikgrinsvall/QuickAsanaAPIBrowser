/**
 * Setup:
 *
 * 1. Create an application in Asana.
 * 2. Set the application's redirect URI to be:
 *      `http://localhost:8338/oauth_callback`
 * 3. Note the app's client ID and secret key for use when running the
 *    web server, below.
 *
 * Usage:
 *clientid:  1200178574246702
 secret: 62bd837a99259dfa4facd227402e477d

 https://app.asana.com/-/oauth_authorize?response_type=code&client_id=1200178574246702&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&state=<STATE_PARAM>

 urn:ietf:wg:oauth:2.0:oob

 *   export ASANA_CLIENT_ID=...
 *   export ASANA_CLIENT_SECRET=...
 *   [export PORT=...]
 *   node oauth_webserver.js
 */
var Asana = require('asana');
var express = require('express');
var util = require('util');
var cookieParser = require('cookie-parser');
var app = express();
let dotenv = require('dotenv')
let dotEnvExpand = require('dotenv-expand')
dotEnvExpand(dotenv.config());
var fs =  require( 'fs');

// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
function createClient() {
    return Asana.Client.create({
        clientId: process.env.ASANA_CLIENT_ID,
        clientSecret: process.env.ASANA_CLIENT_SECRET,
        redirectUri: process.env.CALLBACK_URL
    });
}

// Causes request cookies to be parsed, populating `req.cookies`.
app.use(cookieParser());
var GlobalGookie ="";
try{
if(fs.readFileSync("cookiefile", GlobalGookie)){
    req.cookies.token = GlobalGookie;
}}catch (e) {
    console.log("not found", e)
}

app.get('/', function(req, res) {
    var client = createClient();
res.send('<h1>Asana script</h1>'+
'<li><a href="/"' + client.app.asanaAuthorizeUrl() + '">Login</a></li>'+
'<li><a href="/workspaces">Workspaces</a></li>');
});
app.get('/task/:taskId', function(req, res) {
    var client = createClient();
    // If token is in the cookie, use it to show info.
    var token = req.cookies.token;
    if (token) {
        let out;
        out ="<h2>Task details: </h2><pre>";
        // Here's where we direct the client to use Oauth with the credentials
        // we have acquired.
        client.useOauth({credentials: token});

        client.users.me().then(function (user) {
            let task = client.tasks.getTask(req.param("taskId"), ["created_at",
                "modified_at",
                "name",
                "notes",
                "permalink_url",
                "resource_type",
                "gid"]
            ).then((task) => {
                out += "title: " + task.name + ".<br/> Modified: " + task.modified_at + ";notes; " + task.notes.toString() + '"<br/>>';
                res.send(out+"</pre>")
            })

        });
    } else {
        // Otherwise redirect to authorization.
        res.redirect(client.app.asanaAuthorizeUrl());
    }
});

// Home page - shows user name if authenticated, otherwise seeks authorization.
app.get('/workspaces', function(req, res) {
    var client = createClient();
    // If token is in the cookie, use it to show info.
    var token = req.cookies.token;
    if (token) {

        // Here's where we direct the client to use Oauth with the credentials
        // we have acquired.
        client.useOauth({ credentials: token });
        client.users.me().then(function(user) {
            const userId = user.gid;
            // The user's "default" workspace is the first one in the list, though
            // any user can have multiple workspaces so you can't always assume this
            // is the one you want to work with.
            let out ="";
            out +="<h2>All workspaces by user: </h2>";
            out +="<table style='border:1px solid'><theader><td>Name</td><td>ID</td><td>Resource Type</td></theader>";
            for (const [i,w] of user.workspaces.entries()) {
                let bg=(i % 2 == 0) ? "lightgrey" : "lightgrey";
                out +="<tr style='background:" +bg + "'><td>" + '<a href="/tasks/' + w.gid+'">' + w.name +'</a></td><td>' + w.gid + '</td><td>'+w.resource_type+'</td></tr>';
            }
            out += "</table>";
            out +="<h2>AS CSV</h2><pre style='background-color: aliceblue;border:1px solid black'>";
            out += '"name","id", "resource_type"\r\n<br/>';
            for (const w of user.workspaces) {
                out += '"'+w.name+'", "' + w.gid + '", "' + w.resource_type + '"\r\n<br/>';
            }
            out += "</pre>";
            return res.send(out);
        }).catch(e => {
            res.send('Error fetching user: ' + e);
        });
    } else {
        // Otherwise redirect to authorization.
        res.redirect(client.app.asanaAuthorizeUrl());
    }

});

app.get('/tasks/:workspaceId', function(req, res) {
    var client = createClient();
    // If token is in the cookie, use it to show info.
    var token = req.cookies.token;
    var client = Asana.Client.create({"defaultHeaders": {"asana-enable": "new_user_task_lists,string_ids,new_sections"}}).useAccessToken(token);
    if (token) {
        client.users.me().then(user => {
            // The user's "default" workspace is the first one in the list, though
            // any user can have multiple workspaces so you can't always assume this
            // is the one you want to work with.
            const workspaceId = req.params.workspaceId;
            let tasks = client.tasks.getTasks({
                assignee: user.gid,
                workspace: workspaceId,
            }).then((tasks) => {
                // The user's "default" workspace is the first one in the list, though
                // any user can have multiple workspaces so you can't always assume this
                // is the one you want to work with.
                let out, csv = "";
                out += "<h2>All workspaces by user: </h2>";
                out += "<table style='border:1px solid'><theader><td>Name</td><td>ID</td><td>Resource Type</td></theader>";
                csv += "<h2>AS CSV</h2><pre style='background-color: aliceblue;border:1px solid black'>";
                csv += '"name","id", "resource_type"\n';
                for (const w of tasks.data) {
                    let bg = (w % 2 == 0) ? "lightgrey" : "lightgrey";
                    out += "<tr style='background:" + bg + "'><td>" + '<a href="/task/' + w.gid + '">' + w.name + '</a></td><td>' + w.gid + '</td><td>' + w.resource_type + '</td></tr>';
                    csv += w.name + ";" + w.gid + ";" + w.resource_type + '"\n';
                }
                out += "</table>";
                out += "</pre>";
                res.send(out+csv);
            });


        })
        } else {
            // Otherwise redirect to authorization.
            res.redirect(client.app.asanaAuthorizeUrl());
        }
});

// Authorization callback - redirected to from Asana.
app.get('/oauth_callback', function(req, res) {
    var code = req.param('code');
    if (code) {
        // If we got a code back, then authorization succeeded.
        // Get token. Store it in the cookie and redirect home.
        var client = createClient();
        client.app.accessTokenFromCode(code).then(function(credentials) {
            // The credentials contain the refresh token as well. If you use it, keep
            // it safe on the server! Here we just use the access token, and store it
            // in the cookie for an hour.
            // Generally, if stored in a cookie it should be secure- and http-only
            // to prevent it from being stolen.
            res.cookie('token', credentials.access_token, { maxAge: 60 * 60 * 1000 });
            fs.writeFileSync("./cookiefile", credentials.access_token);
            // Redirect back home, where we should now have access to Asana data.
            res.redirect('/workspaces');
        });
    } else {
        // Authorization could have failed. Show an error.
        res.end('Error getting authorization: ' + req.param('error'));
    }

});

// Run the server!
var server = app.listen(process.env.PORT, function() {
    console.log("Running:" + process.env.APP_URL);
});