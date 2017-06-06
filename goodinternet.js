#!/usr/bin/env node
'use strict';
const meow = require('meow');
const sudoBlock = require('sudo-block');
const SiteClient = require('datocms-client').SiteClient;
const Pageres = require('pageres');
require('dotenv').config();


const screenshotSizes = ['1440x1024', 'iphone 5s'];
const filenameFormat = '<%= url %>';

const client = new SiteClient(process.env.DATOCMS_READ_WRITE);

const cli = meow(`
	Will accept a single url to screenshot and post to goodinternet.online. That's it.

	Usage
		$ goodinternet <url>

	Examples
		$ goodinternet http://google.com`);

function validateUrl(url) {
	const urlRegex = /https?:\/\/|localhost|\./;

	if (urlRegex.test(url)) {
		return url;
	} else {
		console.error("URL is no good, please try again.");
		process.exit(1);
	}
}

function upload(files) {
	var promise = new Promise(function(resolve, reject) {
		console.log("stream:" + files);

		resolve('hello');

	});

	return promise;
}

function screenshot(url) {
	console.log(`Taking screenshots of ${url}`);

	const pageres = new Pageres()
		.src(url, screenshotSizes, {
			crop: true
		})
		.dest(process.cwd())
		.run()
		.then(upload)
		.then(() => {
			console.log('all done');
		})
		.catch(err => {
			if (err.noStack) {
				console.log(err.message);
				process.exit(1);
			} else {
				throw err;
			}
		});
}

function init(args) {
	if (args.length === 0 || args.length > 1) {
		cli.showHelp(1);
	}

	const url = validateUrl(args[0]);

	const files = screenshot(url);
	upload(files);
}


sudoBlock();
init(cli.input);
