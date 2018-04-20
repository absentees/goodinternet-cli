#!/usr/bin/env node
'use strict';
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

async function uploadToImgur(screenshots) {
	console.log("Uploading images to Imgur");
	imgur.setCredentials(process.env.IMGUR_USER, process.env.IMGUR_PASSWORD, process.env.IMGUR_CLIENTID);

	// Upload images to imgur good internet folder
	let images = await imgur.uploadImages(screenshots, 'File', process.env.GOOD_INTERNET_IMGUR_ALBUM_ID);
	
	return Promise.resolve(images); 
}

async function uploadToCMS(siteDetails,url,description,imgurURLs) {
	console.log("Uploading files");

	// let uploadRequestDesktop = await client.uploadImage(screenshots[0]);
	// let uploadRequestMobile = await client.uploadImage(screenshots[1]);

	let record = await base('Good').create({
		"Name": siteDetails.title,
		"URL": url,
		"Description": description,
		"Desktop Screenshot": [
		  {
			"url": imgurURLs[0].link
		  }
		],
		"Mobile Screenshot": [
		  {
			"url": imgurURLs[1].link
		  }
		]
	  });

	return Promise.resolve(record);
}

async function screenshot(url) {

	console.log(`Taking screenshots of ${url}`);

	const pageres = new Pageres({delay: 10})
		.src(url, screenshotSizes, {
			crop: true,
			format: "jpg"
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

		// Check that the URL is good
		const url = validateUrl(args[0]);
		const description = args[1];

		// Get meta information
		const siteDetails = await getDetails(url);
		let screenshots;

		// Screenshot the websites
		if (siteDetails.url == null) {
			screenshots = await screenshot(url);
		} else {
			screenshots = await screenshot(siteDetails.url);
		}

		// Upload to Imgur
		let imgurURLs = await uploadToImgur(screenshots);

		// Upload to CMS
		let record = await uploadToCMS(siteDetails,url,description,imgurURLs);

		// Hit Netlify hook
		// let deployed = await publishSite();
		console.log("All done.");

		// Delete local screenshot files
		deleteLocalFiles(screenshots);


	} catch (e) {
		console.log(e.message);
	}
}


sudoBlock();
(async () => {
    await init(cli.input);;
})();
