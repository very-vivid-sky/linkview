const sitePath = "localhost:3000";
const iconsPath = `${sitePath}/icons`;

// initializes the app and sets up miro events
export async function init() {
	console.log("hello world<3");
	miro.board.ui.on('icon:click', async () => {
		await miro.board.ui.openPanel({ url: 'app.html' }); 
	}); 

	// takes over the items:create event when an embed is detected
	// and replaces it with our own custom app-embed
	miro.board.ui.on("items:create", async(event) => {
		// filter out creation of Embed objects
		const createdItems = event.items;
		// console.log(createdItems[0]);
		const embeds = createdItems.filter((item) => item.type === "embed");

		for (let item of embeds) {
			const url = item.url;
			const newEmbedType = await getDomainAsEnum(url);
			if (newEmbedType in websites_mapping) {
				const websiteData = await getFromUrl(url, newEmbedType);
				// run the script to create the new embed card and get the signal on whether to remove the old one
				const removeOriginal = await websites_mapping[newEmbedType].method(url, websiteData, item);
				if (removeOriginal === true) {
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
}

// joins together all objects in array but only if they are present and are a promise
async function waitAndGroup(objectArray) {
	return new Promise((resolve) => {
		// let promiseArray = objectArray.filter((i) => typeof(i) == "Promise");
		Promise.all(objectArray).then((res) => {
			// remove all non-objects
			let createdObjectArray = res.filter((i) => typeof(i) == "object")

			// if one, no need to group - resolve right away
			if (createdObjectArray.length < 2) { resolve(undefined); }

			miro.board.group({items: createdObjectArray}).then(group => {
				resolve(group);
			});
		});
	});
}

// returns a template for a default main style
function getDefaultMainStyle(borderColor="#000000", textAlign="left", fontSize=14) {
	console.log(textAlign)
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
						content: `<b><u>${websiteData.title}</u></b><br />${websiteData.desc}`,
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
						content: `<br/><br/><br/><br/><br/><br/><br/><b><u>${websiteData.title}</b></u><br>${websiteData.username}`,
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

			// create new WikimediaEmbed
			let mainContainer = miro.board.createShape({
				content: `<b><u>${websiteData.title}</u></b><br />${websiteData.blurb}`,
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
		"method": async function(link, websiteData, original) { console.log("YouTube"); return false; }
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
init(); 


// fires a request to the backend to get data for this url
const backendPort = "5000";
const backendHost = "localhost";

async function getFromUrl(link, embedType) {
	return new Promise((resolve) => {
		try {
			// pass this over to the backend
			fetch(`http://${backendHost}:${backendPort}/get-url-info`, {
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
				console.log(data);
				resolve(data.data);
			})
		} catch(e) {
			resolve(undefined);
		}
	});
}