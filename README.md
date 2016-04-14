# Angular 1.5 Component Demo

A demo application for ng-conf 2016 to demonstrate a component based architecture with Angular 1.5

## Running

You just need an http-server setup to rewrite to `index.html`.
Luckily we have one to hand in `lite-server`:

```
npm install
npm start
```

## Unit Testing

```
npm test
```

## End-to-End Testing

You also need an http-server to be serving the app while running the E2E tests.
Use `npm start` (on a separate terminal window) to start the http-server first.

```
npm e2e
```
