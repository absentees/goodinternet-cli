#!/usr/bin/env node

'use strict';

let upload = (() => {
	var _ref = _asyncToGenerator(function* (screenshotObject) {
		let modelID = yield client.itemTypes.all();

		let uploadRequestDesktop = yield client.uploadImage(screenshotObject.filenames[0]);
		let uploadRequestMobile = yield client.uploadImage(screenshotObject.filenames[1]);

		let record = yield client.items.create({
			itemType: '10825',
			name: screenshotObject.name,
			url: screenshotObject.url,
			description: 'blah',
			desktop_screenshot: uploadRequestDesktop,
			mobile_screenshot: uploadRequestMobile
		});

		return Promise.resolve(record);
	});

	return function upload(_x) {
		return _ref.apply(this, arguments);
	};
})();

let screenshot = (() => {
	var _ref2 = _asyncToGenerator(function* (url) {

		console.log(`Taking screenshots of ${url}`);

		const pageres = new Pageres().src(url, screenshotSizes, {
			crop: true
		}).dest(process.cwd());

		const streams = yield pageres.run();

		let screenshotObject = {
			name: url,
			url: url
		};

		screenshotObject.filenames = streams.map(function (stream) {
			return stream.filename;
		});

		return Promise.resolve(screenshotObject);
	});

	return function screenshot(_x2) {
		return _ref2.apply(this, arguments);
	};
})();

let init = (() => {
	var _ref3 = _asyncToGenerator(function* (args) {
		try {
			if (args.length === 0 || args.length > 1) {
				cli.showHelp(1);
			}

			const url = validateUrl(args[0]);

			let localFiles = yield screenshot(url);
			let record = yield upload(localFiles);

			console.log("All done");
		} catch (e) {
			console.log(e.message);
		}
	});

	return function init(_x3) {
		return _ref3.apply(this, arguments);
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

sudoBlock();
_asyncToGenerator(function* () {
	yield init(cli.input);;
})();
