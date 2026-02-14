// initializes the app and sets up miro events
export async function init() {
	console.log("hello world<3");
	miro.board.ui.on('icon:click', async () => {
		await miro.board.ui.openPanel({ "url": 'app.html' }); 
	}); 
}

init();