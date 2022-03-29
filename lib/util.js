const promisify = (fn) => {
  return function(...args) {
    return new Promise((resolve, reject) => {
      const callback = function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      }

      args.push(callback)
      fn.apply(this, args)
    })
  }
}

const identity = (x) => x

module.exports = {
  promisify,
  identity
}

