import * as React from 'react'; 
import { createRoot } from 'react-dom/client'; 

import '../src/assets/style.css'; 

/*
async function addSticky() {
		const stickyNote = await miro.board.createStickyNote({
				content: 'enby rights!!!!!', 
		}); 
		
		await miro.board.viewport.zoomTo(stickyNote); 
} 
*/

async function handleCreateCard() {
	console.log();
	res = await fetch(`http://localhost:5000/get-url-text`);
	console.log(res);
}

const regex_domain = /(^https:\/\/[A-Za-z0-9\-\.]*)/
const websites_mapping = {
	"facebook": {
		"regex": /^https:\/\/(.*\.)?(facebook).com/,
		"method": async function(link) { console.log("Facebook"); }
	},
	"github": {
		"regex": /^https:\/\/(.*\.)?(github).com/,
		"method": async function(link) { console.log("Github"); }
	},
	// fold wikimedia sites under the same embed type - they are all generally similar to parse :)
	"wikimedia": {
		"regex": /^https:\/\/(.*\.)?(wikipedia|wikimedia|wiktionary|mediawiki|wikimedia).org/,
		"method": async function(link) {
			console.log("Wikipedia");
			await getFromUrl(link);
		}
	},
	"youtube": {
		"regex": /^https:\/\/(.*\.)?(youtube).com/,
		"method": async function(link) { console.log("YouTube"); }
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

const App = () => {
	/*
		React.useEffect(() => {
				addSticky(); 
		}, []); 
		
		return ( <div className="grid wrapper"> 
			<div className="cs1 ce12"> 
				<img src="/src/assets/congratulations.png" alt=""/> 
			</div> 
			<div className="cs1 ce12"> 
				<h1>Congratulations!</h1> 
				<p>You've just created your first Miro app!</p> 
				<p> 
					To explore more and build your own app, see the Miro Developer
					Platform documentation.
				</p> 
			</div> 
			<div className="cs1 ce12"> 
				<a  className="button button-primary"  target="_blank"  href="https://developers.miro.com" > 
					Read the documentation
				</a> 
			</div> 
		</div> ); 
	*/
	
	return ( <div className="" style={{display: "flex", "flexDirection": "column", width: "100%", gap: "1ex"}}>
			<div className="" style={{display: "flex", "flexDirection": "column", width: "100%"}}>
				<h1 style={{margin: "0%", "flex-grow": 1}}>Linkview</h1>
				<div style={{}}>by Cy Bautista</div>
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