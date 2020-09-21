// all urls will be added to cache
export default function cacheAssets(assets: string[]) {
    return new Promise( function (resolve, reject) {
      // open cache
      caches.open("assets")
        .then(cache => {
          // the API does all the magic for us
          cache.addAll(assets)
            .then(() => {
              console.log("all assets added to cache")
              resolve()
            })
            .catch(err => {
              console.log("error when syncing assets", err)
              reject()
            })
        }).catch(err => {
          console.log("error when opening cache", err)
          reject()
        })
    });
}