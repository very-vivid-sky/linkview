import * as React from 'react'; 
import { createRoot } from 'react-dom/client'; 
// import * as env from "dotenv";
const { miro } = window;

// get environmental variables
const BACKEND_LINK = import.meta.env.VITE_BACKEND_LINK;

import '../src/assets/style.css'; 

// joins together all objects in array but only if they are present and are a promise
async function waitAndGroup(objectArray) {
	return new Promise((resolve) => {
		let promiseArray = objectArray.filter((i) => typeof(i) != undefined);
		console.log(promiseArray);

		// if one, no need to group - resolve right away
		if (promiseArray.length < 2) { resolve(undefined); }

		Promise.all(promiseArray).then((res) => {
			// remove all non-objects
			let createdObjectArray = res.filter((i) => typeof(i) == "object")

			miro.board.group({items: createdObjectArray}).then(group => {
				resolve(group);
			});
		});
	});
}

// returns a template for a default main style
function getDefaultMainStyle(borderColor="#000000", textAlign="left", fontSize=14) {
	return {
		color: '#333333',
		fillColor: '#ffffff',
		fontFamily: 'Open Sans',
		textAlign: textAlign,
		fontSize: fontSize,
		borderStyle: 'normal',
		borderOpacity: 1.0,
		borderColor: borderColor,
		borderWidth: 2,
		fillOpacity: 1.0,
	}
}

// regex for getting the domain
const regex_domain = /(^https:\/\/[A-Za-z0-9\-\.]*)/
// regexes + methods for each individual embed type
const websites_mapping = {
	"facebook": {
		"regex": /^https:\/\/(.*\.)?(facebook).com/,
		"method": async function(link, websiteData, original) {
			console.log("Facebook");
			let mainContainer, faviconContainer, imageContainer;

			// shunt based on link type
			switch(websiteData.linkType) {
				case "post":
					mainContainer = miro.board.createShape({
						content: `<b><u><a href=${websiteData.canonicalUrl}>${websiteData.title}</a></u></b><br />${websiteData.desc}`,
						shape: "round_rectangle",
						style: getDefaultMainStyle("#17A9FD"),
						x: original.x,
						y: original.y,
						width: 400,
						height: 250,
					})

					faviconContainer = miro.board.createImage({
						url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/120px-2023_Facebook_icon.svg.png?20231011122028",
						x: original.x - 190,
						y: original.y - 120,
						height: 50,
					})
					
					if (websiteData.image != undefined) {
						// has image to add
						imageContainer = miro.board.createImage({
							url: websiteData.image,
							x: original.x,
							y: original.y + 230,
							height: 200,
						})
					}

					break;

				case "account":
					mainContainer = miro.board.createShape({
						content: `<br/><br/><br/><br/><br/><br/><br/><b><u><a href=${websiteData.canonicalUrl}>${websiteData.title}</a></b></u><br>${websiteData.username}`,
						shape: "round_rectangle",
						style: getDefaultMainStyle("#17A9FD", "center", 20),
						x: original.x,
						y: original.y,
						width: 400,
						height: 300,
					})
					

					faviconContainer = miro.board.createImage({
						url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/120px-2023_Facebook_icon.svg.png?20231011122028",
						x: original.x - 180,
						y: original.y - 140,
						height: 50,
					})
					
					if (websiteData.image != undefined) {
						// has image to add
						imageContainer = miro.board.createImage({
							url: websiteData.image,
							x: original.x,
							y: original.y - 33,
							height: 200,
						})
					}
					
					break;

				default:
					return false; break;
			}


			await waitAndGroup([mainContainer, faviconContainer, imageContainer]);
			return true;
		}
	},
	"github": {
		"regex": /^https:\/\/(.*\.)?(github).com/,
		"method": async function(link, websiteData, original) { console.log("Github"); return false; }
	},
	// fold wikimedia sites under the same embed type - they are all generally similar to parse :)
	"wikimedia": {
		"regex": /^https:\/\/(.*\.)?(wikipedia|wikimedia|wiktionary|mediawiki|wikimedia).org/,
		"method": async function(link, websiteData, original) {
			console.log("Wikimedia");
			console.log(link);

			// create new WikimediaEmbed
			let mainContainer = miro.board.createShape({
				content: `<b><u><a href=${websiteData.canonicalUrl}>${websiteData.title}</a></u></b><br />${websiteData.blurb}`,
				shape: "round_rectangle",
				style: getDefaultMainStyle("#bbbbbb"),

				x: original.x,
				y: original.y,
				width: 400,
				height: 250,
			});
			let faviconContainer = miro.board.createImage({
				url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Wikipedia_W_favicon_on_white_background.png?20160619003032",
				x: original.x - 190,
				y: original.y - 120,
				height: 50,

			})

			// imagecontainer only if it exists
			let imageContainer;
			if (websiteData.image != undefined) {
				imageContainer = miro.board.createImage({
					url: websiteData.image,
					x: original.x,
					y: original.y + 230,
					height: 200,
				})
			}
			
			await waitAndGroup([mainContainer, faviconContainer, imageContainer]); // group together :>
			return true;
		}
	},
	"youtube": {
		"regex": /^https:\/\/(.*\.)?(youtube).com/,
		"method": async function(link, websiteData, original) {
			console.log(websiteData);
			let mainContainer, faviconContainer, imageContainer, likesContainer, viewsContainer;
			if (websiteData.linkType == "video") {
				mainContainer = miro.board.createShape({
				content: `<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><b><u><a href=${websiteData.canonicalUrl}>${websiteData.title}</a></u></b><br>by ${websiteData.author}`,
				shape: "round_rectangle",
				style: getDefaultMainStyle("#FF0033", "center"),

				x: original.x,
				y: original.y,
				width: 400,
				height: 300,
				});

			faviconContainer = miro.board.createImage({
				url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/YouTube_full-color_icon_%282024%29.svg/1280px-YouTube_full-color_icon_%282024%29.svg.png?20241018202936",
				x: original.x - 190,
				y: original.y - 150,
				height: 50,
			})

			if (websiteData.image != undefined) {
				imageContainer = miro.board.createImage({
					url: websiteData.image,
					x: original.x,
					y: original.y - 33,
					height: 180,
				})
			}

			likesContainer = miro.board.createShape({
				content: `${websiteData.likes} likes`,
				shape: "round_rectangle",
				style: {
					color: '#333333', fontFamily: 'Open Sans', textAlign: "center", fontSize: 14,
					borderStyle: 'normal', borderOpacity: 1.0, borderColor: "#FF0033", borderWidth: 2,
					fillOpacity: 1.0,  fillColor: "#ffffff88"
				},
				x: original.x - 80,
				y: original.y + 170,
				width: 150,
				height: 25,
			})

			viewsContainer = miro.board.createShape({
				content: `${websiteData.views} views`,
				shape: "round_rectangle",
				style: {
					color: '#333333', fontFamily: 'Open Sans', textAlign: "center", fontSize: 14,
					borderStyle: 'normal', borderOpacity: 1.0, borderColor: "#FF0033", borderWidth: 2,
					fillOpacity: 1.0, fillColor: "#ffffff88"
				},
				x: original.x + 80,
				y: original.y + 170,
				width: 150,
				height: 25,
			})

			} else {
				return false;
			}

			await waitAndGroup([mainContainer, faviconContainer, imageContainer, likesContainer, viewsContainer]); // group together :>
			return true;
		}
	},
}

