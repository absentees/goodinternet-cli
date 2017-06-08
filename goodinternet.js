#!/usr/bin/env node
'use strict';
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

async function upload(siteDetails,url,description,screenshots) {
	console.log("Uploading files");

	let uploadRequestDesktop = await client.uploadImage(screenshots[0]);
	let uploadRequestMobile = await client.uploadImage(screenshots[1]);

	let record = await client.items.create({
		itemType: '10825',
		name: siteDetails.title,
		url: url,
		description: description,
		desktop_screenshot: uploadRequestDesktop,
		mobile_screenshot: uploadRequestMobile
	});

	return Promise.resolve(record);
}

async function screenshot(url) {

	console.log(`Taking screenshots of ${url}`);

	const pageres = new Pageres({delay: 5})
		.src(url, screenshotSizes, {
			crop: true
		})
		.dest(process.cwd());

	const streams = await pageres.run();

	let screenshots = streams.map(function(stream){
		return stream.filename
	});

	return Promise.resolve(screenshots);
}

async function getDetails(url){
	const details = await Metascraper.scrapeUrl(url);
	console.log(details);

	return Promise.resolve(details);
}

function deleteLocalFiles(paths) {
	paths.forEach(function(path){
		fs.unlink(path, (err) => {
			if (err) {
				console.error("Failed to delete local file: " + error);
			} else {
				console.log("Deleted local: " + path);
			}
		})
	})
}

async function publishSite() {
	console.log("Publishing site.");

	let published = await axios.post(process.env.NETLIFY_DEPLOY_HOOK);

	return Promise.resolve(published);
}

async function init(args) {
	try {
		if (args.length === 0 || args.length < 2) {
			cli.showHelp(1);
		}

		const url = validateUrl(args[0]);
		const description = args[1];
		const siteDetails = await getDetails(url);
		let screenshots;
		if (siteDetails.url == null) {
			screenshots = await screenshot(url);
		} else {
			screenshots = await screenshot(siteDetails.url);
		}

		let record = await upload(siteDetails,url,description,screenshots);

		let deployed = await publishSite();
		console.log("All done.");

		deleteLocalFiles(screenshots);


	} catch (e) {
		console.log(e.message);
	}
}


sudoBlock();
(async () => {
    await init(cli.input);;
})();
