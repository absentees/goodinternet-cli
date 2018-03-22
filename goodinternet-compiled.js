#!/usr/bin/env node

'use strict';

let uploadToImgur = (() => {
	var _ref = _asyncToGenerator(function* (screenshots) {
		console.log("Uploading images to Imgur");
		imgur.setCredentials(process.env.IMGUR_USER, process.env.IMGUR_PASSWORD, process.env.IMGUR_CLIENTID);

		// Upload images to imgur good internet folder
		let images = yield imgur.uploadImages(screenshots, 'File', process.env.GOOD_INTERNET_IMGUR_ALBUM_ID);

		return Promise.resolve(images);
	});

	return function uploadToImgur(_x) {
		return _ref.apply(this, arguments);
	};
})();

let uploadToCMS = (() => {
	var _ref2 = _asyncToGenerator(function* (siteDetails, url, description, imgurURLs) {
		console.log("Uploading files");

		// let uploadRequestDesktop = await client.uploadImage(screenshots[0]);
		// let uploadRequestMobile = await client.uploadImage(screenshots[1]);

		let record = yield base('Good').create({
			"Name": siteDetails.title,
			"URL": url,
			"Description": description,
			"Desktop Screenshot": [{
				"url": imgurURLs[0].link
			}],
			"Mobile Screenshot": [{
				"url": imgurURLs[1].link
			}]
		});

		return Promise.resolve(record);
	});

	return function uploadToCMS(_x2, _x3, _x4, _x5) {
		return _ref2.apply(this, arguments);
	};
})();

let screenshot = (() => {
	var _ref3 = _asyncToGenerator(function* (url) {

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

	return function screenshot(_x6) {
		return _ref3.apply(this, arguments);
	};
})();

let getDetails = (() => {
	var _ref4 = _asyncToGenerator(function* (url) {
		const details = yield Metascraper.scrapeUrl(url);

		return Promise.resolve(details);
	});

	return function getDetails(_x7) {
		return _ref4.apply(this, arguments);
	};
})();

let publishSite = (() => {
	var _ref5 = _asyncToGenerator(function* () {
		console.log("Publishing site.");

		let published = yield axios.post(process.env.NETLIFY_DEPLOY_HOOK);

		return Promise.resolve(published);
	});

	return function publishSite() {
		return _ref5.apply(this, arguments);
	};
})();

let init = (() => {
	var _ref6 = _asyncToGenerator(function* (args) {
		try {
			if (args.length === 0 || args.length < 2) {
				cli.showHelp(1);
			}

			// Check that the URL is good
			const url = validateUrl(args[0]);
			const description = args[1];

			// Get meta information
			const siteDetails = yield getDetails(url);
			let screenshots;

			// Screenshot the websites
			if (siteDetails.url == null) {
				screenshots = yield screenshot(url);
			} else {
				screenshots = yield screenshot(siteDetails.url);
			}

			// Upload to Imgur
			let imgurURLs = yield uploadToImgur(screenshots);

			// Upload to CMS
			let record = yield uploadToCMS(siteDetails, url, description, imgurURLs);

			// Hit Netlify hook
			// let deployed = await publishSite();
			console.log("All done.");

			// Delete local screenshot files
			deleteLocalFiles(screenshots);
		} catch (e) {
			console.log(e.message);
		}
	});

	return function init(_x8) {
		return _ref6.apply(this, arguments);
	};
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
require('dotenv').config();
const meow = require('meow');
const sudoBlock = require('sudo-block');
const SiteClient = require('datocms-client').SiteClient;
const Pageres = require('pageres');
const Metascraper = require('metascraper');
const axios = require('axios');
const fs = require('fs');
const Airtable = require('airtable');
const imgur = require('imgur');

const screenshotSizes = ['1440x1024', 'iphone 5s'];
const filenameFormat = '<%= url %>';

Airtable.configure({
	endpointUrl: 'https://api.airtable.com',
	apiKey: process.env.GOOD_INTERNET_AIRTABLE_API_KEY
});
var base = Airtable.base(process.env.GOOD_INTERNET_BASE_ID);

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
