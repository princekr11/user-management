# User Management Service

This application is generated using [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) with the
[initial project layout](https://loopback.io/doc/en/lb4/Loopback-application-layout.html).

- For git guidelines and instructions, refer to [Git readme](GIT.md)

### Install necessary packages

If you do not have homebrew installed, you can install it using this.

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Now that you have homebrew, you can use it to install other packages.

```
brew install git
brew install wget
```

### Creating a local redis instance

Install reddis server locally. Do not enable authentication for it.

```
brew install redis
ln -sfv /usr/local/opt/redis/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
brew services restart redis
```

### Install NVM and node version 16.13.1

```
touch ~/.bash_profile
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
source ~/.bash_profile
nvm install 16.13.1
nvm use 16.13.1
nvm alias default 16.13.1
```

### Install global packages

```
npm install -g @loopback/cli
```

### Install local dependencies from project directory

`npm install`

### Creating a local postgre database

Install postgresql locally.

```
brew install postgresql
brew services start postgresql
```

Create required databases by running below scripts.

```
psql postgres
create database user_management;
exit;
```

## Run the application

```sh
npm start
```

You can also run `node .` to skip the build step.

Open http://127.0.0.1:3018 in your browser.

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```

## Fix code style and formatting issues

```sh
npm run lint
```

To automatically fix such issues:

```sh
npm run lint:fix
```

## Other useful commands

- `npm run migrate`: Migrate database schemas for models
- `npm run openapi-spec`: Generate OpenAPI spec into a file
- `npm run docker:build`: Build a Docker image for this application
- `npm run docker:run`: Run this application inside a Docker container

## Tests

```sh
npm test
```

### Text editor settings

Please make sure your text editor is configured properly before you start contributing. Use below settings for visual studio Code. Install
`prettier` and `eslint` pluggins for VSCode.

## What's next

Please check out [LoopBack 4 documentation](https://loopback.io/doc/en/lb4/) to understand how you can continue to add features to this
application.

[![LoopBack](<https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)
