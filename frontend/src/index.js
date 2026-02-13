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
		console.log(createdItems[0]);
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

// regex for getting the domain
const regex_domain = /(^https:\/\/[A-Za-z0-9\-\.]*)/
// regexes + methods for each individual embed type
const websites_mapping = {
	"facebook": {
		"regex": /^https:\/\/(.*\.)?(facebook).com/,
		"method": async function(link, websiteData, original) { console.log("Facebook"); return false; }
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
			const mainContainer = miro.board.createShape({
				content: `<b><u>${websiteData.title}</u></b><br />${websiteData.blurb}`,
				shape: "round_rectangle",
				style: {
					color: '#333333',
					fillColor: '#ffffff',
					fontFamily: 'Open Sans',
					textAlign: "left",
					borderStyle: 'normal',
    				borderOpacity: 1.0,
					borderColor: '#bbbbbb',
					borderWidth: 1,
					fillOpacity: 1.0,
				},

				x: original.x,
				y: original.y,
				width: 400,
				height: 250,
			});
			const faviconContainer = miro.board.createImage({
				url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Wikipedia_W_favicon_on_white_background.png?20160619003032",
				x: original.x - 190,
				y: original.y - 120,
				height: 50,

			})
			if (websiteData.image != undefined) {
				const imageContainer = miro.board.createImage({
					url: websiteData.image,
					x: original.x,
					y: original.y + 230,
					height: 200,
				})
				

				// ...await here and form a group
				Promise.all([mainContainer, faviconContainer, imageContainer]).then((res) => {
					miro.board.group({items: [res[0], res[1], res[2]]});
				})

			} else {
				// no images, just group main and favicon here				// ...await here and form a group
				Promise.all([mainContainer, faviconContainer]).then((res) => {
					miro.board.group({items: [res[0], res[1]]});
				})
			}
			

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