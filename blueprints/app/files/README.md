# <%= name %>

This is Movable Ink cartridge that goes with the Studio content builder.
A short introduction of this app could easily go here.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com/)

## Developing

First, ensure that you have the latest version of the MDK. Get it via:

```
yarn global add @movable/cli
```

Then you can start the UI via `movable serve` then navigate your browser to http://localhost:4200 to view the UI.

You can run tests using `yarn test`.

## Deploying to a local environment

If you're running the Movable Ink platform locally, you can deploy to that with:

```
movable deploy development
```

* Uploads the directory to `movableink-cartridge-development` s3 bucket.
* Posts to your local rails server to register the updated cartridge.

This also requires the `s3cmd` tool and the relevant s3 credentials.

## Deploying to production

You need to run a one-time setup to add gitolite as a remote:

```
bin/setup-deploy
```

Then you can deploy:

```
movable deploy production
```

This deploys your current branch to git.movableink.com and is the recommended deploy method.
