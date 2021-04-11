# Asana Task Exporter / Explorer
So, another project manager system besides the other 12. We cant go on like this, my tasks needs to be in one place.
This repo is the first few babysteps toward that direction. The end goal is to eventually have one personal system that feeds from the rest
so i can have all my todos and specifications in the same place.

## Install
1. clone
2. npm install
3. Go to asana and create an app. 
4. Paste your app secrets in the env file.
5. npm run start
6. open browser to the port outputten from start.

You should first login to asana to get some secrets then redirected to an overview of workspaces and inside each workspace get a list of tasks. The access token is saved on disk so be careful and have this server running behind some kind of authentication, anyone gaining access to this if hosted public can access your asana account and all inside.

## License
Free to use for anyone to use, (MIT).

But please if you build something similar for github, gitlab, trello, jira, or any other project management or code system,
ping me at patrik@silentridge.io.
