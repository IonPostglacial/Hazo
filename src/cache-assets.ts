function* popChunks<T>(array: T[], chunkSize: number): Generator<T[]> {
    const chunksNumber = Math.ceil(array.length / chunkSize);
	const initialLength = array.length;
    
    for (let i = 0; i < chunksNumber; i++) {
        yield array.splice(Math.max(0, initialLength - (i + 1) * chunkSize));
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function cacheAssets(assets: string[]) {
    // try {
    //     const cache = await caches.open("assets");
    //     for (const urlChunk of popChunks(assets, 50)) {
    //         try {
    //             await cache.addAll(urlChunk);
    //             await sleep(10_000);
    //         } catch(err) {
    //             console.warn("error when syncing assets", err);
    //         }
    //     }
    //     console.log("all assets added to cache");
    // } catch(err) {
    //     console.error("error when opening cache", err);
    // }
}