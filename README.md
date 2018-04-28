# movable-cli

Like `ember-cli`, but for Movable Ink apps.

## Usage

```sh
yarn global add @movable/cli
movable new my-app
cd my-app
movable serve
```

This utility takes care of the following:
* Creating new apps from the default app blueprint (`movable new my-app`)
* Building apps (`movable build`)
* Serving those apps from a webserver (`movable serve`)
* Updating an app to the latest blueprint (`movable init`)

## Testing

Run all of the tests:

```bash
yarn run test
```

## Local Usage

Check out this repository and install dependencies:

```bash
git clone https://github.com/movableink/movable-cli.git
cd movable-cli
yarn
```

Set up your `PATH` to use your local `movable` command:

```bash
export PATH=`pwd`/bin:$PATH
```

Now you can run commands like `movable new` using your local `movable-cli`. If you want to set up `movable` to use a non-production oAuth server, you can create a file such as `~/local-movable.sh` where you set some environment variables:

```bash
export OAUTH_CLIENT_ID=changeme00000000000000000000000000000000000000000
export OAUTH_CLIENT_SECRET=changeme000000000000000000000000000000000000000000
export DASHBOARD_URL=http://localhost:3000
export DEPLOY_URL=http://localhost:4044
```

Then, to use the local endpoints, run `source ~/local-movable.sh` before you run `movable login`.

## License

See LICENSE.md.
