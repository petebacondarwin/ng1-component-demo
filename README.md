# Angular 1.5 Component Demo

A demo application for ng-conf 2016 to demonstrate a component based architecture with Angular 1.5

## Running

You just need a web server, which is setup to rewrite to `index.html`.
Luckily we have one to hand in `lite-server`:

```
npm install
npm start
```

## Unit Testing

```
npm test
```

## Code Linting

```
npm run lint
```

## End-to-End Testing

You also need the web server to be serving the app while running the E2E tests.
Use `npm start` (on a separate terminal window) to start the web server first.

```
npm run e2e
```
