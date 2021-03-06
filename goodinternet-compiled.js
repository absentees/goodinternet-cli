#!/usr/bin/env node

'use strict';

let upload = (() => {
	var _ref = _asyncToGenerator(function* (siteDetails, url, description, screenshots) {
		console.log("Uploading files");

		let uploadRequestDesktop = yield client.uploadImage(screenshots[0]);
		let uploadRequestMobile = yield client.uploadImage(screenshots[1]);

		let record = yield client.items.create({
			itemType: '10825',
			name: siteDetails.title,
			url: url,
			description: description,
			desktop_screenshot: uploadRequestDesktop,
			mobile_screenshot: uploadRequestMobile
		});

		return Promise.resolve(record);
	});

	return function upload(_x, _x2, _x3, _x4) {
		return _ref.apply(this, arguments);
	};
})();

let screenshot = (() => {
	var _ref2 = _asyncToGenerator(function* (url) {

		console.log(`Taking screenshots of ${url}`);

		const pageres = new Pageres({ delay: 10 }).src(url, screenshotSizes, {
			crop: false
		}).dest(process.cwd());

		const streams = yield pageres.run();

		let screenshots = streams.map(function (stream) {
			return stream.filename;
		});

		return Promise.resolve(screenshots);
	});

	return function screenshot(_x5) {
		return _ref2.apply(this, arguments);
	};
})();

let getDetails = (() => {
	var _ref3 = _asyncToGenerator(function* (url) {
		const details = yield Metascraper.scrapeUrl(url);

		return Promise.resolve(details);
	});

	return function getDetails(_x6) {
		return _ref3.apply(this, arguments);
	};
})();

let publishSite = (() => {
	var _ref4 = _asyncToGenerator(function* () {
		console.log("Publishing site.");

		let published = yield axios.post(process.env.NETLIFY_DEPLOY_HOOK);

		return Promise.resolve(published);
	});

	return function publishSite() {
		return _ref4.apply(this, arguments);
	};
})();

let init = (() => {
	var _ref5 = _asyncToGenerator(function* (args) {
		try {
			if (args.length === 0 || args.length < 2) {
				cli.showHelp(1);
			}

			const url = validateUrl(args[0]);
			const description = args[1];
			const siteDetails = yield getDetails(url);
			let screenshots;

			if (siteDetails.url == null) {
				screenshots = yield screenshot(url);
			} else {
				screenshots = yield screenshot(siteDetails.url);
			}

			let record = yield upload(siteDetails, url, description, screenshots);

			let deployed = yield publishSite();
			console.log("All done.");

			deleteLocalFiles(screenshots);
		} catch (e) {
			console.log(e.message);
		}
	});

	return function init(_x7) {
		return _ref5.apply(this, arguments);
	};
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
const meow = require('meow');
const sudoBlock = require('sudo-block');
const SiteClient = require('datocms-client').SiteClient;
const Pageres = require('pageres');
const Metascraper = require('metascraper');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const screenshotSizes = ['1440x1024', 'iphone 5s'];
const filenameFormat = '<%= url %>';

const client = new SiteClient(process.env.DATOCMS_READ_WRITE);

const cli = meow(`
	Will accept a single url to screenshot and post to goodinternet.online. That's it.

	Usage
		$ goodinternet <url> <description>

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

function deleteLocalFiles(paths) {
	paths.forEach(function (path) {
		fs.unlink(path, err => {
			if (err) {
				console.error("Failed to delete local file: " + error);
			} else {
				console.log("Deleted local: " + path);
			}
		});
	});
}

sudoBlock();
_asyncToGenerator(function* () {
	yield init(cli.input);;
})();