// not really an enum, but basically outputs them like one
// determines what output type to create this as
async function getDomainAsEnum(link) {
	// strip link to just the domain
	let domain = link.match(regex_domain);
	
	if (domain.length == 0) { return "__other"; } // quickfail
	else (domain = domain[0]);

	for (let rgx_curr in websites_mapping) {
		if (websites_mapping[rgx_curr].regex.test(domain)) {
			return rgx_curr;
		}
	}

	// if hasn't been marked yet
	return "__other";
}


// fires a request to the backend to get data for this url
async function getFromUrl(link, embedType) {
	return new Promise((resolve) => {
		try {
			// pass this over to the backend
			fetch(`${BACKEND_LINK}/get-url-info`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					url: link,
					embedType: embedType,
				})
			}).then(resp => resp.json()).then(data => {
				if (data.error != undefined) { return undefined; } // shunt for errors
				// console.log(data);
				resolve(data.data);
			})
		} catch(e) {
			resolve(undefined);
		}
	});
}

// borrow the item creation process so that we can use it to immediately replace pasted embeds
miro.board.ui.on("items:create", async(event) => {
	// filter out creation of Embed objects
	const createdItems = event.items;
	const embeds = createdItems.filter((item) => item.type === "embed");

	for (let item of embeds) {
		const url = item.url;
		const newEmbedType = await getDomainAsEnum(url);
		if (newEmbedType in websites_mapping) {
			const websiteData = await getFromUrl(url, newEmbedType);
			// run the script to create the new embed card and get the signal on whether to remove the old one
			const removeOriginal = await websites_mapping[newEmbedType].method(url, websiteData, item);
			if (removeOriginal === true) {
				console.log("hi");
				miro.board.remove(item);
			} 
			return; break;
		} else {
			// default case
			console.log(`(unknown embed type ${url}`);
			return; break;
		}
	}
});

const App = () => {	
	console.log("Linkview now running <3");
	return ( <div className="" style={{display: "flex", "flexDirection": "column", width: "100%", gap: "1ex"}}>
			<div className="" style={{display: "flex", "flexDirection": "column", width: "100%"}}>
				<h1 style={{margin: "0%", "flexGrow": 1}}>Linkview</h1>
				<div style={{}}>by Cy Bautista</div>
				<hr />
				<div><i>Keep this pane open! Links you paste (or copy from default embeds) would be converted into custom Linkview embeds while it is up.</i></div>
			</div>
	</div> )
};

const container = document.getElementById('root'); 
const root = createRoot(container); 
root.render(<App />); 
// <!-- <input type="submit" style={{display: "none"}} /> -->
/*

			<hr style={{margin: "1ex"}}/>
			<div class=""> Paste your link below! </div>
			<input name="linkToConvert" className="input" style={{width: "100%"}} />
			<button className="button button-primary" onClick={handleCreateCard}>Create</button>
*/