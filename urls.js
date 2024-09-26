class URLShortener{
	static get all(){
		return [new URLShortenerGoogl(),new URLShortenerFirebase()];
	}
	static async expand(url){
		const allExpanders = URLShortener.all;
		for(const expander of allExpanders){
			const result = await expander.expand(url);
			if(result) return result;
		}
		return null;
	}
	async expand(url){
		try{
			const prefix = `${this.prefix}/`;
			if (url.indexOf(prefix) < 0) {
		        url = prefix + url;
		    }
		    if (url.indexOf("http") < 0) {
		        url = "https://" + url;
		    }
			const longUrl = await this.expandSpecific(url);
			if(longUrl.indexOf("autoremotejoaomgcd.appspot.com") <= 0) return null;

			return longUrl;
		}catch(error){
			console.log(error);
			return null;
		}
	}
}
class URLShortenerGoogl extends URLShortener{
	async expandSpecific(shortUrl){
		const fetchResult = await fetch("https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCA_Pv_hiwRxmMOuchBcjsJPgZOZXvgIdQ&shortUrl=" + shortUrl);
        const response = await fetchResult.json();
        if (response.status != "OK") return null;

        return response.longUrl;
	}
	get prefix(){
		return "goo.gl";
	}
}
class URLShortenerFirebase extends URLShortener{
	async expandSpecific(shortUrl){
		const fetchResult = await fetch(shortUrl);
        return fetchResult.url;
	}
	get prefix(){
		return "autoremote.joaoapps.com";
	}
}