#!/usr/bin/env node

'use strict';

let init = (() => {
	var _ref = _asyncToGenerator(function* (args) {
		try {
			if (args.length === 0 || args.length > 1) {
				cli.showHelp(1);
			}

			const url = validateUrl(args[0]);

			let localFiles = yield screenshot(url);
			let success = yield upload(localFiles);

			console.log(success);
			console.log("All done.");
		} catch (e) {
			console.log(e.message);
		}
	});

	return function init(_x) {
		return _ref.apply(this, arguments);
	};
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
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

function upload() {
	return Promise.resolve("Screenshots uploaded");
}

function screenshot(url) {

	console.log(`Taking screenshots of ${url}`);

	const pageres = new Pageres().src(url, screenshotSizes, {
		crop: true
	}).dest(process.cwd()).run().then(e => {
		return Promise.resolve(e);
	}).catch(err => {
		if (err.noStack) {
			console.log(err.message);
			process.exit(1);
		} else {
			throw err;
		}
	});
}

sudoBlock();
_asyncToGenerator(function* () {
	yield init(cli.input);;
})();
