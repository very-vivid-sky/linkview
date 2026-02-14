const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const env = require("dotenv");

const app = express(); // init
app.use(express.urlencoded({ extended: false }));
app.use(express.json()) // parses JSON

// define environmental variables
env.config();
const FRONTEND_LINK = process.env.FRONTEND_LINK;
const SECRET = process.env.SECRET;
const USER_AGENT = process.env.USER_AGENT;
const HOST = process.env.HOST;
const PORT = process.env.PORT;

// Use cors middleware to allow requests from frontend server
app.use(cors({ origin: `${FRONTEND_LINK}` }));

// request headers
const req_headers = { "User-Agent": USER_AGENT }

// regexes
const regex_domain = /(^https:\/\/[A-Za-z0-9\-\.]*)/
const regex_isLink = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/ // https://regexbox.com/regex-templates/url

// returns a Cheerio object from the given link
async function getFromUrl(url) {
	return new Promise((resolve) => {
		axios.get(url, {headers: req_headers}).then((response) => {
		if (response.status == 200) {
			// get a cheerio object
			resolve(cheerio.load(response.data));
		}
		}).catch((err) => {
			console.log(err);
			resolve(undefined);
		})
	})
}

// each website is structured differently and thus would need different methods of parsing.
const websiteParser = {
	wikimedia: function(cheerioRes, url) {
		const output = cheerioRes.extract({
			title: "title",
			canonicalUrl: {selector: "link[rel~='canonical']", value: "href"}
		});

		// fix the favicon
		// const domain = url.match(regex_domain)[0];
		// output.favicon = domain + output.favicon;

		// get the first paragraph
		// const table = cheerioRes("#mw-content-text").find(".mw-parser-output").find("table");
		const paragraph = cheerioRes("#mw-content-text").find("p").text();
		output.description = paragraph.match(/^\s*([ -~]+)/, "")[0].trim().replace(/(\[([a-z]|[0-9]{1,4})\])/g, "");
		output.blurb = output.description;

		// get image
		let image = cheerioRes("#mw-content-text").find("img");
		if (image != undefined) { image = image.attr("src") }
		output.image = `https:${image}`

		// format title
		output.title = output.title.replace(/ - .*(Wiki).*$/, "");

		return output;
	},
	facebook: function(cheerioRes, url) {
		const output = cheerioRes.extract({ canonicalUrl: { selector: "meta[property~='og:url']", value: "content" } });
		const regex_facebookPost = /^https?:\/\/(www.)?facebook.com\/[A-Za-z0-9\.]+\/posts\//;
		const regex_facebookAccount = /^https?:\/\/www.facebook.com\/@?([A-Za-z0-9\.]+)\/?/;

		// selects the inner post container for Facebook
		if (regex_facebookPost.test(output.canonicalUrl)) {
			// image/video posts
			output.linkType = "post";
			output.author = cheerioRes("meta[property~='og:title']").attr("content");
			output.title = `Post by ${output.author}`
			output.desc = cheerioRes("meta[property~='og:description']").attr("content");
			output.image = cheerioRes("meta[property~='og:image']").attr("content");
		} else if (regex_facebookAccount.test(output.canonicalUrl)) {
			output.linkType = "account";
			output.author = cheerioRes("meta[property~='og:title']").attr("content");
			output.title = output.author;
			output.image = cheerioRes("meta[property~='og:image']").attr("content");
			output.username = `@${output.canonicalUrl.match(regex_facebookAccount)[1]}`;
		} else {
			return {};
		}

		return output;
	},
	youtube: function(cheerioRes, url) {
		let output = {};
		const regex_youtubePost = /^https?:\/\/(www.)?youtu(be.com|youtu.be)\/watch\?v=[0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]/;
		const regex_getAccount = /@?([A-Za-z0-9_-])+$/;

		if (regex_youtubePost.test(url)) {
			output.linkType = "video";
			output.title = cheerioRes("title").text().replace(/ - YouTube$/, "");
			let topdiv = cheerioRes("div");
			output.canonicalUrl = topdiv.find("link[itemprop~='url']").attr("href");
			output.image = topdiv.find("link[itemprop~='thumbnailUrl']").attr("href");
			output.author = topdiv.find("span[itemprop~='author']").find("link").attr("href");
			output.likes = topdiv.find("div[itemprop~='interactionStatistic']").find("meta:nth-child(2)").attr("content");
			output.views = topdiv.find("div[itemprop~='interactionStatistic']:nth-of-type(2)").find("meta:nth-child(2)").attr("content");
			output.date = topdiv.find("meta[itemprop~=uploadDate]").attr("content");
			output.genre = topdiv.find("meta[itemprop~=genre]").attr("content");

			// output.author = output.author.match(regex_getAccount)[0];
		} else {
			return {};
		}

		return output;
	}
}

// goes over to a requested site and checks its text to be sent back to the user
app.post("/get-url-info", async(req, resp) => {
	const url = req.body.url;
	const embedType = req.body.embedType;
	console.log(url);

	// test if this link is valid (of if all the required parameters are present)
	if (url != undefined && embedType != undefined && embedType in websiteParser && regex_isLink.test(url)) {

		const cheerioRes = await getFromUrl(url);
		console.log(cheerioRes);
		if (cheerioRes === undefined) { // check if present
			// fail with getting Cheerio object, abort and inform client
			return resp.status(500).send({error: "Error with obtaining data from website"});
		} else {
			// cheerio object obtained, yay! :>
			// each website is structured differently and thus would need different methods of parsing.
			// use the below object websiteParser to shunt our code to the relevant method of parsing
			const websiteData = websiteParser[embedType](cheerioRes, url);
			return resp.status(200).send({data: websiteData});
		}
		//
	} else {
		// link is not valid, throw out an error (it's the client side's fault)
		console.log(`Not a url: ${url}`);
		return resp.status(400).send({error: "Not a URL"})

	}
});


app.listen(PORT, HOST);
console.log(`Backend now running on ${HOST}:${PORT} <3`);