const config = {
  "messagingSenderId": "147354672683"
};
const firebaseApp = firebase.initializeApp(config);

class FCM {
	constructor(){
		this.messaging = firebase.messaging(firebaseApp);
		this.messaging.usePublicVapidKey("BM7FpnBBZ069HYditN7FnTktBreaYwCIrKTFo0Kd6PIiTuB-zH7l4rwKfFlE1mUAZa0jdHQfqsjwX7u5iKzM0ho");
		this.messaging.onMessage(payload=>{
			console.log(payload);
			if(!this.messageHandler) return;

			
		});
	}
	async hasNavigatorPermission() {
		const status = await navigator.permissions.query({name: 'notifications'});
		return status.state === 'granted';
	}
	async getToken(){
		const hasPermission = await this.hasNavigatorPermission();
		if(!hasPermission){
			throw new Error("No permission to receive notifications");
		}
		const token = await this.messaging.getToken();
		return token;
	}
	async requestPermission(){
		await this.messaging.requestPermission();
		console.log("OK permissions!");
	}

	setOnMessageHandler(handler){
		this.messageHandler = handler;
	}
}